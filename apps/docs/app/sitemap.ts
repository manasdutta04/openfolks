import type { MetadataRoute } from 'next';
import { FEATURES } from '@/lib/features';
import { SITE_URL } from '@/lib/site';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const fixed = ['/', '/features', '/download', '/security', '/privacy', '/terms', '/docs'];
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, priority: p === '/' ? 1 : 0.7 })),
    ...FEATURES.map((f) => ({ url: `${SITE_URL}/features/${f.slug}`, lastModified: now, priority: 0.6 })),
    ...source
      .getPages()
      .filter((p) => p.url !== '/docs')
      .map((p) => ({ url: `${SITE_URL}${p.url}`, lastModified: now, priority: 0.5 })),
  ];
}
