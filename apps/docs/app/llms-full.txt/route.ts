import { featuresText, llmsOverview } from '@/lib/llms';
import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const docs = await Promise.all(source.getPages().map(getLLMText));
  const body = [llmsOverview().split('## Documentation index')[0], featuresText(), ...docs].join('\n\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
