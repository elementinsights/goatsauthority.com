#!/usr/bin/env node
/**
 * Strip all internal links from post body content.
 * Converts [anchor text](/slug/) → anchor text
 * Preserves external links (http/https).
 * Run: node scripts/strip-bad-links.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const POSTS_DIR = 'src/content/posts';

async function main() {
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  let totalLinks = 0;
  let filesChanged = 0;

  for (const file of files) {
    const fp = join(POSTS_DIR, file);
    const content = await readFile(fp, 'utf-8');

    // Split frontmatter from body
    const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!fmMatch) continue;

    const frontmatter = fmMatch[1];
    let body = fmMatch[2];
    const original = body;

    // Remove internal links: [text](/slug/) → text
    // Match markdown links where href starts with / but NOT http
    let count = 0;
    body = body.replace(/\[([^\]]+)\]\(\/[^)]+\)/g, (match, text) => {
      count++;
      return text;
    });

    if (body !== original) {
      await writeFile(fp, frontmatter + body, 'utf-8');
      totalLinks += count;
      filesChanged++;
    }
  }

  console.log(`Stripped ${totalLinks} internal links from ${filesChanged} files.`);
}

main().catch(console.error);
