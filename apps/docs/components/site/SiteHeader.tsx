'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { REPO } from '@/lib/site';
import { OsButton } from './OsButton';

type Item = { title: string; href: string; description: string };

const PRODUCT: Item[] = [
  { title: 'Features', href: '/features', description: 'Folks, computers, routines, memory and approvals.' },
  { title: 'Crews', href: '/#crews', description: 'Ready-made teams you install from the Marketplace.' },
  { title: 'Download', href: '/download', description: 'Installers for Windows, macOS and Ubuntu.' },
];

const TRUST: Item[] = [
  { title: 'Security', href: '/security', description: 'Boundaries, approvals, and how to report a problem.' },
  { title: 'Privacy', href: '/privacy', description: 'What stays on your computer and what the app sends.' },
  { title: 'Terms', href: '/terms', description: 'The MIT License and terms of use.' },
];

function Menu({ label, items, path }: { label: string; items: Item[]; path: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = items.some((i) => path === i.href || path.startsWith(i.href + '/'));
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('pointerdown', away);
    addEventListener('keydown', esc);
    return () => {
      removeEventListener('pointerdown', away);
      removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div
      ref={ref}
      className="menu"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
    >
      <button className={`menu-trigger ${active ? 'active' : ''}`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="menu-panel">
          {items.map((i) => (
            <li key={i.href}>
              <Link href={i.href}>
                <b>{i.title}</b>
                <span>{i.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="nav">
      <div className="nav-in">
        <div className="nav-left">
          <Link className="brand" href="/" aria-label="OpenFolks home">
            <img src="/openfolk.png" alt="" width={26} height={26} />
            openfolks
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Menu label="Product" items={PRODUCT} path={path} />
            <Menu label="Trust" items={TRUST} path={path} />
            <Link href="/docs" className="plain" aria-current={path.startsWith('/docs') ? 'page' : undefined}>Docs</Link>
            <a href={REPO} rel="noopener" className="plain">GitHub</a>
          </nav>
        </div>
        <div className="nav-right">
          <OsButton className="btn light sm nav-cta" prefix />
          <button className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="mobile-menu">
          {[...PRODUCT, ...TRUST, { title: 'Docs', href: '/docs', description: '' }].map((i) => (
            <Link key={i.href} href={i.href}>{i.title}</Link>
          ))}
          <a href={REPO} rel="noopener">GitHub</a>
          <OsButton className="btn light" />
        </nav>
      )}
    </header>
  );
}
