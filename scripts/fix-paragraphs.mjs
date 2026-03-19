#!/usr/bin/env node

/**
 * Split paragraphs with 3+ sentences into max 2 sentences each.
 * Only touches body paragraphs, not frontmatter, headings, list items,
 * HTML elements, or blockquotes.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const POSTS_DIR = resolve(__dirname, "..", "src/content/posts");

/**
 * Split text into sentences. Handles common abbreviations.
 */
function splitSentences(text) {
  // Common abbreviations that shouldn't split
  const abbrevs = ["Dr", "Mr", "Mrs", "Ms", "Jr", "Sr", "vs", "etc", "i\\.e", "e\\.g", "St", "Mt", "ft", "oz", "lb", "lbs", "yr", "yrs"];
  const abbrevPattern = new RegExp(`(${abbrevs.join("|")})\\.`, "gi");

  // Temporarily protect abbreviations
  let temp = text;
  const placeholders = [];
  temp = temp.replace(abbrevPattern, (match) => {
    placeholders.push(match);
    return `__ABBREV${placeholders.length - 1}__`;
  });

  // Also protect decimal numbers (e.g., "3.5")
  temp = temp.replace(/(\d)\.(\d)/g, (match) => {
    placeholders.push(match);
    return `__ABBREV${placeholders.length - 1}__`;
  });

  // Split on sentence-ending punctuation followed by space and capital letter
  const sentences = [];
  let current = "";

  // Split on . ! ? followed by space
  const parts = temp.split(/(?<=[.!?])\s+/);

  for (const part of parts) {
    if (part.trim()) {
      // Restore abbreviations
      let restored = part;
      for (let i = 0; i < placeholders.length; i++) {
        restored = restored.replace(`__ABBREV${i}__`, placeholders[i]);
      }
      sentences.push(restored.trim());
    }
  }

  return sentences;
}

function isBodyParagraph(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#")) return false;        // heading
  if (trimmed.startsWith("-")) return false;         // list item
  if (trimmed.startsWith("*")) return false;         // list item or emphasis start
  if (trimmed.startsWith(">")) return false;         // blockquote
  if (trimmed.startsWith("<")) return false;         // HTML
  if (trimmed.startsWith("```")) return false;       // code block
  if (trimmed.startsWith("|")) return false;         // table
  if (trimmed.startsWith("![")) return false;        // image
  if (/^\d+\./.test(trimmed)) return false;          // numbered list
  return true;
}

function fixParagraphs(body) {
  const lines = body.split("\n\n");
  const result = [];
  let inCodeBlock = false;

  for (const block of lines) {
    // Track code blocks
    if (block.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(block);
      continue;
    }
    if (inCodeBlock) {
      result.push(block);
      continue;
    }

    // Only process body paragraphs (single block of text, no newlines within)
    if (block.includes("\n") || !isBodyParagraph(block)) {
      result.push(block);
      continue;
    }

    const sentences = splitSentences(block.trim());

    if (sentences.length <= 2) {
      result.push(block);
      continue;
    }

    // Split into chunks of 2 sentences
    const chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(" ");
      chunks.push(chunk);
    }

    result.push(chunks.join("\n\n"));
  }

  return result.join("\n\n");
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let filesFixed = 0;
  let parasFixed = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    // Split frontmatter from body
    const parts = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!parts) continue;

    const frontmatter = parts[1];
    const body = parts[2];

    const fixedBody = fixParagraphs(body);

    if (fixedBody !== body) {
      writeFileSync(filepath, frontmatter + fixedBody, "utf-8");
      filesFixed++;

      // Count how many paragraphs were split
      const oldParas = body.split("\n\n").length;
      const newParas = fixedBody.split("\n\n").length;
      parasFixed += newParas - oldParas;
    }
  }

  console.log(`Split paragraphs in ${filesFixed} files (${parasFixed} new paragraphs created)`);
}

main();
