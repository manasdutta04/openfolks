import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { FEATURES, FEATURE_BY_SLUG } from '@/lib/features';

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = FEATURE_BY_SLUG[slug];
  if (!f) return {};
  return { title: f.title, description: f.summary, alternates: { canonical: `/features/${f.slug}` } };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FEATURE_BY_SLUG[slug];
  if (!f) notFound();
  const index = FEATURES.findIndex((x) => x.slug === f.slug);
  const next = FEATURES[(index + 1) % FEATURES.length]!;
  return (
    <PageShell title={f.title} intro={f.intro}>
      {f.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.body?.map((p) => <p key={p}>{p}</p>)}
          {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        </section>
      ))}
      <h2>Limits</h2>
      <ul>{f.limits.map((l) => <li key={l}>{l}</li>)}</ul>
      <h2>Documentation</h2>
      <ul>
        {f.docs.map((d) => (
          <li key={d.href}><Link href={d.href}>{d.label}</Link></li>
        ))}
      </ul>
      <p>
        Next: <Link href={`/features/${next.slug}`}>{next.title}</Link>
      </p>
    </PageShell>
  );
}
