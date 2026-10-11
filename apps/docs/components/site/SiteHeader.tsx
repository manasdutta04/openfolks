'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV, REPO } from '@/lib/site';
import { OsButton } from './OsButton';

export function SiteHeader() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 8);
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <Link className="brand" href="/">
        <img src="/openfolk.png" alt="" width={28} height={28} />
        OpenFolks
      </Link>
      <nav aria-label="Primary" className="nav-links">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={path === n.href || path.startsWith(n.href + '/') ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
        <a href={REPO} rel="noopener">GitHub</a>
      </nav>
      <OsButton className="btn light sm nav-cta" prefix />
      <button className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close' : 'Menu'}
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="mobile-menu">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
          <Link href="/privacy">Privacy</Link>
          <a href={REPO} rel="noopener">GitHub</a>
        </nav>
      )}
    </header>
  );
}
