#!/usr/bin/env node

/**
 * Post-process imported WordPress posts for Slate template.
 *
 * - Maps category names to slugs
 * - Extracts quickAnswer from first bold paragraph
 * - Generates TOC from H2 headings
 * - Extracts FAQ from content (FAQ section or generates from common patterns)
 * - Adds updatedDate, author
 * - Strips Amazon shortcodes
 * - Fixes internal links (goatsauthority.com/slug -> /slug/)
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const POSTS_DIR = resolve(__dirname, "..", "src/content/posts");

// Category name → slug mapping
const CATEGORY_MAP = {
  "Diet": "what-do-goats-eat",
  "Health": "health",
  "Breeding": "breeding",
  "Food": "food",
  "Housing": "housing",
  "Training": "training",
  "Safety": "safety",
  "Reproduction": "reproduction",
  "Pregnancy": "pregnancy",
  "Traits": "traits",
  "Uncategorized": "what-do-goats-eat", // fallback
};

function escapeYaml(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function extractQuickAnswer(body) {
  // Look for the first bold paragraph (wrapped in ** **)
  const boldMatch = body.match(/\*\*(.+?)\*\*/s);
  if (boldMatch) {
    let text = boldMatch[1].trim();
    // Clean up markdown links
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    // Limit to ~2-3 sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 3) {
      text = sentences.slice(0, 3).join("").trim();
    }
    return text;
  }
  return "";
}

function extractToc(body) {
  const toc = [];
  const h2Regex = /^## (.+)$/gm;
  let match;
  while ((match = h2Regex.exec(body)) !== null) {
    const text = match[1].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-|-$/g, "");
    toc.push({ text, id });
  }
  return toc;
}

function extractFaqs(body, title) {
  const faqs = [];

  // Look for existing FAQ section
  const faqSectionMatch = body.match(/## (?:FAQ|Frequently Asked Questions|FAQs)([\s\S]*?)(?=\n## |\n---|\Z)/i);
  if (faqSectionMatch) {
    const faqContent = faqSectionMatch[1];
    // Extract Q&A pairs from ### headings
    const qRegex = /### (.+?)\n+([\s\S]*?)(?=\n### |\n## |$)/g;
    let qMatch;
    while ((qMatch = qRegex.exec(faqContent)) !== null) {
      const question = qMatch[1].trim().replace(/\*\*/g, "");
      let answer = qMatch[2].trim()
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*/g, "")
        .replace(/\n{2,}/g, " ")
        .trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }

  // If we found FAQs from the section, return them
  if (faqs.length >= 2) return faqs;

  // Otherwise, generate FAQs from H2 headings that are questions
  const h2Regex = /^## (.+)$/gm;
  let match;
  while ((match = h2Regex.exec(body)) !== null) {
    const heading = match[1].trim();
    // Check if it's a question
    if (heading.match(/\?$|^(?:can |do |does |how |what |when |where |why |is |are |should |will )/i)) {
      // Get the paragraph after this heading
      const afterHeading = body.slice(match.index + match[0].length).trim();
      const firstPara = afterHeading.match(/^(.+?)(?:\n\n|\n##)/s);
      if (firstPara) {
        let answer = firstPara[1].trim()
          .replace(/\*\*/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/\n/g, " ")
          .trim();
        // Limit answer length
        if (answer.length > 300) {
          const cutPoint = answer.lastIndexOf(".", 300);
          if (cutPoint > 100) answer = answer.slice(0, cutPoint + 1);
        }
        if (answer.length > 30) {
          faqs.push({ question: heading.replace(/\?$/, "?"), answer });
        }
      }
    }
    if (faqs.length >= 4) break;
  }

  return faqs.slice(0, 4);
}

function fixInternalLinks(body) {
  // Convert https://goatsauthority.com/post-slug/ to /post-slug/
  return body.replace(/https?:\/\/goatsauthority\.com\/([^)\s"]+)/g, "/$1");
}

function stripAmazonShortcodes(body) {
  // Remove [amazon box="..." ...] shortcodes
  return body.replace(/\[amazon[^\]]*\]/g, "").replace(/\n{3,}/g, "\n\n");
}

function generateImageAlt(title) {
  // Create descriptive alt text from title
  return title.replace(/\(.*?\)/g, "").trim();
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  console.log(`Processing ${files.length} posts...\n`);

  let processed = 0;
  let errors = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    // Split frontmatter and body
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) {
      console.error(`  ERROR: No frontmatter in ${file}`);
      errors++;
      continue;
    }

    const frontmatterStr = fmMatch[1];
    let body = fmMatch[2].trim();

    // Parse existing frontmatter
    const fm = {};
    for (const line of frontmatterStr.split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        // Remove surrounding quotes
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        }
        fm[key] = val;
      }
    }

    // Fix body content
    body = fixInternalLinks(body);
    body = stripAmazonShortcodes(body);

    // Map category name to slug
    const categoryName = fm.category || "Uncategorized";
    const categorySlug = CATEGORY_MAP[categoryName] || CATEGORY_MAP["Uncategorized"];

    // Extract structured data
    const quickAnswer = extractQuickAnswer(body);
    const toc = extractToc(body);
    const faqs = extractFaqs(body, fm.title || "");

    // Build new frontmatter
    const lines = [
      "---",
      `title: "${escapeYaml(fm.title || "")}"`,
      `description: "${escapeYaml(fm.description || "")}"`,
      `category: "${escapeYaml(categorySlug)}"`,
      `postType: "guide"`,
      `publishDate: ${fm.publishDate || "2022-01-01"}`,
      `updatedDate: 2026-03-19`,
      `author: "Tim Rhodes"`,
      `image: ""`,
      `imageAlt: "${escapeYaml(generateImageAlt(fm.title || ""))}"`,
      `readTime: "${escapeYaml(fm.readTime || "5 min read")}"`,
    ];

    // Add quickAnswer
    if (quickAnswer) {
      lines.push(`quickAnswer:`);
      lines.push(`  title: "Quick Answer"`);
      lines.push(`  text: "${escapeYaml(quickAnswer)}"`);
    }

    // Add TOC
    if (toc.length > 0) {
      lines.push(`toc:`);
      for (const entry of toc) {
        lines.push(`  - label: "${escapeYaml(entry.text)}"`);
        lines.push(`    href: "#${entry.id}"`);
      }
    }

    // Add FAQs
    if (faqs.length > 0) {
      lines.push(`faq:`);
      for (const faq of faqs) {
        lines.push(`  - question: "${escapeYaml(faq.question)}"`);
        lines.push(`    answer: "${escapeYaml(faq.answer)}"`);
      }
    }

    lines.push("---");

    const newContent = lines.join("\n") + "\n\n" + body + "\n";
    writeFileSync(filepath, newContent, "utf-8");
    processed++;
  }

  console.log(`\nDone.`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Errors: ${errors}`);
}

main();
