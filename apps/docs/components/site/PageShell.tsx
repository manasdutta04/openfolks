import type { ReactNode } from 'react';

/** Shared layout for text pages: title, short intro, readable column. */
export function PageShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <article className="page">
      <header className="page-head">
        <h1>{title}</h1>
        {intro && <p className="page-intro">{intro}</p>}
        {updated && <p className="page-updated">Last updated {updated}</p>}
      </header>
      <div className="prose-site">{children}</div>
    </article>
  );
}
