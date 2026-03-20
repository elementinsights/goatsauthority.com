#!/usr/bin/env node

/**
 * Fix truncated descriptions by extending them to the end of the sentence
 * from the article body text.
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

function getFirstParagraphs(body) {
  // Get the intro text before the first H2
  const h2Idx = body.indexOf("\n## ");
  const intro = h2Idx > 0 ? body.slice(0, h2Idx) : body.slice(0, 1000);
  // Clean markdown
  return intro
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")  // strip links
    .replace(/\*\*/g, "")  // strip bold
    .replace(/\*/g, "")    // strip italic
    .replace(/^#+\s.*/gm, "")  // strip headings
    .replace(/!\[.*?\]\(.*?\)/g, "")  // strip images
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeDescription(plainText) {
  if (!plainText) return "";
  // Take up to ~200 chars, ending at a sentence boundary
  if (plainText.length <= 200) return plainText;

  // Find sentence end after 100 chars but before 250
  const sentences = plainText.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return plainText.slice(0, 200).trim();

  let desc = "";
  for (const s of sentences) {
    if ((desc + s).length > 250) break;
    desc += s;
  }

  if (!desc && sentences[0]) {
    desc = sentences[0]; // at least one sentence
  }

  return desc.trim();
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let fixed = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    const descMatch = content.match(/^description: "(.+?)"$/m);
    if (!descMatch) continue;

    const currentDesc = descMatch[1];
    // Skip if already ends with sentence-ending punctuation
    if (/[.!?]$/.test(currentDesc.trim())) continue;

    // Get body text
    const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!fmMatch) continue;
    const body = fmMatch[2];

    const plainText = getFirstParagraphs(body);
    const newDesc = makeDescription(plainText);

    if (newDesc && newDesc !== currentDesc) {
      const escaped = escapeYaml(newDesc);
      const updated = content.replace(
        `description: "${escapeYaml(currentDesc)}"`,
        `description: "${escaped}"`
      );
      if (updated !== content) {
        writeFileSync(filepath, updated, "utf-8");
        fixed++;
      }
    }
  }

  console.log(`Fixed ${fixed} truncated descriptions`);
}

main();
