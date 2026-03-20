#!/usr/bin/env node

/**
 * Remove any bold paragraphs (**text**) immediately after the first H2 in each post.
 * These are leftover fragments from the original bold answer that was split by paragraph splitting.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const POSTS_DIR = resolve(__dirname, "..", "src/content/posts");

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let updated = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!fmMatch) continue;

    const frontmatter = fmMatch[1];
    let body = fmMatch[2];

    // Find first H2
    const h2Match = body.match(/^## .+$/m);
    if (!h2Match) continue;

    const h2End = h2Match.index + h2Match[0].length;
    const beforeH2 = body.slice(0, h2End);
    let afterH2 = body.slice(h2End);

    // Remove consecutive bold paragraphs right after H2
    // Pattern: \n\n**text**\n\n (possibly multiple in a row)
    let changed = false;
    while (true) {
      const boldMatch = afterH2.match(/^\n\n\*\*[^*]+\*\*\n/);
      if (!boldMatch) break;
      afterH2 = afterH2.slice(boldMatch[0].length - 1); // keep one \n
      changed = true;
    }

    if (changed) {
      // Ensure proper spacing
      afterH2 = "\n\n" + afterH2.replace(/^\n+/, "");
      writeFileSync(filepath, frontmatter + beforeH2 + afterH2, "utf-8");
      updated++;
    }
  }

  console.log(`Removed remaining bold paragraphs from ${updated} posts`);
}

main();
