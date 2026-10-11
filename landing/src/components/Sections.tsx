import { useEffect, useRef, useState, type ReactNode } from "react";
import { COLORS, FOLKS, SHAPE_BY_COLOR, type ColorName, type FolkId } from "../folks";
import { DOWNLOADS, RELEASES, primaryFor, useOs } from "../os";
import { FolkAvatar } from "./FolkAvatar";
import { DeskDemo } from "./DeskDemo";

const REPO = "https://github.com/manasdutta04/openfolks";

/** Fade/slide in once, the way the reference page reveals sections. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setOn(true);
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${on ? "in" : ""} ${className}`}>{children}</div>;
}

export function Nav() {
  const os = useOs();
  const cta = primaryFor(os);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 8);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`nav ${scrolled ? "scrolled" : ""}`}>
      <a className="brand" href="#top"><img src="./logo.png" alt="" width={28} height={28} />OpenFolks</a>
      <nav aria-label="Primary">
        <a href="#work">Product</a>
        <a href="#jobs">Crews</a>
        <a href="#download">Download</a>
        <a href="#faq">FAQ</a>
        <a href={REPO} rel="noopener">GitHub</a>
      </nav>
      <a className="btn light sm" href={cta.href}>{cta.label.replace("Download for", "Get for")}</a>
    </header>
  );
}

function CtaRow() {
  const os = useOs();
  const cta = primaryFor(os);
  return (
    <div className="cta">
      <a className="btn light lg" href={cta.href}>
        {os === "windows" && <WinIcon />}
        {cta.label}
      </a>
      <a className="btn dark lg" href="#download">More downloads</a>
    </div>
  );
}

const WinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M0 2.3 6.5 1.4v6H0zM7.3 1.3 16 0v7.4H7.3zM0 8.2h6.5v6L0 13.7zM7.3 8.2H16V16l-8.7-1.2z" /></svg>
);

export function Hero() {
  return (
    <section className="hero" id="top">
      <a className="pill" href={RELEASES} rel="noopener"><i className="dot" /> OpenFolks 1.0 is here · <span>Read the release notes ↗</span></a>
      <h1>
        Meet <FolkAvatar type="ghost" color="white" size={84} interactive label="OpenFolks mascot" /> OpenFolks
      </h1>
      <p className="lede">
        AI teammates you can give real work to. Folks have their own computer, use your tools like you do,
        and come back with finished work.
      </p>
      <CtaRow />
      <p className="fine">Free &amp; open source · MIT · Windows, macOS and Linux</p>
      <Reveal className="desk-wrap"><DeskDemo /></Reveal>
    </section>
  );
}

export function MessageCard() {
  return (
    <section className="block wide" id="work">
      <Reveal>
        <div className="big-card">
          <div className="copy">
            <h2>Message folks like teammates</h2>
            <p>
              Give tasks to folks like you would a teammate on your desktop. Your AI teammates take projects from
              start to end, keep context on how you work and get smarter over time, and come back when your approval is needed.
            </p>
          </div>
          <div className="mascot-big" aria-hidden="true">
            <FolkAvatar type="ghost" color="white" size={560} interactive />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Handoff() {
  const steps: [FolkId, string][] = [["scout", "Asking Scout…"], ["inbox", "Looping in Inbox…"], ["chief", "Sending to Chief…"], ["dev", "Pinging Dev Crew…"]];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % steps.length), 1700);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="handoff">
      {steps.map(([id, label], n) => {
        const f = FOLKS[id];
        return (
          <div key={id} className={n === i ? "hand on" : "hand"}>
            <FolkAvatar type={f.type} color={f.color} size={34} working={n === i} label={f.name} />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Computers() {
  const opts = [
    ["This computer", "Opt-in control of your own desktop"],
    ["Local VM", "An isolated desktop in Docker or Podman"],
    ["Cloud desktop", "A hosted box, or your own VPS"],
  ] as const;
  const [on, setOn] = useState(1);
  const [takeover, setTakeover] = useState(false);
  return (
    <div className="computers">
      <div className="tabrow">
        {opts.map(([name], n) => (
          <button key={name} className={n === on ? "on" : ""} onClick={() => { setOn(n); setTakeover(false); }}>{name}</button>
        ))}
      </div>
      <div className="screen">
        <div className="screen-top">{opts[on]![1]}</div>
        <div className="screen-body">
          <div className="task">Sign in to Zendesk so I can work the support queue.</div>
          <div className="status"><i className={takeover ? "" : "pulse"} />{takeover ? "You're in control" : "Working"}</div>
        </div>
        <button className="btn dark sm" onClick={() => setTakeover((v) => !v)}>{takeover ? "Hand back to folk" : "Take over"}</button>
      </div>
    </div>
  );
}

function Routine() {
  const [state, setState] = useState<"idle" | "watching" | "saved">("idle");
  useEffect(() => {
    if (state !== "watching") return;
    const t = setTimeout(() => setState("saved"), 2600);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <div className="routine">
      <div className="rec-card">
        <FolkAvatar type="hexagon" color="orange" size={40} working={state === "watching"} sleeping={state === "idle"} label="Reporting folk" />
        <div>
          <b>Weekly Reporting</b>
          <small>
            {state === "idle" && "Waiting to be shown"}
            {state === "watching" && "is watching and learning · 0:04"}
            {state === "saved" && "Saved as a routine · runs every weekday"}
          </small>
        </div>
      </div>
      <button className="btn light sm" onClick={() => setState(state === "idle" ? "watching" : "idle")} disabled={state === "watching"}>
        {state === "saved" ? "Reset" : state === "watching" ? "Learning…" : "Teach a task"}
      </button>
    </div>
  );
}

function Memory() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="memory">
      <div className="bubble folk">Acme replied on pricing, same thread as last quarter. I already had the context, so I answered without waiting on you.</div>
      <button className={saved ? "note saved" : "note"} onClick={() => setSaved(true)}>
        <b>{saved ? "Memory updated" : "Noted for next time:"}</b> they only sign annual, and Dana is the one who approves.
      </button>
      <small>{saved ? "Updated memory for Inbox" : "Click the note to save it"}</small>
    </div>
  );
}

export function Features() {
  return (
    <section className="block">
      <Reveal>
        <h2 className="center">Work with many folks at once</h2>
        <p className="center sub">
          Create a folk, give it a task, and add another when the work grows: one on a project, one on outbound,
          one on systems. They work in parallel, collaborate where it makes sense, and keep going in the background.
        </p>
      </Reveal>
      <div className="grid2">
        <Reveal className="feat"><div className="vis"><Computers /></div><h3>OpenFolks works where you work</h3><p>Give each folk a computer: yours, an isolated Local VM, or a cloud desktop. Watch it work, and take over any time.</p></Reveal>
        <Reveal className="feat"><div className="vis"><Routine /></div><h3>Show a folk how it's done</h3><p>Run a workflow once while a folk watches. It saves it as a routine and runs it by itself next time.</p></Reveal>
        <Reveal className="feat"><div className="vis"><Memory /></div><h3>Folks get smarter over time</h3><p>Folks keep readable, editable memory. Tell one how you like things once and it remembers.</p></Reveal>
        <Reveal className="feat"><div className="vis"><Handoff /></div><h3>Connect the folks</h3><p>Put a few folks in the same thread and they pass work between themselves, so you watch instead of approving every step.</p></Reveal>
      </div>
    </section>
  );
}

interface CrewJson { team: { name: string; description: string; members: { key: string; name: string; title: string; description: string; appearance?: { color?: string } }[] } }
const crewFiles = import.meta.glob("../../../crews/*/crew.openfolks.json", { eager: true, import: "default" }) as Record<string, CrewJson>;
const CREWS = Object.values(crewFiles).map((c) => c.team);

export function Jobs() {
  const [i, setI] = useState(0);
  const crew = CREWS[i];
  if (!crew) return null;
  return (
    <section className="block" id="jobs">
      <Reveal>
        <h2 className="center">Give each folk a job</h2>
        <p className="center sub">Install a ready-made crew from the Marketplace, point it at a folder, and everyone shares the same workspace.</p>
      </Reveal>
      <Reveal className="jobs">
        <ul className="job-tabs" role="tablist" aria-label="Crews">
          {CREWS.map((c, n) => (
            <li key={c.name}><button role="tab" aria-selected={n === i} className={n === i ? "on" : ""} onClick={() => setI(n)}>{c.name}</button></li>
          ))}
        </ul>
        <div className="job-panel" key={crew.name}>
          <p className="job-desc">{crew.description}</p>
          <div className="members">
            {crew.members.map((m) => {
              const color = (m.appearance?.color && m.appearance.color in COLORS ? m.appearance.color : "blue") as ColorName;
              return (
                <div className="member" key={m.key}>
                  <FolkAvatar type={SHAPE_BY_COLOR[color] ?? "clover"} color={color} size={54} interactive label={m.name} />
                  <b>{m.name}</b>
                  <em>{m.title}</em>
                  <small>{m.description}</small>
                </div>
              );
            })}
          </div>
          <p className="hint">Install from <b>Marketplace → {crew.name}</b> in the app.</p>
        </div>
      </Reveal>
    </section>
  );
}

export function Local() {
  return (
    <section className="band">
      <Reveal>
        <h2 className="center">Free. Open source. On your machine.</h2>
        <div className="grid3">
          <div className="tile"><h3>Local-first</h3><p>Your conversations, keys and files stay on your computer unless you send them out through an engine or a connected app.</p></div>
          <div className="tile"><h3>Bring your engines</h3><p>Folks run the agent CLIs you already use, like Claude and Codex, through one consistent event stream.</p></div>
          <div className="tile"><h3>MIT licensed</h3><p>Read it, fork it, fix it. No account to use the Desk and no lock-in on your folks.</p></div>
        </div>
      </Reveal>
    </section>
  );
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="code">
      <code>{text}</code>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ } }}>{done ? "Copied" : "Copy"}</button>
    </div>
  );
}

export function DownloadSection() {
  const os = useOs();
  const cta = primaryFor(os);
  const [more, setMore] = useState(false);
  return (
    <section className="block" id="download">
      <Reveal>
        <h2 className="center">Download OpenFolks</h2>
        <p className="center sub">One team, right on your desktop.</p>
        <div className="dl-main">
          <FolkAvatar type="ghost" color="white" size={72} interactive label="OpenFolks mascot" />
          <div className="dl-os">{os === "mac" ? "macOS" : os === "linux" ? "Linux" : "Windows"}</div>
          <small>{os === "mac" ? "Apple silicon and Intel" : os === "linux" ? "Ubuntu 24.04 (x64)" : "Windows 10 and 11 (x64)"}</small>
          <a className="btn light lg" href={cta.href}>{cta.label}</a>
          <button className="linkish" onClick={() => setMore((v) => !v)} aria-expanded={more}>More downloads ▾</button>
          {more && (
            <ul className="dl-list">
              {DOWNLOADS.map((d) => (
                <li key={d.href}><a href={d.href}><b>{d.label}</b><small>{d.sub}</small></a></li>
              ))}
              <li><a href={RELEASES} rel="noopener"><b>All releases &amp; SHA256SUMS</b><small>Verify what you download</small></a></li>
            </ul>
          )}
        </div>
        <details className="unsigned">
          <summary>First launch: your OS will ask you to confirm</summary>
          <p>OpenFolks is free and open source, so the installers aren't signed with a paid Apple or Microsoft certificate. You confirm once:</p>
          <div className="steps">
            <div><b>Windows</b><p>SmartScreen → <em>More info</em> → <em>Run anyway</em>.</p></div>
            <div><b>macOS</b><p>Drag to Applications, then run this once (or right-click → Open):</p><Copy text="xattr -cr /Applications/OpenFolks.app" /></div>
            <div><b>Linux</b><p>The .deb is the easiest route:</p><Copy text="sudo apt install ./OpenFolks-amd64.deb" /></div>
          </div>
        </details>
      </Reveal>
    </section>
  );
}

const GUIDES = [
  ["Install and first run", "Put OpenFolks on your machine and meet your first folk.", "getting-started/installation.mdx"],
  ["Computers and Local VM", "Choose where each folk works, and take over live.", "computers/index.mdx"],
  ["Connected apps", "Let folks use your services through Composio and MCP.", "connected-apps/index.mdx"],
  ["What the Desk can do", "Routines, rooms, memory, voice and more.", "features/index.mdx"],
] as const;

export function Guides() {
  return (
    <section className="block">
      <Reveal>
        <h2 className="center">OpenFolks guides</h2>
        <p className="center sub">How to run your team of folks day to day.</p>
        <div className="grid4">
          {GUIDES.map(([t, d, p]) => (
            <a className="guide" key={t} href={`${REPO}/blob/main/apps/docs/content/docs/${p}`} rel="noopener"><b>{t}</b><small>{d}</small><span>Read ↗</span></a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

const FAQS = [
  ["How is OpenFolks different from AI assistants?", "Folks have their own role, memory and computer, so they can work inside your apps and tools. They run in parallel and can be put on routines, so you hand work off instead of re-prompting."],
  ["Is OpenFolks really free?", "Yes. OpenFolks is MIT-licensed. You bring the engines or API access you already have, and those providers bill their own usage."],
  ["Where does my data live?", "On your machine, in ~/.openfolks (override with OPENFOLKS_DATA_DIR). Content only leaves when you send it through an engine or a connected app."],
  ["Can a folk control my computer?", "Only if you opt in, on supported hosts. You can instead run folks on an isolated Local VM or a cloud desktop."],
  ["Why does my OS warn me when I install it?", "The installers aren't signed with a paid certificate, which is a trade-off of shipping free open-source software. The steps in the download section clear it in seconds."],
  ["Which platforms are supported?", "Windows 10/11 (x64), macOS (Apple silicon and Intel) and Ubuntu 24.04 (x64). There is no mobile app."],
] as const;

export function Faq() {
  return (
    <section className="block narrow" id="faq">
      <Reveal>
        <h2 className="center">FAQs</h2>
        <div className="faq">
          {FAQS.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function Final() {
  const os = useOs();
  const cta = primaryFor(os);
  return (
    <section className="final">
      <Reveal>
        <FolkAvatar type="ghost" color="white" size={96} interactive label="OpenFolks mascot" />
        <h2>Meet your first folk</h2>
        <p>An AI teammate you can trust to get work done.</p>
        <div className="cta">
          <a className="btn light lg" href={cta.href}>{cta.label}</a>
          <a className="btn dark lg" href={REPO} rel="noopener">View the source</a>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <a className="brand" href="#top"><img src="./logo.png" alt="" width={22} height={22} />OpenFolks</a>
      <nav aria-label="Footer">
        <a href={REPO} rel="noopener">GitHub</a>
        <a href={`${REPO}/releases`} rel="noopener">Releases</a>
        <a href={`${REPO}/blob/main/LICENSE`} rel="noopener">MIT License</a>
        <a href={`${REPO}/blob/main/CODE_OF_CONDUCT.md`} rel="noopener">Code of Conduct</a>
      </nav>
      <small>© OpenFolks contributors. Free and open source.</small>
    </footer>
  );
}
