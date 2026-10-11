import type { Metadata } from 'next';
import Link from 'next/link';
import { CopyCode } from '@/components/site/CopyCode';
import { DownloadList } from '@/components/site/DownloadList';
import { PageShell } from '@/components/site/PageShell';
import { RELEASES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Download',
  description: 'Download OpenFolks for Windows, macOS and Ubuntu, and check the file before you run it.',
  alternates: { canonical: '/download' },
};

export default function DownloadPage() {
  return (
    <PageShell
      title="Download"
      intro="OpenFolks is free. Installers are published on GitHub for Windows, macOS and Ubuntu."
    >
      <DownloadList />

      <p>
        Every link above points to the latest release. Older versions, release notes and checksums are on the{' '}
        <a href={RELEASES} rel="noopener">GitHub release page</a>.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Windows 10 or 11, 64-bit.</li>
        <li>macOS on Apple silicon or Intel.</li>
        <li>Ubuntu 24.04, 64-bit. The AppImage is portable and does not need an installer.</li>
        <li>
          At least one engine you can sign in to, such as Claude or Codex, or a local model. See{' '}
          <Link href="/docs/getting-started/installation">Installation</Link>.
        </li>
        <li>Docker or Podman, only if you want to use a Local VM.</li>
      </ul>

      <h2>First launch</h2>
      <p>
        The installers are not signed with an Apple or Microsoft certificate, because OpenFolks is free and open source.
        Your system will ask you to confirm the first time.
      </p>

      <h3>Windows</h3>
      <p>
        If SmartScreen shows &ldquo;Windows protected your PC&rdquo;, choose <b>More info</b>, then <b>Run anyway</b>.
        OpenFolks installs for your user and does not need administrator rights.
      </p>

      <h3>macOS</h3>
      <p>
        Open the disk image and drag OpenFolks to Applications. If macOS says the app is damaged or from an unidentified
        developer, run this once in Terminal:
      </p>
      <CopyCode text="xattr -cr /Applications/OpenFolks.app" />
      <p>You can also right-click the app, choose Open, and confirm.</p>

      <h3>Linux</h3>
      <CopyCode text="sudo apt install ./OpenFolks-amd64.deb" />
      <p>For the AppImage, make it executable and run it:</p>
      <CopyCode text="chmod +x OpenFolks.AppImage && ./OpenFolks.AppImage" />

      <h2>Check your download</h2>
      <p>
        Each release includes <code>SHA256SUMS.txt</code>. Compute the checksum of the file you downloaded and compare it
        with the matching line.
      </p>
      <p>Windows (PowerShell):</p>
      <CopyCode text="Get-FileHash .\OpenFolks-setup.exe -Algorithm SHA256" />
      <p>macOS and Linux:</p>
      <CopyCode text="shasum -a 256 OpenFolks.dmg" />

      <h2>Updates</h2>
      <p>
        The Windows and macOS apps check for new versions and offer to install them. On Linux, install the new{' '}
        <code>.deb</code> over the old one.
      </p>

      <h2>Build from source</h2>
      <p>
        You can build OpenFolks yourself. The steps are in the{' '}
        <Link href="/docs/getting-started/installation">installation guide</Link>.
      </p>
    </PageShell>
  );
}
