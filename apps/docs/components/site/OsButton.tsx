'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { detectOs, primaryFor, type Os } from '@/lib/site';

function OsIcon({ os }: { os: Os }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true, focusable: false } as const;
  switch (os) {
    case 'windows':
      return (
        <svg {...common}><path d="M3 5.5 10.5 4.5v7H3zM11.5 4.35 21 3v8.5h-9.5zM3 12.5h7.5v7L3 18.5zM11.5 12.5H21V21l-9.5-1.35z" /></svg>
      );
    case 'mac':
      return (
        <svg {...common}><path d="M16.37 12.6c-.03-2.64 2.16-3.9 2.26-3.96-1.23-1.8-3.15-2.05-3.83-2.08-1.63-.16-3.18.96-4.01.96-.83 0-2.1-.94-3.45-.91-1.77.03-3.4 1.03-4.31 2.61-1.84 3.19-.47 7.92 1.32 10.5.88 1.26 1.92 2.68 3.29 2.63 1.32-.05 1.82-.85 3.42-.85 1.59 0 2.05.85 3.45.82 1.42-.02 2.32-1.29 3.18-2.56 1-1.46 1.41-2.87 1.44-2.94-.03-.01-2.75-1.05-2.78-4.2zM13.76 4.86c.73-.88 1.22-2.1 1.08-3.32-1.05.04-2.31.7-3.06 1.57-.67.78-1.26 2.02-1.1 3.21 1.17.09 2.35-.6 3.08-1.46z" /></svg>
      );
    case 'linux':
      return (
        <svg {...common}><path d="M12 2c-2.2 0-3.5 1.9-3.5 4.6 0 1.4-.4 2.2-1.2 3.5C6.2 11.8 5 13.7 5 16c0 1.4.5 2.2 1.4 2.8-.3.7-.9 1.2-1.9 1.5-.7.2-.5 1.2.3 1.4 1.7.4 3.3-.1 4.2-.9.6.2 1.3.2 2 .2s1.4 0 2-.2c.9.8 2.5 1.3 4.2.9.8-.2 1-1.2.3-1.4-1-.3-1.6-.8-1.9-1.5.9-.6 1.4-1.4 1.4-2.8 0-2.3-1.2-4.2-2.3-5.9-.8-1.3-1.2-2.1-1.2-3.5C15.5 3.9 14.2 2 12 2zm-1.3 4.2a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm2.6 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z" /></svg>
      );
    default:
      return null;
  }
}

/** Download button that names the visitor's operating system. Starts as Windows so server and first client render match. */
export function OsButton({ className = 'btn light lg', prefix = false }: { className?: string; prefix?: boolean }) {
  const [os, setOs] = useState<Os>('windows');
  useEffect(() => setOs(detectOs(navigator.userAgent)), []);
  const cta = primaryFor(os);
  const external = cta.href.startsWith('http');
  const label = prefix ? cta.label.replace('Download for', 'Get for') : cta.label;
  const content = (
    <>
      <OsIcon os={os} />
      {label}
    </>
  );
  return external ? (
    <a className={className} href={cta.href}>{content}</a>
  ) : (
    <Link className={className} href={cta.href}>{content}</Link>
  );
}

export function useVisitorOs(): Os {
  const [os, setOs] = useState<Os>('windows');
  useEffect(() => setOs(detectOs(navigator.userAgent)), []);
  return os;
}
