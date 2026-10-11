import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { REPO } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How OpenFolks limits what folks can do, how it handles secrets, and how to report a vulnerability.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <PageShell
      title="Security"
      intro="OpenFolks runs on your computer and acts through tools you grant. This page describes the boundaries it enforces and the ones that are up to you."
      updated="11 October 2026"
    >
      <h2>Design</h2>
      <ul>
        <li>The application process owns engine processes and listens on the loopback interface, not the network.</li>
        <li>The interface receives whether a credential is configured, not the credential itself.</li>
        <li>Each provider credential is passed only to the process that needs it, so unrelated engine processes do not inherit it.</li>
        <li>Risky actions appear as approval cards in the conversation instead of being allowed implicitly.</li>
        <li>Control of your own computer is a separate opt-in, chosen per folk.</li>
        <li>Cloud and server backends are validated before they are reused.</li>
      </ul>

      <h2>Approvals</h2>
      <p>
        When an engine reports a permission request, OpenFolks shows it in the thread with its scope. Cancelling a turn
        closes outstanding requests so a stale approval cannot be answered later. &ldquo;Always allow&rdquo; is tied to
        a specific request and does not grant general execution.
      </p>

      <h2>Secrets</h2>
      <ul>
        <li>Packaged builds use write-only settings and operating-system-backed encryption where it is available.</li>
        <li>Secret values are removed from configuration responses.</li>
        <li>OAuth tokens for connected apps are held by the connection provider, not stored in folk instructions.</li>
        <li>Do not paste API keys into a conversation. Anything in a conversation can be sent to a model provider.</li>
      </ul>

      <h2>Webhooks and remote access</h2>
      <p>
        The webhook receiver is a separate listener that exposes a health route and secret hook routes only. It does not
        expose the rest of the application. If you make it reachable from the internet, put a narrow relay in front of it
        and use bearer authentication. Do not expose the main application port.
      </p>

      <h2>Your part</h2>
      <ul>
        <li>Read approvals, especially shell commands, file writes and actions in connected services.</li>
        <li>Use a dedicated environment, such as a Local VM, for untrusted or destructive work.</li>
        <li>Connect accounts with only the access a folk needs.</li>
        <li>Keep OpenFolks and your engine tools up to date.</li>
        <li>
          On a shared computer, assume other administrators can read application data. Use a separate operating system
          account if you need stronger separation.
        </li>
      </ul>

      <div className="callout">
        <p>
          Running locally does not remove risk. A folk with tool or computer access can act on whatever you grant it.
        </p>
      </div>

      <h2>Installers</h2>
      <p>
        The installers are not signed with an Apple or Microsoft certificate. Each release publishes a{' '}
        <code>SHA256SUMS.txt</code> file. Compare your download with it before you run it. The{' '}
        <Link href="/download">download page</Link> shows how.
      </p>

      <h2>Reporting a vulnerability</h2>
      <p>
        Please report security issues privately so a fix can be released before details are public. Use{' '}
        <a href={`${REPO}/security/advisories/new`} rel="noopener">GitHub private vulnerability reporting</a> for this
        repository. Include the version, the steps to reproduce, and the impact you expect. Do not open a public issue
        with exploit details.
      </p>
      <p>
        If private reporting is not available to you, open a public issue that asks for a private contact and contains no
        technical detail. A machine-readable contact is published at{' '}
        <a href="/.well-known/security.txt">/.well-known/security.txt</a>.
      </p>

      <h3>Supported versions</h3>
      <p>Security fixes are made in the latest release. Update to the newest version before reporting.</p>

      <h2>More detail</h2>
      <ul>
        <li><Link href="/docs/security">Security model</Link></li>
        <li><Link href="/docs/security/permissions-and-secrets">Permissions and secrets</Link></li>
        <li><Link href="/privacy">Privacy</Link></li>
      </ul>
    </PageShell>
  );
}
