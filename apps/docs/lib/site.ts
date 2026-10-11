// Order: explicit setting, then the production domain Vercel assigns, then a placeholder.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://openfolks.com');
export const REPO = 'https://github.com/manasdutta04/openfolks';
export const RELEASES = `${REPO}/releases/latest`;
const BASE = `${REPO}/releases/latest/download/`;

export const NAV = [
  { href: '/features', label: 'Features' },
  { href: '/docs', label: 'Docs' },
  { href: '/security', label: 'Security' },
  { href: '/download', label: 'Download' },
] as const;

export const FOOTER = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/download', label: 'Download' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/docs/getting-started/installation', label: 'Installation' },
      { href: '/docs/troubleshooting', label: 'Troubleshooting' },
      { href: REPO, label: 'GitHub', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/security', label: 'Security' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: `${REPO}/blob/main/LICENSE`, label: 'MIT License', external: true },
    ],
  },
] as const;

export type Os = 'windows' | 'mac' | 'linux' | 'other';

export interface DownloadItem {
  os: Exclude<Os, 'other'>;
  label: string;
  detail: string;
  href: string;
  file: string;
}

export const DOWNLOADS: DownloadItem[] = [
  { os: 'windows', label: 'Windows', detail: 'Windows 10 and 11, x64', href: BASE + 'OpenFolks-setup.exe', file: 'OpenFolks-setup.exe' },
  { os: 'mac', label: 'macOS, Apple silicon', detail: 'M-series Macs', href: BASE + 'OpenFolks.dmg', file: 'OpenFolks.dmg' },
  { os: 'mac', label: 'macOS, Intel', detail: 'Intel Macs', href: BASE + 'OpenFolks-intel.dmg', file: 'OpenFolks-intel.dmg' },
  { os: 'linux', label: 'Linux, .deb', detail: 'Ubuntu 24.04, x64 (recommended)', href: BASE + 'OpenFolks-amd64.deb', file: 'OpenFolks-amd64.deb' },
  { os: 'linux', label: 'Linux, AppImage', detail: 'Portable, x64', href: BASE + 'OpenFolks.AppImage', file: 'OpenFolks.AppImage' },
];

export function detectOs(ua: string): Os {
  if (/Windows/i.test(ua)) return 'windows';
  if (/iPhone|iPad|Android/i.test(ua)) return 'other';
  if (/Mac/i.test(ua)) return 'mac';
  if (/Linux|X11|CrOS/i.test(ua)) return 'linux';
  return 'other';
}

export function primaryFor(os: Os): { label: string; href: string } {
  switch (os) {
    case 'windows': return { label: 'Download for Windows', href: DOWNLOADS[0]!.href };
    case 'mac': return { label: 'Download for Mac', href: DOWNLOADS[1]!.href };
    case 'linux': return { label: 'Download for Linux', href: DOWNLOADS[3]!.href };
    default: return { label: 'Download', href: '/download' };
  }
}
