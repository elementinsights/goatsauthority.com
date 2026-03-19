#!/usr/bin/env node

/**
 * Retry downloading featured images for posts that still have image: ""
 * Uses slower rate to avoid WP server throttling.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT = resolve(__dirname, "..");
const POSTS_DIR = resolve(PROJECT, "src/content/posts");
const IMAGES_DIR = resolve(PROJECT, "public/images/posts");
const XML_PATH = resolve(PROJECT, "WordPress.2026-03-19.xml");

// Parse XML to build slug → image URL map
function buildImageMap() {
  const xml = readFileSync(XML_PATH, "utf-8");

  // Build attachment ID → URL map
  const attachments = {};
  const attachRe = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = attachRe.exec(xml)) !== null) {
    const block = m[1];
    const typeMatch = block.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/);
    if (!typeMatch || typeMatch[1] !== "attachment") continue;
    const idMatch = block.match(/<wp:post_id>(\d+)<\/wp:post_id>/);
    const urlMatch = block.match(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/);
    if (idMatch && urlMatch) {
      attachments[idMatch[1]] = urlMatch[1];
    }
  }

  // Build slug → image URL map
  const slugToImage = {};
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const typeMatch = block.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/);
    if (!typeMatch || typeMatch[1] !== "post") continue;
    const statusMatch = block.match(/<wp:status><!\[CDATA\[(.*?)\]\]><\/wp:status>/);
    if (!statusMatch || statusMatch[1] !== "publish") continue;

    const slugMatch = block.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/);
    if (!slugMatch) continue;
    const slug = slugMatch[1];

    // Find _thumbnail_id
    const thumbMatch = block.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/);
    if (thumbMatch && attachments[thumbMatch[1]]) {
      slugToImage[slug] = attachments[thumbMatch[1]];
    }
  }
  return slugToImage;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function downloadImage(url, destPath) {
  try {
    execSync(`curl -sL --max-time 30 -o "${destPath}" "${url}" 2>/dev/null`);
    // Check if it's actually an image
    const result = execSync(`file "${destPath}"`).toString();
    if (result.includes("image") || result.includes("JPEG") || result.includes("PNG") || result.includes("RIFF")) {
      return true;
    }
    // Not an image, remove
    execSync(`rm "${destPath}"`);
    return false;
  } catch {
    return false;
  }
}

async function main() {
  const slugToImage = buildImageMap();
  console.log(`Built image map: ${Object.keys(slugToImage).length} entries`);

  // Find posts with empty images
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  const needsImage = [];

  for (const file of files) {
    const content = readFileSync(resolve(POSTS_DIR, file), "utf-8");
    if (content.includes('image: ""')) {
      const slug = file.replace(/\.md$/, "");
      if (slugToImage[slug]) {
        needsImage.push({ slug, file, url: slugToImage[slug] });
      }
    }
  }

  console.log(`Found ${needsImage.length} posts needing images\n`);

  let ok = 0, fail = 0;
  for (let i = 0; i < needsImage.length; i++) {
    const { slug, file, url } = needsImage[i];
    const ext = extname(url).split("?")[0] || ".webp";
    const destPath = resolve(IMAGES_DIR, `${slug}${ext}`);

    // Check if already exists
    if (existsSync(destPath)) {
      // Update frontmatter
      const content = readFileSync(resolve(POSTS_DIR, file), "utf-8");
      const updated = content.replace('image: ""', `image: "/images/posts/${slug}${ext}"`);
      writeFileSync(resolve(POSTS_DIR, file), updated);
      ok++;
      console.log(`[${i+1}/${needsImage.length}] [EXISTS] ${slug}`);
      continue;
    }

    const success = await downloadImage(url, destPath);
    if (success) {
      // Detect actual extension
      const fileInfo = execSync(`file "${destPath}"`).toString();
      let actualExt = ext;
      if (fileInfo.includes("JPEG")) actualExt = ".jpg";
      else if (fileInfo.includes("PNG")) actualExt = ".png";
      else if (fileInfo.includes("RIFF") || fileInfo.includes("Web")) actualExt = ".webp";

      // Rename if needed
      if (actualExt !== ext) {
        const newPath = resolve(IMAGES_DIR, `${slug}${actualExt}`);
        execSync(`mv "${destPath}" "${newPath}"`);
      }

      const size = Math.round(execSync(`stat -f%z "${resolve(IMAGES_DIR, slug + actualExt)}"`).toString().trim() / 1024);

      // Update frontmatter
      const content = readFileSync(resolve(POSTS_DIR, file), "utf-8");
      const updated = content.replace('image: ""', `image: "/images/posts/${slug}${actualExt}"`);
      writeFileSync(resolve(POSTS_DIR, file), updated);

      ok++;
      console.log(`[${i+1}/${needsImage.length}] [OK] ${slug}${actualExt} (${size} KB)`);
    } else {
      fail++;
      console.log(`[${i+1}/${needsImage.length}] [FAIL] ${slug}`);
    }

    // Wait 2 seconds between downloads to avoid rate limiting
    await sleep(2000);
  }

  console.log(`\nDone: ${ok} OK, ${fail} failed`);
}

main();
