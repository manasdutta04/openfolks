import BeamWordmarkFooter from './BeamWordmarkFooter';
import { REPO } from '@/lib/site';

export function SiteFooter() {
  return (
    <BeamWordmarkFooter
      brand="openfolks"
      company="OpenFolks contributors"
      background="#0a0a0a"
      ink="#f2f2f5"
      muted="#8f8f9a"
      accent="#9b8fd9"
      wordTop="#4a4380"
      wordFoot="#0d0c12"
      fontSans='var(--font-site-sans), "Segoe UI", system-ui, sans-serif'
      wordWeight={500}
      socials={[{ label: 'GitHub', href: REPO, icon: 'github' }]}
      credits={[
        { label: 'A desktop app for working with a team of AI agents.' },
        { lead: 'Free and open source under the ', label: 'MIT License', href: `${REPO}/blob/main/LICENSE` },
        { label: 'Your data stays on your computer unless you send it out.' },
      ]}
      extra={
        <p className="built">
          Made by the OpenFolks community
          <span className="built-av" tabIndex={0}>
            <img src="/openfolk.png" alt="OpenFolks mascot" width={26} height={26} />
            <span className="built-tip" role="tooltip">Hi, this is the OpenFolks mark</span>
          </span>
        </p>
      }
      columns={[
        {
          title: 'Product',
          links: [
            { label: 'Features', href: '/features' },
            { label: 'Download', href: '/download' },
            { label: 'Documentation', href: '/docs' },
            { label: 'Changelog', href: '/docs/changelog' },
          ],
        },
        {
          title: 'Trust',
          links: [
            { label: 'Security', href: '/security' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Source code', href: REPO },
          ],
        },
      ]}
    />
  );
}
