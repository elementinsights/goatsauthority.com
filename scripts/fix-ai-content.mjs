#!/usr/bin/env node
/**
 * Bulk-replace AI buzzwords and phrases across all posts.
 * Run: node scripts/fix-ai-content.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'src/content/posts';

// Track stats
const stats = {};
function track(key) { stats[key] = (stats[key] || 0) + 1; }

function fixContent(content) {
  let text = content;

  // Split frontmatter from body
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return content;
  const frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // --- REPLACEMENTS (body only) ---

  // "furry friends" → "goats", "furry friend" → "goat"
  body = body.replace(/\byour furry friends\b/gi, (m) => { track('furry friends'); return 'your goats'; });
  body = body.replace(/\byour furry friend\b/gi, (m) => { track('furry friend'); return 'your goat'; });
  body = body.replace(/\btheir furry friends\b/gi, (m) => { track('furry friends'); return 'their goats'; });
  body = body.replace(/\btheir furry friend\b/gi, (m) => { track('furry friend'); return 'their goat'; });
  body = body.replace(/\bthese furry friends\b/gi, (m) => { track('furry friends'); return 'these goats'; });
  body = body.replace(/\bour furry friends\b/gi, (m) => { track('furry friends'); return 'our goats'; });
  body = body.replace(/\bfurry friends\b/gi, (m) => { track('furry friends'); return 'goats'; });
  body = body.replace(/\bfurry friend\b/gi, (m) => { track('furry friend'); return 'goat'; });

  // "four-legged friends" → "goats", "four-legged friend" → "goat"
  body = body.replace(/\byour four-legged friends\b/gi, (m) => { track('four-legged'); return 'your goats'; });
  body = body.replace(/\byour four-legged friend\b/gi, (m) => { track('four-legged'); return 'your goat'; });
  body = body.replace(/\btheir four-legged friends\b/gi, (m) => { track('four-legged'); return 'their goats'; });
  body = body.replace(/\btheir four-legged friend\b/gi, (m) => { track('four-legged'); return 'their goat'; });
  body = body.replace(/\bthese four-legged friends\b/gi, (m) => { track('four-legged'); return 'these goats'; });
  body = body.replace(/\bfour-legged friends\b/gi, (m) => { track('four-legged'); return 'goats'; });
  body = body.replace(/\bfour-legged friend\b/gi, (m) => { track('four-legged'); return 'goat'; });

  // "It's important to note that " → remove (sentence continues)
  body = body.replace(/It's important to note that /gi, (m) => { track('important to note'); return ''; });
  body = body.replace(/It is important to note that /gi, (m) => { track('important to note'); return ''; });
  // Capitalize the next word after removal (start of sentence)
  body = body.replace(/\. ([a-z])/g, (m, c) => '. ' + c.toUpperCase());

  // "It's worth noting that " → remove
  body = body.replace(/It's worth noting that /gi, (m) => { track('worth noting'); return ''; });
  body = body.replace(/It is worth noting that /gi, (m) => { track('worth noting'); return ''; });

  // "In conclusion, " at start of sentence → remove
  body = body.replace(/In conclusion,\s*/gi, (m) => { track('in conclusion'); return ''; });
  body = body.replace(/In conclusion:\s*/gi, (m) => { track('in conclusion'); return ''; });

  // "Additionally, " at start of sentence → remove, capitalize next word
  body = body.replace(/Additionally,\s+([a-z])/g, (m, c) => { track('Additionally'); return c.toUpperCase(); });
  body = body.replace(/Additionally,\s+([A-Z])/g, (m, c) => { track('Additionally'); return c; });

  // "Furthermore, " → remove
  body = body.replace(/Furthermore,\s+([a-z])/g, (m, c) => { track('Furthermore'); return c.toUpperCase(); });
  body = body.replace(/Furthermore,\s+([A-Z])/g, (m, c) => { track('Furthermore'); return c; });

  // "Moreover, " → remove
  body = body.replace(/Moreover,\s+([a-z])/g, (m, c) => { track('Moreover'); return c.toUpperCase(); });
  body = body.replace(/Moreover,\s+([A-Z])/g, (m, c) => { track('Moreover'); return c; });

  // "let's dive into" / "let's dive in" → remove or replace
  body = body.replace(/[Ll]et's dive into /g, (m) => { track("let's dive"); return ''; });
  body = body.replace(/[Ll]et's dive in and /g, (m) => { track("let's dive"); return ''; });
  body = body.replace(/[Ll]et's dive in\./g, (m) => { track("let's dive"); return ''; });
  body = body.replace(/[Ll]et's explore /g, (m) => { track("let's explore"); return ''; });

  // "crucial" → "important" (but not if "important" is already nearby)
  body = body.replace(/\bcrucial\b/gi, (m) => {
    track('crucial');
    return m[0] === 'C' ? 'Important' : 'important';
  });

  // "delve" → "look" or "dig"
  body = body.replace(/\bdelve into\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Look into' : 'look into'; });
  body = body.replace(/\bdelving into\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Looking into' : 'looking into'; });
  body = body.replace(/\bdelve\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Dig' : 'dig'; });

  // "ensure" → "make sure" (limit to avoid over-replacement)
  // Only replace "ensure that" and "to ensure" which are the most AI-sounding
  body = body.replace(/\bensure that\b/gi, (m) => { track('ensure'); return m[0] === 'E' ? 'Make sure that' : 'make sure that'; });
  body = body.replace(/\bto ensure\b/g, (m) => { track('ensure'); return 'to make sure'; });
  body = body.replace(/\bTo ensure\b/g, (m) => { track('ensure'); return 'To make sure'; });

  // "robust" → "strong" or "solid"
  body = body.replace(/\brobust\b/gi, (m) => { track('robust'); return m[0] === 'R' ? 'Strong' : 'strong'; });

  // "navigate" (when used abstractly) → "handle" or "manage"
  body = body.replace(/\bnavigate this\b/gi, (m) => { track('navigate'); return m[0] === 'N' ? 'Handle this' : 'handle this'; });
  body = body.replace(/\bnavigate the\b/gi, (m) => { track('navigate'); return m[0] === 'N' ? 'Handle the' : 'handle the'; });

  // "it could potentially" → "it could"
  body = body.replace(/it could potentially/gi, (m) => { track('could potentially'); return 'it could'; });

  // "it's generally recommended" → "we recommend" or "most farmers recommend"
  body = body.replace(/it's generally recommended/gi, (m) => { track('generally recommended'); return 'most goat owners recommend'; });
  body = body.replace(/it is generally recommended/gi, (m) => { track('generally recommended'); return 'most goat owners recommend'; });

  // "you may want to consider" → "consider"
  body = body.replace(/you may want to consider/gi, (m) => { track('may want to consider'); return 'consider'; });

  // "multifaceted" → "complex" (if any)
  body = body.replace(/\bmultifaceted\b/gi, (m) => { track('multifaceted'); return m[0] === 'M' ? 'Complex' : 'complex'; });

  // "leverage" (non-technical) → "use"
  body = body.replace(/\bleverage\b/gi, (m) => { track('leverage'); return m[0] === 'L' ? 'Use' : 'use'; });

  // "tapestry" → remove (shouldn't be in goat content)
  body = body.replace(/\btapestry\b/gi, (m) => { track('tapestry'); return 'mix'; });

  // "landscape" (when used abstractly, not literal) → keep literal uses
  // Skip this one - too context-dependent

  // "omnivore(s)" in context of goats → "herbivore(s)"
  body = body.replace(/goats are(?: actually)? omnivores/gi, (m) => { track('omnivore fix'); return 'goats are herbivores'; });
  body = body.replace(/goats are not typically considered to be carnivores, they are actually omnivores/gi, (m) => { track('omnivore fix'); return 'goats are herbivores (ruminants) that eat plants, not meat'; });
  body = body.replace(/\ban omnivore\b/gi, (m) => { track('omnivore fix'); return 'an herbivore'; });
  body = body.replace(/\bomnivores\b/gi, (m) => { track('omnivore fix'); return 'herbivores'; });
  body = body.replace(/\bomnivore\b/gi, (m) => { track('omnivore fix'); return 'herbivore'; });

  // Fix double spaces left by removals
  body = body.replace(/  +/g, ' ');
  // Fix space before period
  body = body.replace(/ \./g, '.');
  // Fix empty lines created by removals
  body = body.replace(/\n\n\n+/g, '\n\n');

  return `---\n${frontmatter}\n---\n${body}`;
}

async function main() {
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  let changed = 0;

  for (const file of files) {
    const path = join(POSTS_DIR, file);
    const original = await readFile(path, 'utf-8');
    const fixed = fixContent(original);
    if (fixed !== original) {
      await writeFile(path, fixed, 'utf-8');
      changed++;
    }
  }

  console.log(`\nFixed ${changed} of ${files.length} files.\n`);
  console.log('Replacement stats:');
  for (const [key, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }
}

main().catch(console.error);
