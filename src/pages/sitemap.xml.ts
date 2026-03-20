import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../../site.config';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const site = siteConfig.url;

  const staticPages = [
    '', // homepage
    '/about/',
    '/contact/',
    '/start-here/',
    '/privacy-policy/',
    '/disclosure/',
    '/terms/',
  ];

  const categoryPages = siteConfig.categories.map(c => `/category/${c.slug}/`);

  const postPages = posts.map(p => `/${p.id}/`);

  const allUrls = [...staticPages, ...categoryPages, ...postPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${site}${url}</loc>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
