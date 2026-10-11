import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { REPO } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Terms for using the OpenFolks software and this website.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <PageShell
      title="Terms"
      intro="OpenFolks is free software under the MIT License. These terms cover your use of the software and this website."
      updated="11 October 2026"
    >
      <h2>The software</h2>
      <p>
        OpenFolks is released under the{' '}
        <a href={`${REPO}/blob/main/LICENSE`} rel="noopener">MIT License</a>. You may use, copy, modify, merge, publish,
        distribute and sell copies of it, as long as the licence notice is kept. The software is provided as is, without
        warranty of any kind.
      </p>

      <h2>What folks do</h2>
      <p>
        Folks act through the engines, tools and accounts that you connect. You are responsible for what you allow them to
        do, for reviewing their work, and for the accounts, files and systems they can reach. Model output can be wrong.
        Do not rely on it for decisions where an error would cause harm without checking it.
      </p>

      <h2>Third-party services</h2>
      <p>
        Model providers, connected apps, GitHub and other services you use through OpenFolks have their own terms, limits
        and charges. Those apply to your use of them. OpenFolks does not control them and is not affiliated with them.
      </p>

      <h2>Your content</h2>
      <p>
        Your conversations, files and settings stay yours. OpenFolks does not claim any rights in them. See the{' '}
        <Link href="/privacy">privacy page</Link> for what the app sends to other services.
      </p>

      <h2>This website</h2>
      <p>
        The website and documentation are provided for information. We try to keep them accurate, but they may lag behind
        the software. The code and documentation are in the{' '}
        <a href={REPO} rel="noopener">project repository</a>, where you can report errors.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, the authors and contributors are not liable for any claim, damages or other
        liability arising from the software or its use, as set out in the MIT License.
      </p>

      <h2>Changes</h2>
      <p>These terms may change. The date at the top shows when they were last updated.</p>
    </PageShell>
  );
}
