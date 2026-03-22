#!/usr/bin/env node
/**
 * Round 2: Remove remaining AI phrases across all posts.
 * Run: node scripts/fix-ai-round2.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'src/content/posts';
const stats = {};
function track(key) { stats[key] = (stats[key] || 0) + 1; }

function fixContent(content) {
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) return content;
  const frontmatter = fmMatch[1];
  let body = fmMatch[2];
  const orig = body;

  // "Overall, " at start of sentence → remove
  body = body.replace(/Overall, ([a-z])/g, (m, c) => { track('Overall'); return c.toUpperCase(); });
  body = body.replace(/Overall, ([A-Z])/g, (m, c) => { track('Overall'); return c; });

  // "When it comes to X, " → remove (keep what follows)
  body = body.replace(/When it comes to [^,]+, ([a-z])/g, (m, c) => { track('when it comes to'); return c.toUpperCase(); });
  body = body.replace(/When it comes to [^,]+, ([A-Z])/g, (m, c) => { track('when it comes to'); return c; });
  // Mid-sentence: "when it comes to X, "
  body = body.replace(/when it comes to [^,]+, /g, (m) => { track('when it comes to'); return ''; });

  // "In general, " → remove
  body = body.replace(/In general, ([a-z])/g, (m, c) => { track('In general'); return c.toUpperCase(); });
  body = body.replace(/In general, ([A-Z])/g, (m, c) => { track('In general'); return c; });

  // "in this article" / "in this guide" → remove or simplify
  body = body.replace(/[Ii]n this article,? we(?:'ll| will) (?:cover|discuss|explore|look at|examine|go over) /g, (m) => { track('in this article'); return ''; });
  body = body.replace(/[Ii]n this article,? /g, (m) => { track('in this article'); return ''; });
  body = body.replace(/[Ii]n this guide,? /g, (m) => { track('in this guide'); return ''; });

  // "That said, " → remove
  body = body.replace(/That said, ([a-z])/g, (m, c) => { track('That said'); return c.toUpperCase(); });
  body = body.replace(/That said, ([A-Z])/g, (m, c) => { track('That said'); return c; });

  // "That being said, " → remove
  body = body.replace(/That being said, ([a-z])/g, (m, c) => { track('That being said'); return c.toUpperCase(); });
  body = body.replace(/That being said, ([A-Z])/g, (m, c) => { track('That being said'); return c; });

  // "Ultimately, " → remove
  body = body.replace(/Ultimately, ([a-z])/g, (m, c) => { track('Ultimately'); return c.toUpperCase(); });
  body = body.replace(/Ultimately, ([A-Z])/g, (m, c) => { track('Ultimately'); return c; });

  // "The bottom line is that " / "The bottom line: " → remove
  body = body.replace(/The bottom line is that /gi, (m) => { track('bottom line'); return ''; });
  body = body.replace(/The bottom line:? /gi, (m) => { track('bottom line'); return ''; });

  // "Key takeaway: " / "The key takeaway is that " → remove
  body = body.replace(/(?:The )?[Kk]ey takeaway(?::| is that| here is that) /g, (m) => { track('key takeaway'); return ''; });

  // ## Our Take → ## Summary / remove section header but keep content
  // "our take" in prose → remove
  body = body.replace(/\bour take\b/gi, (m) => { track('our take'); return ''; });

  // "it is essential that " / "it's essential that " / "it is essential to " → remove
  body = body.replace(/[Ii]t(?:'s| is) essential (?:that |to )/g, (m) => { track('essential'); return ''; });
  body = body.replace(/[Ii]t(?:'s| is) vital (?:that |to )/g, (m) => { track('vital'); return ''; });

  // "## Wrapping Up" → "## Final Thoughts" (or just remove the heading)
  body = body.replace(/^(#+) Wrapping Up$/gm, (m, h) => { track('wrapping up'); return `${h} Final Thoughts`; });

  // "we'll cover" / "we will cover" / "you'll learn" in intro sentences → remove full sentence
  body = body.replace(/We(?:'ll| will) cover [^.]+\.\s*/g, (m) => { track("we'll cover"); return ''; });
  body = body.replace(/You(?:'ll| will) learn [^.]+\.\s*/g, (m) => { track("you'll learn"); return ''; });

  // "at the end of the day" → remove
  body = body.replace(/[Aa]t the end of the day,? /g, (m) => { track('at the end of the day'); return ''; });

  // "all in all" → remove
  body = body.replace(/All in all, ([a-z])/g, (m, c) => { track('all in all'); return c.toUpperCase(); });
  body = body.replace(/All in all, ([A-Z])/g, (m, c) => { track('all in all'); return c; });
  body = body.replace(/all in all,? /gi, (m) => { track('all in all'); return ''; });

  // "rest assured" → remove
  body = body.replace(/[Rr]est assured,? (?:that )?/g, (m) => { track('rest assured'); return ''; });

  // "as a responsible goat owner" → "as a goat owner"
  body = body.replace(/[Aa]s a responsible (?:goat )?owner/g, (m) => { track('responsible owner'); return 'as a goat owner'; });
  body = body.replace(/[Aa]s responsible (?:goat )?owners/g, (m) => { track('responsible owner'); return 'as goat owners'; });

  // "in summary, " → remove
  body = body.replace(/In summary, ([a-z])/g, (m, c) => { track('in summary'); return c.toUpperCase(); });
  body = body.replace(/In summary, ([A-Z])/g, (m, c) => { track('in summary'); return c; });

  // "Let's break it down" → remove
  body = body.replace(/Let's break it down\.?\s*/gi, (m) => { track('break it down'); return ''; });

  // "without further ado" → remove
  body = body.replace(/[Ww]ithout further ado,? /g, (m) => { track('without further ado'); return ''; });

  // "needless to say" → remove
  body = body.replace(/[Nn]eedless to say,? /g, (m) => { track('needless to say'); return ''; });

  // "it should be noted that " → remove
  body = body.replace(/[Ii]t should be noted that /g, (m) => { track('it should be noted'); return ''; });

  // "it goes without saying" → remove
  body = body.replace(/[Ii]t goes without saying (?:that )?/g, (m) => { track('it goes without saying'); return ''; });

  // "as mentioned earlier" / "as previously mentioned" / "as we discussed" → remove
  body = body.replace(/[Aa]s (?:mentioned|discussed|noted) (?:earlier|above|previously|before),? /g, (m) => { track('as mentioned'); return ''; });
  body = body.replace(/[Aa]s (?:previously|we) (?:mentioned|discussed|noted),? /g, (m) => { track('as mentioned'); return ''; });

  // Fix double spaces, space before period, excess newlines
  body = body.replace(/  +/g, ' ');
  body = body.replace(/ \./g, '.');
  body = body.replace(/\n\n\n+/g, '\n\n');
  // Fix sentences starting with lowercase after removal
  body = body.replace(/\. ([a-z])/g, (m, c) => '. ' + c.toUpperCase());

  if (body === orig) return content;
  return frontmatter + body;
}

async function main() {
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  let changed = 0;
  for (const file of files) {
    const fp = join(POSTS_DIR, file);
    const original = await readFile(fp, 'utf-8');
    const fixed = fixContent(original);
    if (fixed !== original) {
      await writeFile(fp, fixed, 'utf-8');
      changed++;
    }
  }
  console.log(`Fixed ${changed} of ${files.length} files.\n`);
  console.log('Replacement stats:');
  for (const [key, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }
}

main().catch(console.error);
