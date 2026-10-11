import Link from 'next/link';
import { IBM_Plex_Sans } from 'next/font/google';
import { Mascot } from '@/components/site/Mascot';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import './(site)/site.css';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-site-sans', display: 'swap' });

export default function NotFound() {
  return (
    <div className={`site ${sans.variable}`}>
      <SiteHeader />
      <main className="notfound">
        <Mascot size={120} label="" />
        <h1>Page not found</h1>
        <p>The page you asked for does not exist or has moved.</p>
        <div className="cta">
          <Link className="btn light" href="/">Go to the home page</Link>
          <Link className="btn dark" href="/docs">Read the docs</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
