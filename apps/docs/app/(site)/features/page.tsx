import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { FEATURES } from '@/lib/features';

export const metadata: Metadata = {
  title: 'Features',
  description: 'What OpenFolks does: folks, computers, routines, memory, connected apps and approvals.',
  alternates: { canonical: '/features' },
};

export default function FeaturesPage() {
  return (
    <PageShell
      title="Features"
      intro="What the app does today, with its limits stated. Each page links to the full documentation."
    >
      <div className="cards">
        {FEATURES.map((f) => (
          <Link key={f.slug} className="card-link" href={`/features/${f.slug}`}>
            <b>{f.title}</b>
            <span>{f.summary}</span>
          </Link>
        ))}
      </div>
      <h2>Not sure where to start?</h2>
      <p>
        Read the <Link href="/docs/getting-started/quick-tour">quick tour</Link>, then{' '}
        <Link href="/docs/getting-started/first-bot">create your first folk</Link>.
      </p>
    </PageShell>
  );
}
