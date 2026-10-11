'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FOLKS, type FolkId } from '@/lib/folks';
import { SUGGESTIONS, THREADS, replyFor, type Msg } from '@/lib/demo-script';
import { FolkAvatar } from './FolkAvatar';
import { PROVIDERS } from '@/lib/providers';

type Shown = Record<FolkId, Msg[]>;

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const ICONS: Record<string, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  clip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  right: <path d="m9 18 6-6-6-6" />,
  down: <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" />,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z" /></>,
  store: <><path d="M3 9h18l-1.5-5h-15z" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
  sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  radio: <><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.5m-8.4-.1a6 6 0 0 1 0-8.5m11.3-2.8a10 10 0 0 1 0 14.1m-14.1 0a10 10 0 0 1 0-14.1" /></>,
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
};

function Icon({ name, size = 18 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** Replaces @Name with a coloured mention, as the app does. */
function withMentions(text: string) {
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@') ? <b key={i} className="mention">{part}</b> : <span key={i}>{part}</span>,
  );
}

function MsgView({ m }: { m: Msg }) {
  if (m.kind === 'text') {
    return <div className={`bubble ${m.from}`}>{withMentions(m.text)}</div>;
  }
  if (m.kind === 'worked') {
    return (
      <div className="chipline">
        <span className="pillchip"><Icon name="check" size={14} /> Worked for {m.seconds}s <Icon name="right" size={14} /></span>
      </div>
    );
  }
  if (m.kind === 'messaged') {
    const f = FOLKS[m.to];
    return (
      <div className="chipline">
        <span className="pillchip">
          <FolkAvatar type={f.type} color={f.color} size={18} label={f.name} /> Messaged @{f.name} <Icon name="right" size={14} />
        </span>
      </div>
    );
  }
  if (m.kind === 'steps') {
    return (
      <div className="bubble folk steps">
        {m.lines.map(([k, v]) => (
          <div key={k}><span className="tick"><Icon name="check" size={14} /></span> <b>{k}</b> {v}</div>
        ))}
      </div>
    );
  }
  return (
    <div className="divider">Created routine <b>{m.name}</b></div>
  );
}

function preview(msgs: Msg[], fallback: string) {
  const last = [...msgs].reverse().find((m) => m.kind === 'text');
  const text = last && last.kind === 'text' ? last.text.split('\n')[0]! : fallback;
  return text.replace(/@/g, '');
}

const FALLBACK_PREVIEW: Partial<Record<FolkId, string>> = {
  assistant: 'Ready when you are.',
  coach: 'Ready when you are.',
  vision: 'Ready when you are.',
  inbox: 'Ready when you are.',
  dev: 'Ready when you are.',
};

function ComputerPanel({ folk, busy }: { folk: string; busy: boolean }) {
  const [secs, setSecs] = useState(0);
  const [takeover, setTakeover] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setSecs((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return (
    <div className="cp">
      <header><b>Computer</b><span className="live"><i /> Running</span></header>
      <div className="cp-meta"><span>Local VM</span><span>Up {mm}:{ss}</span></div>
      <div className={`screen2 ${takeover ? 'mine' : ''}`} aria-label="Live view of the folk computer">
        <div className="win-bar"><i /><i /><i /><span>support.example.com</span></div>
        <div className="win-body">
          <div className="sk w60" /><div className="sk w90" /><div className="sk w75" />
          <div className="sk-row"><div className="sk box" /><div className="sk box" /></div>
          <div className="sk w40" />
          <span className="ptr" />
        </div>
      </div>
      <p className="cp-task">
        {takeover ? 'You are in control. The folk is paused.' : busy ? `${folk} is working in this computer.` : `${folk} is idle. The computer stays on.`}
      </p>
      <div className="cp-actions">
        <button className="btn light sm" onClick={() => setTakeover((v) => !v)}>{takeover ? 'Hand back' : 'Take over'}</button>
        <button className="btn dark sm" tabIndex={-1}>Restart</button>
      </div>
    </div>
  );
}

const TAPE: Record<string, string[]> = {
  assistant: ['turn.start', 'tool.call create_folk name=Coach', 'tool.result ok', 'tool.call create_folk name=Vision', 'tool.result ok', 'delegate Coach: draft starter plan', 'delegate Vision: draft starter routine', 'turn.end 16s'],
  coach: ['turn.start', 'tool.call read plan.md', 'tool.result 0 files', 'message.stream 3 sections', 'turn.end 9s'],
  vision: ['turn.start', 'tool.call routine.create "Eye break reminders"', 'tool.result id=rt_1', 'message.final', 'turn.end 4s'],
  inbox: ['turn.start', 'tool.call gmail.list unread', 'tool.result 14 threads', 'approval.request gmail.send (9 drafts)', 'approval.granted', 'tool.call gmail.send x9', 'turn.end 41s'],
  dev: ['turn.start', 'tool.call shell: pnpm test checkout', 'tool.result 1 failed', 'tool.call edit cart.fixture.ts', 'tool.call shell: pnpm test checkout x3', 'tool.result 3 passed', 'turn.end 58s'],
};

function BackstagePanel({ folk, active, busy }: { folk: string; active: string; busy: boolean }) {
  const lines = TAPE[active] ?? TAPE.assistant!;
  const [n, setN] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => setN(1), [active]);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v >= lines.length ? 1 : v + 1)), 1100);
    return () => clearInterval(t);
  }, [lines]);
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [n]);
  return (
    <div className="cp">
      <header><b>Backstage</b><span className="live"><i /> {busy ? 'Live' : 'Replay'}</span></header>
      <div className="cp-meta"><span>{folk}</span><span>turn tape</span></div>
      <div className="tape" ref={box}>
        {lines.slice(0, n).map((l, i) => (
          <div key={i} className={l.startsWith('approval') ? 'ev warn' : 'ev'}><time>{String(i * 2).padStart(2, '0')}s</time><code>{l}</code></div>
        ))}
      </div>
      <p className="cp-task">Backstage lists every tool call, approval and error for the open thread.</p>
    </div>
  );
}

export function DeskDemo() {
  const [active, setActive] = useState<FolkId>('assistant');
  const [shown, setShown] = useState<Shown>(() => {
    const init = {} as Shown;
    for (const id of Object.keys(FOLKS) as FolkId[]) init[id] = [];
    return init;
  });
  const [busy, setBusy] = useState<FolkId | null>(null);
  const [typing, setTyping] = useState<FolkId | null>(null);
  const [draft, setDraft] = useState('');
  const [panel, setPanel] = useState<'computer' | 'backstage' | null>(null);
  const [model, setModel] = useState('Claude Sonnet 5');
  const [pane, setPane] = useState('claude');
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!modelOpen) return;
    const away = (e: PointerEvent) => {
      if (!modelRef.current?.contains(e.target as Node)) setModelOpen(false);
    };
    addEventListener('pointerdown', away);
    return () => removeEventListener('pointerdown', away);
  }, [modelOpen]);
  const played = useRef(new Set<FolkId>());
  const scroller = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const push = useCallback((id: FolkId, m: Msg) => setShown((s) => ({ ...s, [id]: [...s[id], m] })), []);

  const play = useCallback(
    async (id: FolkId) => {
      if (played.current.has(id)) return;
      played.current.add(id);
      const thread = THREADS.find((t) => t.id === id);
      if (!thread) return;
      if (reduceMotion()) {
        setShown((s) => ({ ...s, [id]: thread.messages }));
        return;
      }
      setBusy(id);
      for (const m of thread.messages) {
        if (!alive.current) return;
        const fromFolk = m.kind !== 'text' || m.from === 'folk';
        if (fromFolk) {
          setTyping(id);
          await sleep(m.kind === 'worked' ? 1400 : m.kind === 'messaged' ? 500 : 1000);
          setTyping(null);
        } else await sleep(450);
        if (!alive.current) return;
        push(id, m);
        await sleep(m.kind === 'messaged' ? 250 : 600);
      }
      setBusy(null);
    },
    [push],
  );

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      void play('assistant');
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          void play('assistant');
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }, [shown, typing, active]);

  const select = (id: FolkId) => {
    setActive(id);
    void play(id);
  };

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || busy === active) return;
    const id = active;
    setDraft('');
    played.current.add(id);
    push(id, { kind: 'text', from: 'you', text: value });
    setBusy(id);
    setTyping(id);
    await sleep(reduceMotion() ? 0 : 1100);
    setTyping(null);
    if (!alive.current) return;
    push(id, { kind: 'text', from: 'folk', text: replyFor(value) });
    setBusy(null);
  };

  const folk = FOLKS[active];
  const messages = shown[active];
  const row = (id: FolkId, opts: { big?: boolean; star?: boolean } = {}) => {
    const f = FOLKS[id];
    return (
      <li key={id}>
        <button className={`row ${opts.big ? 'big' : ''} ${active === id ? 'active' : ''}`} onClick={() => select(id)}>
          <FolkAvatar type={f.type} color={f.color} size={opts.big ? 52 : 40} working={busy === id} label={f.name} />
          <span className="meta">
            <b>{f.name}{opts.star && <Icon name="star" size={13} />}</b>
            <small>{preview(shown[id], FALLBACK_PREVIEW[id] ?? '')}</small>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="desk" ref={root}>
      <div className="desk-bar">
        <span className="tl r" /><span className="tl y" /><span className="tl g" />
        <b>OpenFolks</b>
      </div>
      <div className={`desk-body ${panel ? 'with-panel' : ''}`}>
        <aside className="desk-side" aria-label="Folks">
          <div className="side-top">
            <div className="search"><Icon name="search" size={16} /> Search <kbd>Ctrl+K</kbd></div>
            <button className="sq" tabIndex={-1} aria-hidden="true"><Icon name="panel" /></button>
            <button className="sq" tabIndex={-1} aria-hidden="true"><Icon name="plus" /></button>
          </div>
          <div className="side-scroll">
            <ul>{row('assistant', { big: true, star: true })}</ul>
            <h3 className="sec">Folk chats</h3>
            <ul>
              <li>
                <button className={`row ${active === 'coach' ? 'active' : ''}`} onClick={() => select('coach')}>
                  <span className="pair">
                    <FolkAvatar type={FOLKS.assistant.type} color={FOLKS.assistant.color} size={34} label="Assistant" />
                    <FolkAvatar type={FOLKS.coach.type} color={FOLKS.coach.color} size={34} working={busy === 'coach'} label="Coach" />
                  </span>
                  <span className="meta"><b>Assistant ⇄ Coach</b><small>{preview(shown.coach, 'Ready when you are.')}</small></span>
                </button>
              </li>
            </ul>
            <h3 className="sec">Folks</h3>
            <ul>{row('vision')}{row('inbox')}{row('dev')}</ul>
          </div>
          <div className="side-foot">
            <span><Icon name="inbox" /> Desk</span>
            <span><Icon name="store" /> Marketplace</span>
            <span><Icon name="sliders" /> Settings</span>
          </div>
        </aside>

        <section className="desk-chat" aria-label={`Conversation with ${folk.name}`}>
          <header className="chat-head">
            <FolkAvatar type={folk.type} color={folk.color} size={34} working={busy === active} label={folk.name} />
            <b>{folk.name}</b>
            <span className="pill2"><Icon name="plus" size={13} /> Task</span>
            {active === 'assistant' && <span className="pill2 leader"><Icon name="star" size={13} /> Leader</span>}
            <span className="grow" />
            <div className="model-wrap" ref={modelRef}>
              <button className="model" aria-expanded={modelOpen} aria-haspopup="listbox" onClick={() => setModelOpen((v) => !v)}>
                {model} <Icon name="down" size={14} />
              </button>
              {modelOpen && (
                <div className="model-pop" role="dialog" aria-label="Choose a model">
                  <div className="rail">
                    {(['Cloud', 'Local'] as const).map((g) => (
                      <div key={g} className="rail-group">
                        <span>{g}</span>
                        {PROVIDERS.filter((p) => p.group === g).map((p) => (
                          <button
                            key={p.id}
                            className={p.id === pane ? 'on' : ''}
                            aria-label={p.name}
                            title={p.name}
                            style={{ color: p.color }}
                            onClick={() => setPane(p.id)}
                          >
                            {p.glyph}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const p = PROVIDERS.find((x) => x.id === pane)!;
                    return (
                      <div className="mp-pane">
                        <div className="mp-head"><b>{p.name}</b><span>{p.status}</span></div>
                        <p>{p.blurb}</p>
                        <h4>Suggested</h4>
                        <ul>
                          {p.models.map((m) => (
                            <li key={m.name}>
                              <button className={m.name === model ? 'on' : ''} onClick={() => { setModel(m.name); setModelOpen(false); }}>
                                {m.name}{m.default && <em>Default</em>}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <small>Demo only. Nothing is sent anywhere.</small>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <button className={`hbtn ${panel === 'computer' ? 'on' : ''}`} aria-label="Computer" aria-pressed={panel === 'computer'} onClick={() => setPanel(panel === 'computer' ? null : 'computer')}><Icon name="monitor" /></button>
            <button className={`hbtn ${panel === 'backstage' ? 'on' : ''}`} aria-label="Backstage" aria-pressed={panel === 'backstage'} onClick={() => setPanel(panel === 'backstage' ? null : 'backstage')}><Icon name="radio" /></button>
          </header>
          <div className="msgs" ref={scroller} aria-live="polite">
            {messages.map((m, i) => <MsgView key={i} m={m} />)}
            {typing === active && (
              <div className="bubble folk typing" aria-label={`${folk.name} is typing`}><span /><span /><span /></div>
            )}
          </div>
          <div className="suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => void send(s)} disabled={busy === active}>{s}</button>
            ))}
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); void send(draft); }}>
            <Icon name="clip" />
            <span className="auto"><Icon name="bolt" size={15} /> Auto</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Brief ${folk.name}`} aria-label={`Message ${folk.name}`} />
            <button className="send" type="submit" aria-label="Send" disabled={!draft.trim() || busy === active}><Icon name="up" size={16} /></button>
          </form>
        </section>
        {panel && (
          <aside className="desk-panel" aria-label={panel === 'computer' ? 'Computer' : 'Backstage'}>
            {panel === 'computer' ? <ComputerPanel folk={folk.name} busy={busy === active} /> : <BackstagePanel folk={folk.name} active={active} busy={busy === active} />}
          </aside>
        )}
      </div>
    </div>
  );
}
