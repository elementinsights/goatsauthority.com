#!/usr/bin/env node
/**
 * Round 3: Clean remaining AI phrases from body text.
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'src/content/posts';
const stats = {};
function track(key) { stats[key] = (stats[key] || 0) + 1; }

function fix(content) {
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) return content;
  const fm = fmMatch[1];
  let body = fmMatch[2];
  const orig = body;

  // "in this article" phrases
  body = body.replace(/[Ii]n this article,? we(?:'ll| will) (?:cover|discuss|explore|look at|examine|go over) /g, (m) => { track('in this article'); return ''; });
  body = body.replace(/[Ii]n this article,? /g, (m) => { track('in this article'); return ''; });

  // "That said, "
  body = body.replace(/That said, ([a-z])/g, (m, c) => { track('That said'); return c.toUpperCase(); });
  body = body.replace(/That said, ([A-Z])/g, (m, c) => { track('That said'); return c; });

  // "when it comes to X, "
  body = body.replace(/When it comes to [^,]+, ([a-z])/g, (m, c) => { track('when it comes to'); return c.toUpperCase(); });
  body = body.replace(/When it comes to [^,]+, ([A-Z])/g, (m, c) => { track('when it comes to'); return c; });
  body = body.replace(/when it comes to [^,]+, /g, (m) => { track('when it comes to'); return ''; });

  // "crucial" → "important"
  body = body.replace(/\bcrucial\b/gi, (m) => { track('crucial'); return m[0] === 'C' ? 'Important' : 'important'; });

  // "ensure that" / "to ensure"
  body = body.replace(/\bensure that\b/gi, (m) => { track('ensure'); return m[0] === 'E' ? 'Make sure that' : 'make sure that'; });
  body = body.replace(/\bto ensure\b/g, (m) => { track('ensure'); return 'to make sure'; });
  body = body.replace(/\bTo ensure\b/g, (m) => { track('ensure'); return 'To make sure'; });

  // "it's important to" / "it is important to"
  body = body.replace(/[Ii]t(?:'s| is) important to (?:note that |remember that |understand that |keep in mind that )?/g, (m) => { track("it's important"); return ''; });

  // "navigate" (abstract)
  body = body.replace(/\bnavigate this\b/gi, (m) => { track('navigate'); return 'handle this'; });
  body = body.replace(/\bnavigate the\b/gi, (m) => { track('navigate'); return 'handle the'; });

  // "delve"
  body = body.replace(/\bdelve into\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Look into' : 'look into'; });
  body = body.replace(/\bdelve\b/gi, (m) => { track('delve'); return m[0] === 'D' ? 'Dig' : 'dig'; });

  // "robust"
  body = body.replace(/\brobust\b/gi, (m) => { track('robust'); return m[0] === 'R' ? 'Strong' : 'strong'; });

  // "it is essential" / "it's essential"
  body = body.replace(/[Ii]t(?:'s| is) essential (?:that |to )/g, (m) => { track('essential'); return ''; });

  // "the bottom line"
  body = body.replace(/[Tt]he bottom line is that /g, (m) => { track('bottom line'); return ''; });

  // "at the end of the day"
  body = body.replace(/[Aa]t the end of the day,? /g, (m) => { track('at the end of the day'); return ''; });

  // "key takeaway"
  body = body.replace(/(?:The )?[Kk]ey takeaway(?::| is that| here is that) /g, (m) => { track('key takeaway'); return ''; });

  // "Ultimately, "
  body = body.replace(/Ultimately, ([a-z])/g, (m, c) => { track('Ultimately'); return c.toUpperCase(); });
  body = body.replace(/Ultimately, ([A-Z])/g, (m, c) => { track('Ultimately'); return c; });

  // "Overall, "
  body = body.replace(/Overall, ([a-z])/g, (m, c) => { track('Overall'); return c.toUpperCase(); });
  body = body.replace(/Overall, ([A-Z])/g, (m, c) => { track('Overall'); return c; });

  // "In general, "
  body = body.replace(/In general, ([a-z])/g, (m, c) => { track('In general'); return c.toUpperCase(); });
  body = body.replace(/In general, ([A-Z])/g, (m, c) => { track('In general'); return c; });

  // "Additionally, "
  body = body.replace(/Additionally, ([a-z])/g, (m, c) => { track('Additionally'); return c.toUpperCase(); });
  body = body.replace(/Additionally, ([A-Z])/g, (m, c) => { track('Additionally'); return c; });

  // "as a responsible"
  body = body.replace(/[Aa]s a responsible (?:goat )?owner/g, (m) => { track('responsible owner'); return 'as a goat owner'; });

  // "comprehensive guide"
  body = body.replace(/\bcomprehensive guide\b/gi, (m) => { track('comprehensive guide'); return m[0] === 'C' ? 'Guide' : 'guide'; });

  // "omnivore" in context of goats being omnivores (fix only incorrect usage)
  body = body.replace(/goats are(?: actually)? omnivores/gi, (m) => { track('omnivore fix'); return 'goats are herbivores'; });

  // Fix double spaces and orphaned capitalizations
  body = body.replace(/  +/g, ' ');
  body = body.replace(/ \./g, '.');
  body = body.replace(/\. ([a-z])/g, (m, c) => '. ' + c.toUpperCase());

  if (body === orig) return content;
  return fm + body;
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
