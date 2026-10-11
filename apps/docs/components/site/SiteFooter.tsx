import Link from 'next/link';
import { FOOTER } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-top">
        <div className="foot-brand">
          <Link className="brand" href="/">
            <img src="/openfolk.png" alt="" width={24} height={24} />
            OpenFolks
          </Link>
          <p>A desktop app for working with a team of AI agents. Free and open source under the MIT License.</p>
        </div>
        {FOOTER.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2>{col.title}</h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  {'external' in l && l.external ? (
                    <a href={l.href} rel="noopener">{l.label}</a>
                  ) : (
                    <Link href={l.href}>{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <small>© OpenFolks contributors. OpenFolks is not affiliated with any model provider named in the documentation.</small>
    </footer>
  );
}
