#!/usr/bin/env node

/**
 * Fix em dashes (—) and en dashes (–) in post body text.
 * Replaces with commas, periods, or hyphens as appropriate.
 * Only touches body content, not frontmatter or headings.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const POSTS_DIR = resolve(__dirname, "..", "src/content/posts");

function fixDashesInLine(line) {
  // Skip headings and frontmatter
  if (line.startsWith("#") || line.startsWith("---")) return line;

  // Replace " — " or " – " (with spaces) → ", " or ". " depending on context
  // If followed by a capital letter or "it", "they", etc., use period
  let fixed = line;

  // Em dash with spaces: split into two sentences or use comma
  fixed = fixed.replace(/ [—–] /g, (match, offset) => {
    const after = fixed.slice(offset + match.length);
    // If next word starts with capital, treat as sentence break
    if (/^[A-Z]/.test(after)) {
      return ". ";
    }
    return ", ";
  });

  // Em dash without spaces (word—word): use comma + space
  fixed = fixed.replace(/([a-zA-Z])[—–]([a-zA-Z])/g, "$1, $2");

  // Any remaining dashes at start/end of phrases
  fixed = fixed.replace(/[—–]/g, "-");

  return fixed;
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  let totalFixed = 0;
  let filesFixed = 0;

  for (const file of files) {
    const filepath = resolve(POSTS_DIR, file);
    const content = readFileSync(filepath, "utf-8");

    // Split frontmatter from body
    const fmEnd = content.indexOf("---", 4);
    if (fmEnd === -1) continue;
    const closingDashes = content.indexOf("\n", fmEnd);
    const frontmatter = content.slice(0, closingDashes + 1);
    const body = content.slice(closingDashes + 1);

    // Count dashes before fix
    const dashCount = (body.match(/[—–]/g) || []).length;
    if (dashCount === 0) continue;

    // Fix dashes in body lines
    const fixedBody = body.split("\n").map(fixDashesInLine).join("\n");

    writeFileSync(filepath, frontmatter + fixedBody, "utf-8");
    totalFixed += dashCount;
    filesFixed++;
  }

  console.log(`Fixed ${totalFixed} dashes across ${filesFixed} files`);
}

main();
