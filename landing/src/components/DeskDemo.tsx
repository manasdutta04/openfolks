import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FOLKS, type FolkId } from "../folks";
import { SUGGESTIONS, THREADS, replyFor, type Msg } from "../demo/script";
import { FolkAvatar } from "./FolkAvatar";

type Shown = Record<FolkId, Msg[]>;

const reduceMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function MsgView({ m }: { m: Msg }) {
  if (m.kind === "text") return <div className={`bubble ${m.from}`}>{m.text}</div>;
  if (m.kind === "steps")
    return (
      <div className="bubble folk steps">
        {m.lines.map(([k, v]) => (
          <div key={k}>
            <span className="tick">✓</span> <b>{k}</b> → {v}
          </div>
        ))}
      </div>
    );
  if (m.kind === "routine")
    return (
      <div className="divider">
        Created routine <span className="clock">◷</span> <b>{m.name}</b>
      </div>
    );
  const a = FOLKS[m.a];
  const b = FOLKS[m.b];
  return (
    <>
      <div className="divider">
        Messages from <FolkAvatar type={a.type} color={a.color} size={18} /> {a.name} and{" "}
        <FolkAvatar type={b.type} color={b.color} size={18} /> {b.name}
      </div>
      <div className="bubble folk">
        <b style={{ color: "var(--accent)" }}>{a.name}</b> {m.text}
      </div>
    </>
  );
}

export function DeskDemo() {
  const [active, setActive] = useState<FolkId>("outbound");
  const [shown, setShown] = useState<Shown>(() => {
    const init = {} as Shown;
    for (const t of THREADS) init[t.id] = [];
    return init;
  });
  const [busy, setBusy] = useState<FolkId | null>(null);
  const [typing, setTyping] = useState<FolkId | null>(null);
  const [unread, setUnread] = useState<Set<FolkId>>(new Set(["inbox"]));
  const [draft, setDraft] = useState("");
  const played = useRef(new Set<FolkId>());
  const runId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const push = useCallback((id: FolkId, m: Msg) => setShown((s) => ({ ...s, [id]: [...s[id], m] })), []);

  const play = useCallback(async (id: FolkId) => {
    if (played.current.has(id)) return;
    played.current.add(id);
    const me = ++runId.current;
    const thread = THREADS.find((t) => t.id === id)!;
    if (reduceMotion()) {
      setShown((s) => ({ ...s, [id]: thread.messages }));
      return;
    }
    setBusy(id);
    for (const m of thread.messages) {
      if (!alive.current) return;
      const fromFolk = m.kind !== "text" || m.from === "folk";
      if (fromFolk) {
        setTyping(id);
        await sleep(m.kind === "steps" ? 1300 : 900);
        setTyping(null);
      } else await sleep(450);
      if (!alive.current) return;
      push(id, m);
      await sleep(m.kind === "routine" ? 400 : 650);
    }
    if (runId.current === me) setBusy(null);
  }, [push]);

  // auto-play the first thread when the demo scrolls into view
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { void play("outbound"); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [play]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion() ? "auto" : "smooth" });
  }, [shown, typing, active]);

  const select = (id: FolkId) => {
    setActive(id);
    setUnread((u) => { const n = new Set(u); n.delete(id); return n; });
    void play(id);
  };

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || busy === active) return;
    const id = active;
    setDraft("");
    played.current.add(id);
    push(id, { kind: "text", from: "you", text: value });
    setBusy(id);
    setTyping(id);
    await sleep(reduceMotion() ? 0 : 1100);
    setTyping(null);
    if (!alive.current) return;
    push(id, { kind: "text", from: "folk", text: replyFor(value) });
    setBusy(null);
  };

  const folk = FOLKS[active];
  const messages = shown[active];
  const rows = useMemo(() => THREADS, []);
  const last = (id: FolkId, fallback: string) => {
    const t = [...shown[id]].reverse().find((m) => m.kind === "text" && m.from === "folk");
    return t && t.kind === "text" ? t.text : fallback;
  };

  return (
    <div className="desk" ref={root}>
      <div className="desk-bar">
        <span className="tl r" /><span className="tl y" /><span className="tl g" />
        <span className="spacer" />
        <button className="icon-btn" aria-label="Plus" tabIndex={-1}>+</button>
      </div>
      <div className="desk-body">
        <aside className="desk-side" aria-label="Folks">
          <div className="search">⌕ Search</div>
          <ul>
            {rows.map((t) => {
              const f = FOLKS[t.id];
              return (
                <li key={t.id}>
                  <button className={active === t.id ? "row active" : "row"} onClick={() => select(t.id)}>
                    <span className="av">
                      <FolkAvatar type={f.type} color={f.color} size={40} working={busy === t.id} label={f.name} />
                      {unread.has(t.id) && <i className="unread" />}
                    </span>
                    <span className="meta">
                      <span className="top"><b>{f.name}</b><time>{t.time}</time></span>
                      <small>{last(t.id, t.preview)}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="me"><span className="you-av">YO</span> You</div>
        </aside>
        <section className="desk-chat" aria-label={`Conversation with ${folk.name}`}>
          <header className="chat-head">
            <FolkAvatar type={folk.type} color={folk.color} size={22} working={busy === active} label={folk.name} />
            {folk.name}
            <span className="chip">{folk.role}</span>
          </header>
          <div className="msgs" ref={scroller} aria-live="polite">
            {messages.map((m, i) => <MsgView key={i} m={m} />)}
            {typing === active && (
              <div className="bubble folk typing" aria-label={`${folk.name} is typing`}>
                <span /><span /><span />
              </div>
            )}
          </div>
          <div className="suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => void send(s)} disabled={busy === active}>{s}</button>
            ))}
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); void send(draft); }}>
            <span className="plus">+</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${folk.name}`}
              aria-label={`Message ${folk.name}`}
            />
            <button className="send" type="submit" aria-label="Send" disabled={!draft.trim() || busy === active}>↑</button>
          </form>
        </section>
      </div>
    </div>
  );
}
