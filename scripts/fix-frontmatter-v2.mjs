#!/usr/bin/env node
/**
 * Fix AI phrases in frontmatter YAML string values only.
 * Uses line-by-line approach to preserve YAML indentation.
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'src/content/posts';
const stats = {};
function track(key) { stats[key] = (stats[key] || 0) + 1; }

function fixString(s) {
  let t = s;

  t = t.replace(/\bcan consume\b/gi, (m) => { track('can consume'); return m[0] === 'C' ? 'Can eat' : 'can eat'; });
  t = t.replace(/\bcannot consume\b/gi, (m) => { track('cannot consume'); return m[0] === 'C' ? 'Cannot eat' : 'cannot eat'; });
  t = t.replace(/As a matter of fact, ([a-z])/g, (m, c) => { track('as a matter of fact'); return c.toUpperCase(); });
  t = t.replace(/As a matter of fact, ([A-Z])/g, (m, c) => { track('as a matter of fact'); return c; });
  t = t.replace(/[Ii]n this article,? we(?:'ll| will) (?:cover|discuss|explore|look at|examine|go over) /g, () => { track('in this article'); return ''; });
  t = t.replace(/[Ii]n this article,? /g, () => { track('in this article'); return ''; });
  t = t.replace(/\bcrucial\b/gi, (m) => { track('crucial'); return m[0] === 'C' ? 'Important' : 'important'; });
  t = t.replace(/\bensure that\b/gi, (m) => { track('ensure'); return m[0] === 'E' ? 'Make sure that' : 'make sure that'; });
  t = t.replace(/\bto ensure\b/g, () => { track('ensure'); return 'to make sure'; });
  t = t.replace(/\bTo ensure\b/g, () => { track('ensure'); return 'To make sure'; });
  t = t.replace(/[Ii]t(?:'s| is) important to note that /g, () => { track("important to note"); return ''; });
  t = t.replace(/[Ii]t(?:'s| is) worth noting that /g, () => { track("worth noting"); return ''; });
  t = t.replace(/[Ii]t(?:'s| is) essential (?:that |to )/g, () => { track('essential'); return ''; });
  t = t.replace(/[Ii]t(?:'s| is) important (?:that |to )/g, () => { track('important that'); return ''; });
  t = t.replace(/\bnavigate this\b/gi, () => { track('navigate'); return 'handle this'; });
  t = t.replace(/\bnavigate the\b/gi, () => { track('navigate'); return 'handle the'; });
  t = t.replace(/Additionally, ([a-z])/g, (m, c) => { track('Additionally'); return c.toUpperCase(); });
  t = t.replace(/Additionally, ([A-Z])/g, (m, c) => { track('Additionally'); return c; });
  t = t.replace(/\bdelve into\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Look into' : 'look into'; });
  t = t.replace(/We shall delve into the subject/gi, () => { track('delve'); return 'We cover this topic'; });
  t = t.replace(/We will delve into the subject/gi, () => { track('delve'); return 'We cover this topic'; });
  t = t.replace(/\bdelve\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Dig' : 'dig'; });
  t = t.replace(/\brobust\b/gi, (m) => { track('robust'); return m[0] === 'R' ? 'Strong' : 'strong'; });
  t = t.replace(/\bcomprehensive guide\b/gi, (m) => { track('comprehensive guide'); return m[0] === 'C' ? 'Guide' : 'guide'; });
  t = t.replace(/\byour furry friends\b/gi, () => { track('furry friend'); return 'your goats'; });
  t = t.replace(/\byour furry friend\b/gi, () => { track('furry friend'); return 'your goat'; });
  t = t.replace(/\bfurry friends\b/gi, () => { track('furry friend'); return 'goats'; });
  t = t.replace(/\bfurry friend\b/gi, () => { track('furry friend'); return 'goat'; });
  t = t.replace(/\byour four-legged friends\b/gi, () => { track('four-legged'); return 'your goats'; });
  t = t.replace(/\byour four-legged friend\b/gi, () => { track('four-legged'); return 'your goat'; });
  t = t.replace(/\bfour-legged friends\b/gi, () => { track('four-legged'); return 'goats'; });
  t = t.replace(/\bfour-legged friend\b/gi, () => { track('four-legged'); return 'goat'; });
  t = t.replace(/There is no definitive answer to this question[^.]*\.\s*/g, () => { track('no definitive answer'); return ''; });
  t = t.replace(/  +/g, ' ');

  return t;
}

async function main() {
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  let changed = 0;

  for (const file of files) {
    const fp = join(POSTS_DIR, file);
    const content = await readFile(fp, 'utf-8');

    // Find the frontmatter boundaries
    const firstDash = content.indexOf('---\n');
    const secondDash = content.indexOf('\n---\n', firstDash + 4);
    if (firstDash === -1 || secondDash === -1) continue;

    const before = content.slice(0, firstDash + 4); // "---\n"
    const fm = content.slice(firstDash + 4, secondDash);
    const after = content.slice(secondDash); // "\n---\n..."

    // Process each line — only modify the string VALUE part, preserving indentation and keys
    let modified = false;
    const newLines = fm.split('\n').map(line => {
      // Match lines with quoted string values: key: "value" or answer: "value"
      const quotedMatch = line.match(/^(\s*(?:\w+|-)?\s*(?:text|answer|description|title):\s*)"(.+)"$/);
      if (quotedMatch) {
        const prefix = quotedMatch[1];
        const value = quotedMatch[2];
        const fixed = fixString(value);
        if (fixed !== value) {
          modified = true;
          return `${prefix}"${fixed}"`;
        }
      }
      // Match lines that are continuation of a quoted string value (rare but possible)
      return line;
    });

    if (modified) {
      const newContent = before + newLines.join('\n') + after;
      await writeFile(fp, newContent, 'utf-8');
      changed++;
    }
  }

  console.log(`Fixed ${changed} of ${files.length} files.\n`);
  for (const [key, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }
}

main().catch(console.error);
