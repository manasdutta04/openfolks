import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { REPO } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What the OpenFolks app and this website store, send and collect.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy"
      intro="OpenFolks stores your work on your own computer. This page lists what the app sends to other services, why, and how to turn it off."
      updated="11 October 2026"
    >
      <h2>Summary</h2>
      <ul>
        <li>Conversations, folk settings, memory and files are stored on your computer.</li>
        <li>The app sends anonymous usage events by default. You can turn them off in Settings, General.</li>
        <li>Your messages go to the model provider you choose, because that is how a folk produces an answer.</li>
        <li>This website does not use cookies, advertising or analytics.</li>
      </ul>

      <h2>What stays on your computer</h2>
      <p>
        OpenFolks keeps its data in <code>~/.openfolks</code>. You can move it with the{' '}
        <code>OPENFOLKS_DATA_DIR</code> environment variable. This includes conversations, folk profiles and instructions,
        memory, attachments, routines, and settings. API keys entered in the packaged app are stored with the
        operating system&rsquo;s secure storage where the system provides it, and are not shown back in the interface.
      </p>

      <h2>What the app sends</h2>

      <h3>Usage events</h3>
      <p>
        The app sends a small set of named events to PostHog (United States, <code>us.i.posthog.com</code>) so the
        maintainers can see whether features are used. Events are:{' '}
        <code>app_first_open</code>, <code>app_opened</code>, <code>onboarding_step</code>,{' '}
        <code>onboarding_completed</code>, <code>bot_created</code>, <code>message_sent</code>,{' '}
        <code>room_created</code>, <code>room_members_changed</code>, <code>team_imported</code>,{' '}
        <code>team_exported</code>, <code>team_scouted</code> and <code>directory_bot_added</code>.
      </p>
      <p>
        Events carry counts and labels such as the platform, the number of members in a room, whether a message was
        queued, and the model instance used. They do not carry message text, file contents, folk names or instructions.
        Automatic capture of clicks and page views is switched off. The client keeps a random identifier in local storage.
        The service that receives a request can see the network address it came from.
      </p>
      <p>
        <b>To turn this off:</b> open Settings, then General, and switch off analytics. When it is off the analytics
        client is not started and no request is made. The setting is remembered between launches.
      </p>

      <h3>Model providers</h3>
      <p>
        A folk answers through an engine you set up, such as Claude, Codex or a local model. The text of your
        conversation, and any files or tool results the folk includes, are sent to that provider under its own terms
        and privacy policy. OpenFolks does not sit in the middle of that traffic. Choose a local model if the content
        must not leave your machine.
      </p>

      <h3>Connected apps</h3>
      <p>
        If you connect a service such as Gmail or GitHub, the official desktop build registers an installation with a
        managed connected-apps service built on Composio. Sign-in happens at the service provider. Provider tokens are
        held by Composio and are not written into folk instructions or shown in the interface. When a folk uses a
        connected app, the request and the data it returns pass through that service. Disconnecting an account revokes
        the grant at the provider.
      </p>

      <h3>Updates</h3>
      <p>
        The desktop app checks the project&rsquo;s GitHub releases for new versions, which sends a request to GitHub.
        GitHub&rsquo;s privacy policy applies to that request.
      </p>

      <h3>Optional services</h3>
      <ul>
        <li>
          <b>Spoken replies.</b> If you add an ElevenLabs key, the text of replies you ask to hear is sent to ElevenLabs.
        </li>
        <li>
          <b>OpenFolks account.</b> If you create an account for cloud features, the service stores your email address
          for sign-in codes, along with metadata for the installations you register. It does not store folks,
          conversations or the contents of your local data.
        </li>
        <li>
          <b>Remote access.</b> If you turn on a companion tunnel, requests are carried by Cloudflare to your own
          machine.
        </li>
      </ul>

      <h2>This website</h2>
      <p>
        The website sets no cookies and loads no analytics, advertising or third-party scripts. Fonts are served from
        this site. Like any web server, the host keeps ordinary access logs, which include network addresses, for
        security and reliability. Download links go to GitHub, which has its own privacy policy.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Turn off usage events in Settings, General.</li>
        <li>Delete your data by removing the <code>~/.openfolks</code> folder (or the folder you set).</li>
        <li>Remove connected apps from Connections, or revoke access from the provider&rsquo;s own settings.</li>
        <li>Request deletion of an OpenFolks account by opening an issue in the project repository.</li>
      </ul>

      <h2>Children</h2>
      <p>OpenFolks is a tool for adults and is not directed at children.</p>

      <h2>Changes to this page</h2>
      <p>
        When the app&rsquo;s data practices change, this page changes in the same release. Earlier versions are in the{' '}
        <a href={`${REPO}/commits/main/apps/docs/app/(site)/privacy/page.tsx`} rel="noopener">repository history</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy can be raised as an issue at{' '}
        <a href={`${REPO}/issues`} rel="noopener">github.com/manasdutta04/openfolks/issues</a>. For security reports use
        the process on the <Link href="/security">security page</Link>.
      </p>
    </PageShell>
  );
}
