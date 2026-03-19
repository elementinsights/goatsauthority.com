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

const CONCURRENCY = 3;
const DELAY_BETWEEN_MS = 300; // delay after each download in a worker
const MAX_RETRIES = 5;

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
// XML helpers
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
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Download with redirect following
// ---------------------------------------------------------------------------

function downloadFile(url, destPath, maxRedirects = 5) {
  return new Promise((resolveP, rejectP) => {
    if (maxRedirects <= 0) {
      return rejectP(new Error(`Too many redirects`));
    }

    // Encode spaces in URL
    const safeUrl = url.replace(/ /g, "%20");
    const client = safeUrl.startsWith("https") ? https : http;

    const request = client.get(safeUrl, { timeout: 30000 }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        const location = response.headers.location;
        if (!location) {
          return rejectP(new Error(`Redirect with no location`));
        }
        const redirectUrl = location.startsWith("http")
          ? location
          : new URL(location, safeUrl).href;
        return resolveP(downloadFile(redirectUrl, destPath, maxRedirects - 1));
      }

      if (response.statusCode === 429) {
        response.resume();
        return rejectP(new Error(`RATE_LIMITED`));
      }

      if (response.statusCode !== 200) {
        response.resume();
        return rejectP(new Error(`HTTP ${response.statusCode}`));
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length === 0) {
          return rejectP(new Error(`Empty response`));
        }
        writeFileSync(destPath, buffer);
        resolveP(buffer.length);
      });
      response.on("error", rejectP);
    });

    request.on("error", rejectP);
    request.on("timeout", () => {
      request.destroy();
      rejectP(new Error(`Timeout`));
    });
  });
}

async function downloadWithRetry(url, destPath) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await downloadFile(url, destPath);
    } catch (err) {
      if (err.message === "RATE_LIMITED" && attempt < MAX_RETRIES) {
        const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await sleep(backoff);
        continue;
      }
      if (attempt < MAX_RETRIES && (err.message === "Timeout" || err.code === "ECONNRESET")) {
        await sleep(2000);
        continue;
      }
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Worker pool — each worker picks the next task from a shared queue
// ---------------------------------------------------------------------------

async function runWorkerPool(taskFns, concurrency, delayMs) {
  let nextIndex = 0;

  async function worker(workerId) {
    while (nextIndex < taskFns.length) {
      const i = nextIndex++;
      await taskFns[i]();
      if (delayMs > 0) await sleep(delayMs);
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(concurrency, taskFns.length); w++) {
    // Stagger worker starts slightly
    if (w > 0) await sleep(100);
    workers.push(worker(w));
  }
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Update frontmatter `image` field
// ---------------------------------------------------------------------------

function updateFrontmatterImage(mdPath, imagePath) {
  const content = readFileSync(mdPath, "utf-8");

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;

  const frontmatter = fmMatch[1];

  // Try quoted form first: image: "..."
  const quotedRe = /^image:\s*".*?"$/m;
  if (quotedRe.test(frontmatter)) {
    const newFm = frontmatter.replace(quotedRe, `image: "${imagePath}"`);
    writeFileSync(mdPath, content.replace(fmMatch[0], `---\n${newFm}\n---`), "utf-8");
    return true;
  }

  // Try unquoted: image: ...
  const unquotedRe = /^image:\s*.*$/m;
  if (unquotedRe.test(frontmatter)) {
    const newFm = frontmatter.replace(unquotedRe, `image: "${imagePath}"`);
    writeFileSync(mdPath, content.replace(fmMatch[0], `---\n${newFm}\n---`), "utf-8");
    return true;
  }

  return false;
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

  // Step 1: Build attachment map (post_id -> attachment_url)
  const attachmentMap = new Map();
  for (const item of items) {
    const postType = getTagContent(item, "wp:post_type");
    if (postType !== "attachment") continue;
    const postId = getTagContent(item, "wp:post_id");
    const attachmentUrl = getTagContent(item, "wp:attachment_url");
    if (postId && attachmentUrl) {
      attachmentMap.set(postId, attachmentUrl);
    }
  }
  console.log(`Built attachment map: ${attachmentMap.size} attachments\n`);

  // Step 2: Find published posts with _thumbnail_id
  const postsToProcess = [];
  for (const item of items) {
    const postType = getTagContent(item, "wp:post_type");
    if (postType !== "post") continue;
    const status = getTagContent(item, "wp:status");
    if (status !== "publish") continue;
    const slug = getTagContent(item, "wp:post_name");
    if (!slug) continue;

    const metas = extractPostMeta(item);
    const thumbnailMeta = metas.find((m) => m.key === "_thumbnail_id");
    if (!thumbnailMeta || !thumbnailMeta.value) continue;

    const attachmentUrl = attachmentMap.get(thumbnailMeta.value);
    if (!attachmentUrl) {
      console.warn(`  Post "${slug}": thumbnail_id=${thumbnailMeta.value} not found in attachments`);
      continue;
    }
    postsToProcess.push({ slug, attachmentUrl });
  }
  console.log(`Found ${postsToProcess.length} published posts with featured images\n`);

  // Step 3: Create output directory
  mkdirSync(IMAGES_DIR, { recursive: true });

  // Step 4: Build tasks and run
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const failures = [];
  let processed = 0;

  const taskFns = postsToProcess.map(({ slug, attachmentUrl }) => {
    return async () => {
      processed++;
      const progress = `[${processed}/${postsToProcess.length}]`;

      // Determine extension from URL
      const urlPath = new URL(attachmentUrl.replace(/ /g, "%20")).pathname;
      let ext = extname(decodeURIComponent(urlPath)).toLowerCase();
      if (!ext) ext = ".jpg";

      const destFilename = `${slug}${ext}`;
      const destPath = resolve(IMAGES_DIR, destFilename);
      const publicPath = `/images/posts/${destFilename}`;

      // Skip if already downloaded
      if (existsSync(destPath)) {
        const mdPath = resolve(POSTS_DIR, `${slug}.md`);
        if (existsSync(mdPath)) updateFrontmatterImage(mdPath, publicPath);
        skippedCount++;
        console.log(`${progress} [SKIP] ${slug}`);
        return;
      }

      try {
        const bytes = await downloadWithRetry(attachmentUrl, destPath);
        const kb = (bytes / 1024).toFixed(0);
        console.log(`${progress} [OK]   ${destFilename} (${kb} KB)`);

        const mdPath = resolve(POSTS_DIR, `${slug}.md`);
        if (existsSync(mdPath)) {
          updateFrontmatterImage(mdPath, publicPath);
        } else {
          console.warn(`  Warning: No .md file for "${slug}"`);
        }
        successCount++;
      } catch (err) {
        const msg = err.message === "RATE_LIMITED"
          ? "Rate limited (exhausted retries)"
          : err.message;
        console.log(`${progress} [FAIL] ${slug}: ${msg}`);
        failCount++;
        failures.push({ slug, url: attachmentUrl, error: msg });
      }
    };
  });

  console.log(`Downloading with concurrency=${CONCURRENCY}, delay=${DELAY_BETWEEN_MS}ms, retries=${MAX_RETRIES}\n`);
  const startTime = Date.now();
  await runWorkerPool(taskFns, CONCURRENCY, DELAY_BETWEEN_MS);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total posts with featured images: ${postsToProcess.length}`);
  console.log(`Successfully downloaded: ${successCount}`);
  console.log(`Already existed (skipped): ${skippedCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Time: ${elapsed}s`);

  if (failures.length > 0) {
    console.log(`\nFailed downloads (${failures.length}):`);
    for (const f of failures) {
      console.log(`  - ${f.slug}: ${f.error}`);
      console.log(`    ${f.url}`);
    }
  }

  console.log(`\nImages saved to: ${IMAGES_DIR}`);
  console.log(`Frontmatter updated in: ${POSTS_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
