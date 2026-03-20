#!/usr/bin/env node

/**
 * For each post:
 * 1. Find the bold paragraph immediately after the first H2 in the body
 * 2. Strip the bold markers and use it as the quickAnswer text (replacing existing)
 * 3. Remove that bold paragraph from the body
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const POSTS_DIR = resolve(__dirname, "..", "src/content/posts");

function escapeYaml(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let updated = 0;
  let skipped = 0;
  let noH2 = 0;
  let noBold = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    // Split frontmatter from body
    const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!fmMatch) { skipped++; continue; }

    let frontmatter = fmMatch[1];
    let body = fmMatch[2];

    // Find first H2 in body
    const h2Match = body.match(/^## .+$/m);
    if (!h2Match) { noH2++; continue; }

    const h2End = h2Match.index + h2Match[0].length;
    const beforeH2 = body.slice(0, h2Match.index);
    const afterH2 = body.slice(h2End).replace(/^\n+/, "\n\n");

    // Look for bold paragraph immediately after H2
    // Pattern: \n\n**text**\n\n (can be multi-sentence, may contain links)
    const boldMatch = afterH2.match(/^\n\n\*\*(.+?)\*\*\n/s);
    if (!boldMatch) { noBold++; continue; }

    // Extract the bold text content (strip markdown links for quickAnswer)
    let boldText = boldMatch[1].trim();
    let quickAnswerText = boldText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")  // strip markdown links
      .replace(/\n/g, " ")  // flatten newlines
      .replace(/\s+/g, " ")  // normalize spaces
      .trim();

    // Remove the bold paragraph from the body
    const afterBold = afterH2.slice(boldMatch[0].length);
    const newBody = beforeH2 + body.slice(h2Match.index, h2End) + "\n\n" + afterBold.replace(/^\n+/, "");

    // Update quickAnswer in frontmatter
    // Replace existing quickAnswer block or add one
    if (frontmatter.match(/quickAnswer:\n\s+title:/)) {
      // Replace existing quickAnswer text
      frontmatter = frontmatter.replace(
        /quickAnswer:\n\s+title: "Quick Answer"\n\s+text: ".*?"/s,
        `quickAnswer:\n  title: "Quick Answer"\n  text: "${escapeYaml(quickAnswerText)}"`
      );
    } else if (frontmatter.match(/quickAnswer:\n/)) {
      // Has quickAnswer but different format - replace the text line
      frontmatter = frontmatter.replace(
        /quickAnswer:\n(\s+title: ".*?"\n)?\s+text: ".*?"/s,
        `quickAnswer:\n  title: "Quick Answer"\n  text: "${escapeYaml(quickAnswerText)}"`
      );
    } else {
      // No quickAnswer - add before the closing ---
      frontmatter = frontmatter.replace(
        /\n---\n$/,
        `\nquickAnswer:\n  title: "Quick Answer"\n  text: "${escapeYaml(quickAnswerText)}"\n---\n`
      );
    }

    writeFileSync(filepath, frontmatter + newBody, "utf-8");
    updated++;
  }

  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no frontmatter): ${skipped}`);
  console.log(`No H2 found: ${noH2}`);
  console.log(`No bold after H2: ${noBold}`);
}

main();
