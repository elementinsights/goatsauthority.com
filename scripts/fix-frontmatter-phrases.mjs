#!/usr/bin/env node
/**
 * Fix AI phrases in frontmatter (description, quickAnswer, faq fields).
 * Run: node scripts/fix-frontmatter-phrases.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'src/content/posts';
const stats = {};
function track(key) { stats[key] = (stats[key] || 0) + 1; }

function fix(content) {
  // Split into frontmatter and body
  const fmMatch = content.match(/^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$/);
  if (!fmMatch) return content;

  let fm = fmMatch[2];
  const body = fmMatch[4];
  const orig = fm;

  // "can consume" → "can eat"
  fm = fm.replace(/\bcan consume\b/gi, (m) => { track('can consume'); return m[0] === 'C' ? 'Can eat' : 'can eat'; });
  fm = fm.replace(/\bcannot consume\b/gi, (m) => { track('cannot consume'); return m[0] === 'C' ? 'Cannot eat' : 'cannot eat'; });

  // "As a matter of fact, " → remove
  fm = fm.replace(/As a matter of fact, ([a-z])/g, (m, c) => { track('as a matter of fact'); return c.toUpperCase(); });
  fm = fm.replace(/As a matter of fact, ([A-Z])/g, (m, c) => { track('as a matter of fact'); return c; });

  // "in this article" phrases
  fm = fm.replace(/[Ii]n this article,? we(?:'ll| will) (?:cover|discuss|explore|look at|examine|go over) /g, (m) => { track('in this article'); return ''; });
  fm = fm.replace(/[Ii]n this article,? /g, (m) => { track('in this article'); return ''; });

  // "That said, "
  fm = fm.replace(/That said, ([a-z])/g, (m, c) => { track('That said'); return c.toUpperCase(); });
  fm = fm.replace(/That said, ([A-Z])/g, (m, c) => { track('That said'); return c; });

  // "when it comes to X, "
  fm = fm.replace(/[Ww]hen it comes to [^,."]+, ([a-z])/g, (m, c) => { track('when it comes to'); return c.toUpperCase(); });
  fm = fm.replace(/[Ww]hen it comes to [^,."]+, ([A-Z])/g, (m, c) => { track('when it comes to'); return c; });

  // "crucial" → "important"
  fm = fm.replace(/\bcrucial\b/gi, (m) => { track('crucial'); return m[0] === 'C' ? 'Important' : 'important'; });

  // "ensure that" → "make sure that"
  fm = fm.replace(/\bensure that\b/gi, (m) => { track('ensure'); return m[0] === 'E' ? 'Make sure that' : 'make sure that'; });
  fm = fm.replace(/\bto ensure\b/g, (m) => { track('ensure'); return 'to make sure'; });
  fm = fm.replace(/\bTo ensure\b/g, (m) => { track('ensure'); return 'To make sure'; });

  // "it's important to note that " → remove
  fm = fm.replace(/[Ii]t(?:'s| is) important to note that /g, (m) => { track("it's important to note"); return ''; });

  // "it's worth noting that " → remove
  fm = fm.replace(/[Ii]t(?:'s| is) worth noting that /g, (m) => { track("it's worth noting"); return ''; });

  // "it is essential that/to" → remove
  fm = fm.replace(/[Ii]t(?:'s| is) essential (?:that |to )/g, (m) => { track('essential'); return ''; });
  fm = fm.replace(/[Ii]t(?:'s| is) important (?:that |to )/g, (m) => { track('it is important'); return ''; });

  // "navigate" (abstract use) → "handle"
  fm = fm.replace(/\bnavigate this\b/gi, (m) => { track('navigate'); return 'handle this'; });
  fm = fm.replace(/\bnavigate the\b/gi, (m) => { track('navigate'); return 'handle the'; });

  // "Additionally, " → remove
  fm = fm.replace(/Additionally, ([a-z])/g, (m, c) => { track('Additionally'); return c.toUpperCase(); });
  fm = fm.replace(/Additionally, ([A-Z])/g, (m, c) => { track('Additionally'); return c; });

  // "Ultimately, " → remove
  fm = fm.replace(/Ultimately, ([a-z])/g, (m, c) => { track('Ultimately'); return c.toUpperCase(); });
  fm = fm.replace(/Ultimately, ([A-Z])/g, (m, c) => { track('Ultimately'); return c; });

  // "In general, " → remove
  fm = fm.replace(/In general, ([a-z])/g, (m, c) => { track('In general'); return c.toUpperCase(); });
  fm = fm.replace(/In general, ([A-Z])/g, (m, c) => { track('In general'); return c; });

  // "overall, " → remove
  fm = fm.replace(/Overall, ([a-z])/g, (m, c) => { track('Overall'); return c.toUpperCase(); });
  fm = fm.replace(/Overall, ([A-Z])/g, (m, c) => { track('Overall'); return c; });

  // "key takeaway" → remove phrase
  fm = fm.replace(/(?:The )?[Kk]ey takeaway(?::| is that| here is that) /g, (m) => { track('key takeaway'); return ''; });

  // "the bottom line is that " → remove
  fm = fm.replace(/[Tt]he bottom line is that /g, (m) => { track('bottom line'); return ''; });

  // "at the end of the day" → remove
  fm = fm.replace(/[Aa]t the end of the day,? /g, (m) => { track('at the end of the day'); return ''; });

  // "as a responsible owner" → "as a goat owner"
  fm = fm.replace(/[Aa]s a responsible (?:goat )?owner/g, (m) => { track('responsible owner'); return 'as a goat owner'; });

  // "delve" → "look"
  fm = fm.replace(/\bdelve into\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Look into' : 'look into'; });
  fm = fm.replace(/\bdelve\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Dig' : 'dig'; });

  // "robust" → "strong"
  fm = fm.replace(/\brobust\b/gi, (m) => { track('robust'); return m[0] === 'R' ? 'Strong' : 'strong'; });

  // "comprehensive guide" → "guide"
  fm = fm.replace(/\bcomprehensive guide\b/gi, (m) => { track('comprehensive guide'); return m[0] === 'C' ? 'Guide' : 'guide'; });

  // "furry friend(s)" → "goat(s)"
  fm = fm.replace(/\byour furry friends?\b/gi, (m) => { track('furry friend'); return m.includes('s') ? 'your goats' : 'your goat'; });
  fm = fm.replace(/\bfurry friends?\b/gi, (m) => { track('furry friend'); return m.includes('s') ? 'goats' : 'goat'; });

  // "four-legged friend(s)" → "goat(s)"
  fm = fm.replace(/\byour four-legged friends?\b/gi, (m) => { track('four-legged friend'); return m.includes('s') ? 'your goats' : 'your goat'; });
  fm = fm.replace(/\bfour-legged friends?\b/gi, (m) => { track('four-legged friend'); return m.includes('s') ? 'goats' : 'goat'; });

  // "There is no definitive answer to this question" → remove
  fm = fm.replace(/There is no definitive answer to this question[^.]*\.\s*/g, (m) => { track('no definitive answer'); return ''; });

  // Fix double spaces
  fm = fm.replace(/  +/g, ' ');

  if (fm === orig) return content;
  return `---\n${fm}\n---\n${body}`;
}

async function main() {
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  let changed = 0;
  for (const file of files) {
    const fp = join(POSTS_DIR, file);
    const original = await readFile(fp, 'utf-8');
    const fixed = fix(original);
    if (fixed !== original) {
      await writeFile(fp, fixed, 'utf-8');
      changed++;
    }
  }
  console.log(`Fixed ${changed} of ${files.length} files.\n`);
  for (const [key, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }
}

main().catch(console.error);
