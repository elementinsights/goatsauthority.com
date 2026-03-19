#!/usr/bin/env node

/**
 * Fix remaining em/en dashes in frontmatter fields (toc labels, faq, description, quickAnswer).
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const POSTS_DIR = resolve(__dirname, "..", "src/content/posts");

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let fixed = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    if (!content.includes("–") && !content.includes("—")) continue;

    // Replace en/em dashes everywhere in the file (headings are OK per rule, but these aren't in headings)
    let updated = content;

    // Replace " – " or " — " with ", " or ". "
    updated = updated.replace(/ [—–] /g, (match, offset) => {
      const after = updated.slice(offset + match.length, offset + match.length + 1);
      if (/[A-Z]/.test(after)) return ". ";
      return ", ";
    });

    // Replace word—word or word–word
    updated = updated.replace(/([a-zA-Z])[—–]([a-zA-Z])/g, "$1, $2");

    // Any remaining
    updated = updated.replace(/[—–]/g, "-");

    if (updated !== content) {
      writeFileSync(filepath, updated, "utf-8");
      fixed++;
    }
  }

  console.log(`Fixed dashes in frontmatter of ${fixed} files`);
}

main();
