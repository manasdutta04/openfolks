'use client';

import { useState } from 'react';
import { COLORS, SHAPE_BY_COLOR, type ColorName } from '@/lib/folks';
import type { Crew } from '@/lib/crews';
import { FolkAvatar } from './FolkAvatar';

export function CrewTabs({ crews }: { crews: Crew[] }) {
  const [i, setI] = useState(0);
  const crew = crews[i];
  if (!crew) return null;
  return (
    <div className="jobs">
      <ul className="job-tabs" role="tablist" aria-label="Crews">
        {crews.map((c, n) => (
          <li key={c.name}>
            <button role="tab" aria-selected={n === i} className={n === i ? 'on' : ''} onClick={() => setI(n)}>{c.name}</button>
          </li>
        ))}
      </ul>
      <div className="job-panel" key={crew.name} role="tabpanel">
        <p className="job-desc">{crew.description}</p>
        <div className="members">
          {crew.members.map((m) => {
            const color = (m.color && m.color in COLORS ? m.color : 'blue') as ColorName;
            return (
              <div className="member" key={m.key}>
                <FolkAvatar type={SHAPE_BY_COLOR[color] ?? 'clover'} color={color} size={54} interactive label={m.name} />
                <b>{m.name}</b>
                <em>{m.title}</em>
                <small>{m.description}</small>
              </div>
            );
          })}
        </div>
        <p className="hint">Install from <b>Marketplace → {crew.name}</b> in the app.</p>
      </div>
    </div>
  );
}
