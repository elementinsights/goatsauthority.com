#!/usr/bin/env node

/**
 * Improve quickAnswer text for all posts.
 * Generates a thorough 2-4 sentence answer from the article body content.
 * Targets posts where quickAnswer is <100 chars or doesn't provide a real answer.
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

function stripMarkdown(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^#+\s.*/gm, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .trim();
}

function extractAnswer(body, title) {
  // Get text after first H2 (the answer section)
  const h2Match = body.match(/^## .+$/m);
  if (!h2Match) return null;

  const afterH2 = body.slice(h2Match.index + h2Match[0].length).trim();

  // Get paragraphs (skip headings, lists, html)
  const paragraphs = afterH2.split("\n\n")
    .map(p => p.trim())
    .filter(p => p && !p.startsWith("#") && !p.startsWith("<") && !p.startsWith("-") && !p.startsWith("|") && !p.startsWith("!"))
    .map(stripMarkdown)
    .filter(p => p.length > 20);

  if (paragraphs.length === 0) return null;

  // Collect sentences from the first few paragraphs until we have 2-4 good ones
  const allSentences = [];
  for (const para of paragraphs.slice(0, 6)) {
    const sentences = para.match(/[^.!?]+[.!?]+/g);
    if (sentences) {
      allSentences.push(...sentences.map(s => s.trim()).filter(s => s.length > 15));
    }
    if (allSentences.length >= 6) break;
  }

  if (allSentences.length === 0) return null;

  // Build answer: aim for 2-4 sentences, 100-300 chars
  let answer = "";
  let sentCount = 0;
  for (const s of allSentences) {
    if (sentCount >= 4) break;
    if ((answer + " " + s).length > 350) break;
    answer = answer ? answer + " " + s : s;
    sentCount++;
    if (sentCount >= 2 && answer.length >= 100) break;
  }

  // Ensure at least 2 sentences if possible
  if (sentCount < 2 && allSentences.length >= 2) {
    answer = allSentences.slice(0, 2).join(" ");
  }

  return answer || null;
}

function needsImprovement(text) {
  if (!text || text.length < 3) return true;
  if (text.length < 100) return true;
  // Doesn't provide an answer (just restates question)
  const lower = text.toLowerCase();
  if (lower.includes("this is a question") || lower.includes("let's find out") ||
      lower.includes("we'll discuss") || lower.includes("in this article")) return true;
  // Ends with a question
  if (text.trim().endsWith("?") && !text.trim().includes(". ")) return true;
  return false;
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let improved = 0;
  let alreadyGood = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    const qaMatch = content.match(/quickAnswer:\n\s+title: ".*?"\n\s+text: "(.*?)"/s);
    if (!qaMatch) continue;

    const currentText = qaMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");

    if (!needsImprovement(currentText)) {
      alreadyGood++;
      continue;
    }

    // Get body
    const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!fmMatch) continue;

    const titleMatch = content.match(/^title: "(.+?)"/m);
    const title = titleMatch ? titleMatch[1] : "";

    const newAnswer = extractAnswer(fmMatch[2], title);
    if (!newAnswer || newAnswer.length < currentText.length) continue;

    const escaped = escapeYaml(newAnswer);
    const updated = content.replace(
      qaMatch[0],
      `quickAnswer:\n  title: "Quick Answer"\n  text: "${escaped}"`
    );

    if (updated !== content) {
      writeFileSync(filepath, updated, "utf-8");
      improved++;
    }
  }

  console.log(`Improved: ${improved}`);
  console.log(`Already good: ${alreadyGood}`);
}

main();
