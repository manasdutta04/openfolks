'use client';

import { useEffect, useState } from 'react';
import { FOLKS, type FolkId } from '@/lib/folks';
import { FolkAvatar } from './FolkAvatar';

const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Handoff() {
  const steps: [FolkId, string][] = [
    ['scout', 'Asking Scout'],
    ['inbox', 'Passing it to Inbox'],
    ['chief', 'Sending it to Chief'],
    ['dev', 'Opening a task for Dev Crew'],
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce()) return;
    const t = setInterval(() => setI((n) => (n + 1) % steps.length), 1700);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="handoff">
      {steps.map(([id, label], n) => {
        const f = FOLKS[id];
        return (
          <div key={id} className={n === i ? 'hand on' : 'hand'}>
            <FolkAvatar type={f.type} color={f.color} size={34} working={n === i} label={f.name} />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Computers() {
  const opts = [
    ['This computer', 'Control of your own desktop, only if you turn it on'],
    ['Local VM', 'An isolated desktop in Docker or Podman'],
    ['Cloud desktop', 'A hosted computer, or your own server'],
  ] as const;
  const [on, setOn] = useState(1);
  const [takeover, setTakeover] = useState(false);
  return (
    <div className="computers">
      <div className="tabrow" role="tablist" aria-label="Where a folk works">
        {opts.map(([name], n) => (
          <button key={name} role="tab" aria-selected={n === on} className={n === on ? 'on' : ''} onClick={() => { setOn(n); setTakeover(false); }}>
            {name}
          </button>
        ))}
      </div>
      <div className="screen">
        <div className="screen-top">{opts[on]![1]}</div>
        <div className="screen-body">
          <div className="task">Sign in to the support tool and work through the queue.</div>
          <div className="status"><i className={takeover ? '' : 'pulse'} />{takeover ? 'You are in control' : 'Folk is working'}</div>
        </div>
        <button className="btn dark sm" onClick={() => setTakeover((v) => !v)}>{takeover ? 'Hand back to the folk' : 'Take over'}</button>
      </div>
    </div>
  );
}

export function Routine() {
  const [state, setState] = useState<'idle' | 'watching' | 'saved'>('idle');
  useEffect(() => {
    if (state !== 'watching') return;
    const t = setTimeout(() => setState('saved'), 2600);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <div className="routine">
      <div className="rec-card">
        <FolkAvatar type="hexagon" color="orange" size={40} working={state === 'watching'} sleeping={state === 'idle'} label="Reporting folk" />
        <div>
          <b>Weekly report</b>
          <small>
            {state === 'idle' && 'Waiting to be shown the steps'}
            {state === 'watching' && 'Watching the steps'}
            {state === 'saved' && 'Saved. Runs every weekday.'}
          </small>
        </div>
      </div>
      <button className="btn light sm" onClick={() => setState(state === 'saved' ? 'idle' : 'watching')} disabled={state === 'watching'}>
        {state === 'saved' ? 'Reset' : state === 'watching' ? 'Watching…' : 'Show the steps'}
      </button>
    </div>
  );
}

export function Memory() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="memory">
      <div className="bubble folk">Acme replied about pricing in the same thread as last quarter. I had the context, so I answered it.</div>
      <button className={saved ? 'note saved' : 'note'} onClick={() => setSaved(true)}>
        <b>{saved ? 'Saved to memory:' : 'Note for next time:'}</b> they only sign annual contracts, and Dana approves them.
      </button>
      <small>{saved ? 'Memory is plain text. You can open and edit it.' : 'Select the note to save it'}</small>
    </div>
  );
}
