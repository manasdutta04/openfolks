'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { detectOs, primaryFor, type Os } from '@/lib/site';

/** Download button that names the visitor's operating system. Starts as Windows so server and first client render match. */
export function OsButton({ className = 'btn light lg', prefix = false }: { className?: string; prefix?: boolean }) {
  const [os, setOs] = useState<Os>('windows');
  useEffect(() => setOs(detectOs(navigator.userAgent)), []);
  const cta = primaryFor(os);
  const external = cta.href.startsWith('http');
  const label = prefix ? cta.label.replace('Download for', 'Get for') : cta.label;
  return external ? (
    <a className={className} href={cta.href}>{label}</a>
  ) : (
    <Link className={className} href={cta.href}>{label}</Link>
  );
}

export function useVisitorOs(): Os {
  const [os, setOs] = useState<Os>('windows');
  useEffect(() => setOs(detectOs(navigator.userAgent)), []);
  return os;
}
