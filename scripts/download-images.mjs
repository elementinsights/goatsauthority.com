#!/usr/bin/env node

/**
 * Download Featured Images from WordPress XML Export
 *
 * Usage: node scripts/download-images.mjs [path/to/export.xml]
 *
 * Parses the WP XML to find featured images for each published post,
 * downloads them to public/images/posts/[slug].[ext], and updates
 * the post frontmatter `image` field.
 *
 * Zero external dependencies — uses only Node.js built-in modules.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, extname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const POSTS_DIR = resolve(PROJECT_ROOT, "src/content/posts");
const IMAGES_DIR = resolve(PROJECT_ROOT, "public/images/posts");

const CONCURRENCY = 10;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const xmlPath = process.argv[2] || resolve(PROJECT_ROOT, "WordPress.2026-03-19.xml");
const resolvedXmlPath = resolve(xmlPath);
if (!existsSync(resolvedXmlPath)) {
  console.error(`File not found: ${resolvedXmlPath}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// XML helpers (same approach as import-wp.mjs — no dependencies)
// ---------------------------------------------------------------------------

function stripCDATA(str) {
  return str.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
}

function getTagContent(xml, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return stripCDATA(m[1]).trim();
}

function extractItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return items;
}

/**
 * Extract all <wp:postmeta> blocks from an item, returning an array of
 * { key, value } objects.
 */
function extractPostMeta(itemXml) {
  const metas = [];
  const re = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/gi;
  let m;
  while ((m = re.exec(itemXml)) !== null) {
    const block = m[1];
    const key = getTagContent(block, "wp:meta_key");
    const value = getTagContent(block, "wp:meta_value");
    metas.push({ key, value });
  }
  return metas;
}

// ---------------------------------------------------------------------------
// Download helper with redirect following
// ---------------------------------------------------------------------------

function downloadFile(url, destPath, maxRedirects = 5) {
  return new Promise((resolveP, rejectP) => {
    if (maxRedirects <= 0) {
      return rejectP(new Error(`Too many redirects for ${url}`));
    }

    const client = url.startsWith("https") ? https : http;

    const request = client.get(url, { timeout: 30000 }, (response) => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const location = response.headers.location;
        if (!location) {
          return rejectP(new Error(`Redirect with no location for ${url}`));
        }
        // Resolve relative redirects
        const redirectUrl = location.startsWith("http")
          ? location
          : new URL(location, url).href;
        return resolveP(downloadFile(redirectUrl, destPath, maxRedirects - 1));
      }

      if (response.statusCode !== 200) {
        response.resume(); // drain the response
        return rejectP(
          new Error(`HTTP ${response.statusCode} for ${url}`)
        );
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length === 0) {
          return rejectP(new Error(`Empty response for ${url}`));
        }
        writeFileSync(destPath, buffer);
        resolveP(buffer.length);
      });
      response.on("error", rejectP);
    });

    request.on("error", rejectP);
    request.on("timeout", () => {
      request.destroy();
      rejectP(new Error(`Timeout downloading ${url}`));
    });
  });
}

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Update frontmatter `image` field in a markdown file
// ---------------------------------------------------------------------------

function updateFrontmatterImage(mdPath, imagePath) {
  const content = readFileSync(mdPath, "utf-8");

  // Match the frontmatter block
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    console.warn(`  Warning: No frontmatter found in ${mdPath}`);
    return false;
  }

  const frontmatter = fmMatch[1];
  // Replace the image field — handles image: "" or image: "/some/path"
  const imageLineRe = /^image:\s*".*?"$/m;
  if (!imageLineRe.test(frontmatter)) {
    // Try without quotes
    const imageLineRe2 = /^image:\s*.*$/m;
    if (!imageLineRe2.test(frontmatter)) {
      console.warn(`  Warning: No image field in frontmatter of ${mdPath}`);
      return false;
    }
    const newFrontmatter = frontmatter.replace(
      imageLineRe2,
      `image: "${imagePath}"`
    );
    const newContent = content.replace(fmMatch[0], `---\n${newFrontmatter}\n---`);
    writeFileSync(mdPath, newContent, "utf-8");
    return true;
  }

  const newFrontmatter = frontmatter.replace(
    imageLineRe,
    `image: "${imagePath}"`
  );
  const newContent = content.replace(fmMatch[0], `---\n${newFrontmatter}\n---`);
  writeFileSync(mdPath, newContent, "utf-8");
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Reading XML: ${resolvedXmlPath}`);
  const xml = readFileSync(resolvedXmlPath, "utf-8");
  console.log(`XML size: ${(Buffer.byteLength(xml) / 1024 / 1024).toFixed(1)} MB`);

  const items = extractItems(xml);
  console.log(`Found ${items.length} total items in XML\n`);

  // Step 1: Build attachment map (post_id → attachment_url)
  const attachmentMap = new Map(); // post_id string → URL
  let attachmentCount = 0;

  for (const item of items) {
    const postType = getTagContent(item, "wp:post_type");
    if (postType !== "attachment") continue;

    const postId = getTagContent(item, "wp:post_id");
    const attachmentUrl = getTagContent(item, "wp:attachment_url");

    if (postId && attachmentUrl) {
      attachmentMap.set(postId, attachmentUrl);
      attachmentCount++;
    }
  }
  console.log(`Built attachment map: ${attachmentCount} attachments\n`);

  // Step 2: Find published posts with _thumbnail_id
  const postsToProcess = []; // { slug, thumbnailId, attachmentUrl }

  for (const item of items) {
    const postType = getTagContent(item, "wp:post_type");
    if (postType !== "post") continue;

    const status = getTagContent(item, "wp:status");
    if (status !== "publish") continue;

    const slug = getTagContent(item, "wp:post_name");
    if (!slug) continue;

    // Find _thumbnail_id in postmeta
    const metas = extractPostMeta(item);
    const thumbnailMeta = metas.find((m) => m.key === "_thumbnail_id");
    if (!thumbnailMeta || !thumbnailMeta.value) continue;

    const thumbnailId = thumbnailMeta.value;
    const attachmentUrl = attachmentMap.get(thumbnailId);

    if (!attachmentUrl) {
      console.warn(`  Post "${slug}": thumbnail_id=${thumbnailId} not found in attachments — skipping`);
      continue;
    }

    postsToProcess.push({ slug, thumbnailId, attachmentUrl });
  }

  console.log(`Found ${postsToProcess.length} published posts with featured images\n`);

  // Step 3: Create output directory
  mkdirSync(IMAGES_DIR, { recursive: true });

  // Step 4: Download images with concurrency
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const failures = [];

  const tasks = postsToProcess.map(({ slug, attachmentUrl }) => {
    return async () => {
      // Determine extension from the URL
      const urlPath = new URL(attachmentUrl).pathname;
      let ext = extname(urlPath).toLowerCase();
      // Clean up extensions like ".jpg?v=123" (shouldn't happen from WP but just in case)
      ext = ext.replace(/\?.*$/, "");
      if (!ext) ext = ".jpg"; // fallback

      // Remove "-scaled" from extension area if present in the URL
      // (WP sometimes appends -scaled before extension)
      const destFilename = `${slug}${ext}`;
      const destPath = resolve(IMAGES_DIR, destFilename);
      const publicPath = `/images/posts/${destFilename}`;

      // Skip if already downloaded
      if (existsSync(destPath)) {
        // Still update frontmatter
        const mdPath = resolve(POSTS_DIR, `${slug}.md`);
        if (existsSync(mdPath)) {
          updateFrontmatterImage(mdPath, publicPath);
        }
        skippedCount++;
        process.stdout.write(`  [SKIP] ${slug} (already exists)\n`);
        return { slug, success: true, skipped: true };
      }

      try {
        const bytes = await downloadFile(attachmentUrl, destPath);
        const kb = (bytes / 1024).toFixed(0);
        process.stdout.write(`  [OK]   ${slug}${ext} (${kb} KB)\n`);

        // Update frontmatter
        const mdPath = resolve(POSTS_DIR, `${slug}.md`);
        if (existsSync(mdPath)) {
          updateFrontmatterImage(mdPath, publicPath);
        } else {
          console.warn(`  Warning: No markdown file found for slug "${slug}"`);
        }

        successCount++;
        return { slug, success: true };
      } catch (err) {
        process.stdout.write(`  [FAIL] ${slug}: ${err.message}\n`);
        failCount++;
        failures.push({ slug, url: attachmentUrl, error: err.message });
        return { slug, success: false };
      }
    };
  });

  console.log(`Downloading ${postsToProcess.length} images (concurrency: ${CONCURRENCY})...\n`);
  await runWithConcurrency(tasks, CONCURRENCY);

  // Step 5: Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total posts with featured images: ${postsToProcess.length}`);
  console.log(`Successfully downloaded: ${successCount}`);
  console.log(`Already existed (skipped): ${skippedCount}`);
  console.log(`Failed: ${failCount}`);

  if (failures.length > 0) {
    console.log("\nFailed downloads:");
    for (const f of failures) {
      console.log(`  - ${f.slug}: ${f.error}`);
      console.log(`    URL: ${f.url}`);
    }
  }

  console.log(`\nImages saved to: ${IMAGES_DIR}`);
  console.log(`Frontmatter updated in: ${POSTS_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
