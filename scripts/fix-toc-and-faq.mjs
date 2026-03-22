#!/usr/bin/env node
/**
 * 1. Rebuild TOC entries from actual body H2 headings
 * 2. Clean AI filler phrases from FAQ answers
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'src/content/posts';
let tocFixed = 0, faqFixed = 0, filesChanged = 0;

function slugify(text) {
  return text.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function cleanFaqAnswer(ans) {
  let t = ans;
  // Remove generic openers
  t = t.replace(/^There are many different [^.]+\.\s*/i, '');
  t = t.replace(/^There are many benefits [^.]+\.\s*/i, '');
  t = t.replace(/^There are a few reasons [^.]+\.\s*/i, '');
  t = t.replace(/^There are a few key things [^.]+\.\s*/i, '');
  t = t.replace(/^There are several [^.]+\.\s*/i, '');
  // Remove "First, " / "Second, " / "Third, " at start of sentences
  t = t.replace(/\bFirst, /g, '');
  t = t.replace(/\bSecond, /g, '');
  t = t.replace(/\bThird, /g, '');
  // Remove filler phrases
  t = t.replace(/packed with nutrients(?: that are good for| that can benefit| and vitamins| that)?\s*/gi, 'nutritious ');
  t = t.replace(/It's tempting to share your favorite snacks with them, but this can lead to problems\.\s*/g, '');
  t = t.replace(/Despite their small size and seemingly delicate appearance, goats are actually quite adept at/gi, 'Goats are good at');
  t = t.replace(/\bYou must begin cautiously and progressively raise the amount over time\.\s*/g, 'Start small and increase gradually. ');
  t = t.replace(/\bGoats are known for their broad diet\.\s*/g, '');
  t = t.replace(/\bThey love variety in what they consume\.\s*/g, '');
  t = t.replace(/\bNot just the seeds\.\s*/g, '');
  t = t.replace(/\bas we mentioned,?\s*/gi, '');
  t = t.replace(/\binteresting creatures\b/gi, 'animals');
  t = t.replace(/\bseemingly delicate appearance\b/gi, 'size');
  // Fix double spaces and leading spaces
  t = t.replace(/  +/g, ' ').trim();
  // Capitalize first letter
  if (t.length > 0) t = t[0].toUpperCase() + t.slice(1);
  return t;
}

async function main() {
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const fp = join(POSTS_DIR, file);
    const content = await readFile(fp, 'utf-8');

    const firstDash = content.indexOf('---\n');
    const secondDash = content.indexOf('\n---\n', firstDash + 4);
    if (firstDash === -1 || secondDash === -1) continue;

    let fm = content.slice(firstDash + 4, secondDash);
    const body = content.slice(secondDash + 5);
    const origFm = fm;

    // 1. Rebuild TOC from body H2s
    const bodyH2s = [...body.matchAll(/^## (.+)$/gm)].map(m => m[1].trim());
    if (bodyH2s.length > 0) {
      // Check if TOC exists and has mismatches
      const tocMatch = fm.match(/^toc:\n((?:\s+- label:.*\n\s+href:.*\n?)+)/m);
      if (tocMatch) {
        const tocLabels = [...tocMatch[1].matchAll(/label:\s*"([^"]+)"/g)].map(m => m[1]);

        // Check for mismatches
        const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        let mismatches = 0;
        for (const label of tocLabels) {
          if (!bodyH2s.some(h2 => norm(h2) === norm(label) || norm(h2).includes(norm(label).slice(0, 15)) || norm(label).includes(norm(h2).slice(0, 15)))) {
            mismatches++;
          }
        }

        if (mismatches > 2) {
          // Rebuild TOC from body H2s
          // Detect indentation from existing TOC
          const indentMatch = tocMatch[1].match(/^(\s+)- label:/m);
          const indent = indentMatch ? indentMatch[1] : '  ';
          const hrefIndent = indent + '  ';

          let newToc = 'toc:\n';
          for (const h2 of bodyH2s) {
            const slug = slugify(h2);
            newToc += `${indent}- label: "${h2.replace(/"/g, '\\"')}"\n`;
            newToc += `${hrefIndent}href: "#${slug}"\n`;
          }

          fm = fm.replace(/^toc:\n(?:\s+- label:.*\n\s+href:.*\n?)+/m, newToc);
          tocFixed++;
        }
      }
    }

    // 2. Clean FAQ answers
    const faqAnswerRegex = /(answer:\s*")([^"]+)(")/g;
    fm = fm.replace(faqAnswerRegex, (match, prefix, answer, suffix) => {
      const cleaned = cleanFaqAnswer(answer);
      if (cleaned !== answer) {
        faqFixed++;
        return prefix + cleaned + suffix;
      }
      return match;
    });

    if (fm !== origFm) {
      const newContent = '---\n' + fm + '\n---\n' + body;
      await writeFile(fp, newContent, 'utf-8');
      filesChanged++;
    }
  }

  console.log(`Files changed: ${filesChanged}`);
  console.log(`TOC arrays rebuilt: ${tocFixed}`);
  console.log(`FAQ answers cleaned: ${faqFixed}`);
}

main().catch(console.error);
