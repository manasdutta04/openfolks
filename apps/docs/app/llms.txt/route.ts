import { llmsOverview } from '@/lib/llms';
import { SITE_URL } from '@/lib/site';
import { source } from '@/lib/source';

export const revalidate = false;

export function GET() {
  const docs = source
    .getPages()
    .map((p) => `- [${p.data.title}](${SITE_URL}${p.url})${p.data.description ? `: ${p.data.description}` : ''}`)
    .join('\n');
  return new Response(`${llmsOverview()}${docs}\n\n## Optional\n- [Sitemap](${SITE_URL}/sitemap.xml)\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
