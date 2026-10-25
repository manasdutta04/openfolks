import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { CopyCode } from '@/components/site/CopyCode';
import { CrewTabs } from '@/components/site/CrewTabs';
import { DeskDemo } from '@/components/site/DeskDemo';
import { Computers, Handoff, Memory, Routine } from '@/components/site/FeatureVisuals';
import { Mascot } from '@/components/site/Mascot';
import { OsButton } from '@/components/site/OsButton';
import { Reveal } from '@/components/site/Reveal';
import { loadCrews } from '@/lib/crews';
import { appVersion } from '@/lib/version';
import { REPO, RELEASES } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'OpenFolks: a desktop app for a team of AI agents' },
  description:
    'OpenFolks is a free, open-source desktop app. Create folks, give each one a model, a folder and a computer, and run the team from one window.',
  alternates: { canonical: '/' },
};

const FAQ = [
  ['How is this different from a chat assistant?', 'A folk has a role, notes it keeps between tasks, and a computer to work on. It can use tools, run alongside other folks, and be scheduled, so you hand off a job instead of pasting prompts one at a time.'],
  ['What does it cost?', 'OpenFolks is free under the MIT License. You use your own model access, such as a Claude or Codex subscription or an API key, and those providers charge for their own usage.'],
  ['Where is my data stored?', 'On your computer, in ~/.openfolks. You can change the location with OPENFOLKS_DATA_DIR. Content leaves the machine only when you send it to a model provider or a connected app. The privacy page lists everything the app sends.'],
  ['Can a folk control my computer?', 'Only if you turn it on, for the folks you choose, on supported systems. Folks can instead work in an isolated Local VM or on a cloud computer.'],
  ['Why does my system warn me when I install it?', 'The installers are not signed with a paid Apple or Microsoft certificate. The download page explains the one-time steps for each system and how to check the file.'],
  ['Which systems are supported?', 'Windows 10 and 11 (x64), macOS on Apple silicon and Intel, and Ubuntu 24.04 (x64). There is no mobile app.'],
] as const;

export default function HomePage() {
  const crews = loadCrews();
  const version = appVersion();
  return (
    <>
      <Script src="https://sponsoranysite.com/embed.js" data-site="Eu1fMcBFpUOH" strategy="afterInteractive" />
      <section className="hero">
        <Link className="pill" href="/changelog">
          <i className="dot" /> {version ? `Version ${version}` : 'New release'} is out <span>Read the changelog</span>
        </Link>
        <h1>
          Meet <Mascot size={92} label="OpenFolks mascot" /> OpenFolks
        </h1>
        <p className="lede">
          A desktop app for working with a team of AI agents. Create folks, give each one a model, a folder and a
          computer, then assign work and review the results in one window.
        </p>
        <div className="cta">
          <OsButton />
          <Link className="btn dark lg" href="/download">More downloads</Link>
        </div>
        <p className="fine">Free and open source under the MIT License. Windows, macOS and Linux.</p>
        <Reveal className="desk-wrap"><DeskDemo /></Reveal>
      </section>

      <section className="block wide">
        <Reveal>
          <div className="big-card">
            <div className="copy">
              <h2>Message folks like teammates</h2>
              <p>
                Write a task the way you would to a colleague. The folk works on it, shows what it is doing, and comes
                back when it needs your approval or has finished.
              </p>
              <Link className="textlink" href="/features/folks">How folks work</Link>
            </div>
            <div className="mascot-big" aria-hidden="true"><Mascot size={560} label="" /></div>
          </div>
        </Reveal>
      </section>

      <section className="block">
        <Reveal>
          <h2 className="center">Work with several folks at once</h2>
          <p className="sub">
            Add a folk for each job: one for a project, one for outreach, one for infrastructure. They run at the same
            time and you see each folk&rsquo;s progress in the sidebar.
          </p>
        </Reveal>
        <div className="grid2">
          <Reveal className="feat">
            <div className="vis"><Computers /></div>
            <h3>Choose where each folk works</h3>
            <p>Use your own computer, an isolated virtual machine, or a cloud computer. You can watch a folk work and take over at any point.</p>
            <Link className="textlink" href="/features/computers">Computers</Link>
          </Reveal>
          <Reveal className="feat">
            <div className="vis"><Routine /></div>
            <h3>Run work on a schedule</h3>
            <p>Set a task to run once, on weekdays, or when a webhook arrives. Each run keeps a receipt so you can see what happened.</p>
            <Link className="textlink" href="/features/routines">Routines</Link>
          </Reveal>
          <Reveal className="feat">
            <div className="vis"><Memory /></div>
            <h3>Folks keep notes</h3>
            <p>A folk saves what it learns about how you work. The notes are plain text that you can read, edit or delete.</p>
            <Link className="textlink" href="/features/memory">Memory</Link>
          </Reveal>
          <Reveal className="feat">
            <div className="vis"><Handoff /></div>
            <h3>Folks can hand work to each other</h3>
            <p>Put several folks in one room and they pass tasks between themselves. You can follow the thread and step in.</p>
            <Link className="textlink" href="/features/folks">Rooms and handoffs</Link>
          </Reveal>
        </div>
      </section>

      <section className="block" id="crews">
        <Reveal>
          <h2 className="center">Start from a crew</h2>
          <p className="sub">A crew is a small team that is ready to use. Install one from the Marketplace, point it at a folder, and every member shares that workspace.</p>
        </Reveal>
        <Reveal className="crews-wrap"><CrewTabs crews={crews} /></Reveal>
      </section>

      <section className="band">
        <Reveal>
          <h2 className="center">Your data stays on your machine</h2>
          <div className="grid3">
            <div className="tile"><h3>Local first</h3><p>Conversations, settings and files are stored on your computer. The app does not need an account to run.</p></div>
            <div className="tile"><h3>Your model access</h3><p>Folks run the agent tools you already use, such as Claude and Codex, with your own sign-in or API key.</p></div>
            <div className="tile"><h3>Open source</h3><p>The code is under the MIT License. You can read it, build it yourself, and report problems in public.</p></div>
          </div>
          <p className="sub">
            Read the <Link className="inline" href="/privacy">privacy policy</Link> and the{' '}
            <Link className="inline" href="/security">security overview</Link>.
          </p>
        </Reveal>
      </section>

      <section className="block" id="download">
        <Reveal>
          <h2 className="center">Download OpenFolks</h2>
          <p className="sub">Installers for Windows, macOS and Ubuntu. Each release lists checksums so you can verify the file.</p>
          <div className="dl-main">
            <Mascot size={72} label="OpenFolks mascot" />
            <div className="cta"><OsButton /></div>
            <Link className="linkish" href="/download">All downloads and install steps</Link>
          </div>
          <div className="unsigned">
            <p><b>First launch.</b> The installers are not signed with a paid certificate, so your system asks you to confirm once.</p>
            <div className="steps">
              <div><b>Windows</b><p>SmartScreen: choose More info, then Run anyway.</p></div>
              <div><b>macOS</b><p>After copying to Applications, run once:</p><CopyCode text="xattr -cr /Applications/OpenFolks.app" /></div>
              <div><b>Linux</b><p>Install the .deb package:</p><CopyCode text="sudo apt install ./OpenFolks-amd64.deb" /></div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="block narrow" id="faq">
        <Reveal>
          <h2 className="center">Questions</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="final">
        <Reveal>
          <Mascot size={96} label="OpenFolks mascot" />
          <h2>Try it on your own machine</h2>
          <p>Install OpenFolks, create a folk, and give it a first task.</p>
          <div className="cta">
            <OsButton />
            <a className="btn dark lg" href={REPO} rel="noopener">View the source</a>
          </div>
          <p className="fine"><a className="inline" href={RELEASES} rel="noopener">Release notes and checksums</a></p>
        </Reveal>
      </section>
    </>
  );
}
