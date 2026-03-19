// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

/** Rehype plugin: add loading="lazy" to all images in markdown content */
function rehypeLazyImages() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties = node.properties || {};
        node.properties.loading = 'lazy';
      }
      if (node.children) node.children.forEach(visit);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://www.goatsauthority.com',

  trailingSlash: 'always',

  build: {
    inlineStylesheets: 'auto',
  },

  markdown: {
    rehypePlugins: [rehypeLazyImages],
  },

  integrations: [sitemap()],

  adapter: cloudflare(),
});
