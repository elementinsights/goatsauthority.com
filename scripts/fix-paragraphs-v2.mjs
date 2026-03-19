#!/usr/bin/env node

/**
 * Split paragraphs with 3+ sentences into max 2 sentences each.
 * V2: Better sentence detection, handles bold paragraphs.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const POSTS_DIR = resolve(__dirname, "..", "src/content/posts");

function splitSentences(text) {
  // Protect common abbreviations
  let temp = text;
  const protections = [];

  // Protect patterns like "Dr.", "Mr.", "e.g.", "i.e.", "vs.", "U.S.", etc.
  temp = temp.replace(/\b(Dr|Mr|Mrs|Ms|Jr|Sr|vs|etc|i\.e|e\.g|St|Mt|ft|oz|lb|lbs|yr|yrs|U\.S|No)\./gi, (m) => {
    protections.push(m);
    return `__P${protections.length - 1}__`;
  });

  // Protect decimal numbers
  temp = temp.replace(/(\d)\.(\d)/g, (m) => {
    protections.push(m);
    return `__P${protections.length - 1}__`;
  });

  // Protect URLs
  temp = temp.replace(/https?:\/\/[^\s)]+/g, (m) => {
    protections.push(m);
    return `__P${protections.length - 1}__`;
  });

  // Split on sentence-ending punctuation followed by space
  const rawParts = temp.split(/(?<=[.!?])\s+/);

  // Restore protections and filter empty
  const sentences = rawParts
    .map(p => {
      let restored = p;
      for (let i = 0; i < protections.length; i++) {
        restored = restored.replaceAll(`__P${i}__`, protections[i]);
      }
      return restored.trim();
    })
    .filter(s => s.length > 0);

  return sentences;
}

function isBodyParagraph(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("# ") || trimmed.startsWith("## ") || trimmed.startsWith("### ")) return false;
  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return false;
  if (trimmed.startsWith("> ")) return false;
  if (trimmed.startsWith("<")) return false;
  if (trimmed.startsWith("```")) return false;
  if (trimmed.startsWith("|")) return false;
  if (trimmed.startsWith("![")) return false;
  if (/^\d+\.\s/.test(trimmed)) return false;
  // Bold paragraphs ARE body paragraphs
  return true;
}

function fixBody(body) {
  const blocks = body.split("\n\n");
  const result = [];
  let inCodeBlock = false;

  for (const block of blocks) {
    if (block.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(block);
      continue;
    }
    if (inCodeBlock) {
      result.push(block);
      continue;
    }

    // Skip multi-line blocks (lists, etc.)
    if (block.trim().includes("\n")) {
      result.push(block);
      continue;
    }

    if (!isBodyParagraph(block)) {
      result.push(block);
      continue;
    }

    const trimmed = block.trim();

    // Handle bold-wrapped paragraphs: **text**
    let prefix = "";
    let suffix = "";
    let inner = trimmed;

    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      prefix = "**";
      suffix = "**";
      inner = trimmed.slice(2, -2);
    }

    const sentences = splitSentences(inner);

    if (sentences.length <= 2) {
      result.push(block);
      continue;
    }

    // Split into chunks of 2 sentences
    const chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(" ");
      if (prefix) {
        chunks.push(`${prefix}${chunk}${suffix}`);
      } else {
        chunks.push(chunk);
      }
    }

    result.push(chunks.join("\n\n"));
  }

  return result.join("\n\n");
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let filesFixed = 0;
  let parasCreated = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    const parts = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!parts) continue;

    const frontmatter = parts[1];
    const body = parts[2];
    const fixedBody = fixBody(body);

    if (fixedBody !== body) {
      writeFileSync(filepath, frontmatter + fixedBody, "utf-8");
      filesFixed++;
      const diff = fixedBody.split("\n\n").length - body.split("\n\n").length;
      parasCreated += diff;
    }
  }

  console.log(`Fixed ${filesFixed} files, created ${parasCreated} new paragraph breaks`);
}

main();
