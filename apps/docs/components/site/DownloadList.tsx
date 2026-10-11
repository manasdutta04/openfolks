'use client';

import { DOWNLOADS } from '@/lib/site';
import { useVisitorOs } from './OsButton';

export function DownloadList() {
  const os = useVisitorOs();
  return (
    <ul className="dl-table">
      {DOWNLOADS.map((d) => (
        <li key={d.href} className={d.os === os ? 'me' : ''}>
          <div>
            <b>{d.label}</b>
            <small>{d.detail}</small>
            <code>{d.file}</code>
          </div>
          <a className="btn light sm" href={d.href}>Download</a>
        </li>
      ))}
    </ul>
  );
}
