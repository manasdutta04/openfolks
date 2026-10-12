/**
 * Feature pages. Each statement here mirrors the documentation under
 * content/docs; when behaviour changes, update the docs first and then this file.
 */
export interface FeatureSection {
  heading: string;
  body?: string[];
  bullets?: string[];
}

export interface FeaturePage {
  slug: string;
  title: string;
  summary: string;
  intro: string;
  sections: FeatureSection[];
  limits: string[];
  docs: { href: string; label: string }[];
}

export const FEATURES: FeaturePage[] = [
  {
    slug: 'folks',
    title: 'Folks, tasks and rooms',
    summary: 'Persistent teammates, separate tasks, and shared rooms.',
    intro:
      'A folk is a long-lived teammate with its own instructions, model, folder, memory, tools and computer. You give it work as tasks, and you can put several folks in a room when a job needs more than one.',
    sections: [
      {
        heading: 'Folks',
        body: [
          'A folk keeps its conversation, model, instructions, working folder, memory, tools and computer between sessions. Create another folk when the role, access or project should be different.',
        ],
        bullets: [
          'A coding folk attached to one repository',
          'A research folk with browser and document tools',
          'An operations folk with Gmail, Calendar and Slack',
          'A folk that uses a local model for private work',
        ],
      },
      {
        heading: 'Tasks',
        body: [
          'A task is one conversation with a folk. It has its own transcript, engine session, approvals, costs and state, so a new task gives you fresh context without creating a new folk.',
          'If you send a message while a folk is busy, it is queued. Engines that support it can also be steered while a turn is running.',
        ],
      },
      {
        heading: 'Rooms and handoffs',
        body: [
          'A room puts several folks and people in one conversation. Each folk keeps its own engine process, and a timeout stops one participant from blocking the others indefinitely.',
          'A folk can hand a bounded subtask to another folk. The delegated run keeps its own activity and reports completion, failure or cancellation back to the parent thread. Give each delegate a narrow outcome, and avoid giving two folks ownership of the same files.',
        ],
      },
      {
        heading: 'Edits and branches',
        body: [
          'Editing an earlier message starts a new path. OpenFolks does not resume a stale engine session after a rewind, so the next turn always follows the branch you can see.',
        ],
      },
    ],
    limits: [
      'Each folk runs through an engine you set up yourself, such as Claude or Codex. Its capabilities depend on that engine.',
      'Steering a running turn works only on engines that support it.',
      'Conversations between two folks are read-only for you. You can read them, but to give instructions you open a folk’s own chat.',
    ],
    docs: [
      { href: '/docs/features/bots-and-tasks', label: 'Folks and work' },
      { href: '/docs/features/chat-and-teams', label: 'Chat, tasks, rooms' },
      { href: '/docs/features/approvals-and-inspector', label: 'Approvals and Backstage' },
    ],
  },
  {
    slug: 'computers',
    title: 'Computers',
    summary: 'Choose where each folk does its work.',
    intro:
      'A folk can work with no computer, on the machine that runs OpenFolks, or inside an isolated desktop. The choice is made per folk and can be changed without changing the model.',
    sections: [
      {
        heading: 'Where a folk can work',
        bullets: [
          'This computer: no isolation. For local apps and files you explicitly approve.',
          'Local VM: a containerised desktop on your machine, through Docker or Podman.',
          'Box cloud computer: a hosted remote desktop that stays on.',
          'Self-hosted server: a hardened container reached over SSH, on infrastructure you own.',
        ],
      },
      {
        heading: 'Preview and takeover',
        body: [
          'The Computer panel shows live frames while a folk works. Supported cloud desktops also offer an interactive viewer so you can take over. Starting a preview does not give OpenFolks control of your machine.',
        ],
      },
      {
        heading: 'Control of your own computer',
        body: [
          'Letting a folk use your own mouse and keyboard is a separate opt-in, chosen per folk, and it stays inside the computer-use safety boundary. On macOS the system also asks for Screen Recording and Accessibility permission.',
        ],
      },
    ],
    limits: [
      'Host control is available on supported systems only. On Ubuntu it is currently switched off while an input-safety check is in place.',
      'Local VMs need Docker or Podman installed.',
    ],
    docs: [
      { href: '/docs/computers', label: 'Give a folk a computer' },
      { href: '/docs/computers/local-vm', label: 'Local VM' },
      { href: '/docs/computers/cloud-and-vps', label: 'Cloud and VPS' },
      { href: '/docs/computers/local-computer', label: 'This computer' },
    ],
  },
  {
    slug: 'routines',
    title: 'Routines and webhooks',
    summary: 'Start a task on a schedule or when an event arrives.',
    intro:
      'A routine starts a fresh task once or on selected weekdays. A webhook starts the same kind of task when another system sends an HTTP request.',
    sections: [
      {
        heading: 'Routines',
        body: [
          'Each run starts a new task using that folk’s model, permissions, tools and computer. Run receipts record whether the work was queued, active, waiting, completed, missed, failed or cancelled.',
        ],
      },
      {
        heading: 'Webhooks',
        body: [
          'Webhooks use a dedicated receiver on 127.0.0.1:8800 by default. It exposes a health route and secret hook routes only, not the rest of the OpenFolks API. Bearer authentication is preferred because the secret stays out of URLs and most access logs.',
          'To accept events from the internet, proxy only the webhook receiver through a narrow relay or tunnel. Do not expose the main application port.',
        ],
      },
    ],
    limits: [
      'Routines and webhooks run locally. OpenFolks must be running when a routine falls due, and closing the app stops the receiver.',
    ],
    docs: [{ href: '/docs/features/automation', label: 'Routines and webhooks' }],
  },
  {
    slug: 'memory',
    title: 'Memory and voice',
    summary: 'Notes you can read, and spoken replies.',
    intro:
      'Each folk can keep plain-text memory. You can read it, correct it or delete it. It is stored with your other OpenFolks data and is not a hidden profile held elsewhere.',
    sections: [
      {
        heading: 'Memory',
        body: ['Memory is stored in your local OpenFolks data directory. It is readable and editable in the app, so you can review what a folk has saved and correct it.'],
      },
      {
        heading: 'Spoken replies',
        body: [
          'Add an ElevenLabs key in Settings, choose a voice, and use the speaker control on a reply. Auto-speak can read new replies as they arrive. The key stays in the application process and is not exposed to the interface.',
        ],
      },
      {
        heading: 'Call mode and dictation',
        body: [
          'On macOS, call mode combines on-device speech recognition with your ElevenLabs voice. It is half-duplex: the microphone pauses while the folk speaks. The composer microphone also uses Apple’s local speech recognition in the macOS build.',
        ],
      },
    ],
    limits: [
      'Spoken replies need an ElevenLabs account, which has its own terms and charges.',
      'Dictation and call mode are not available on Windows or Linux.',
    ],
    docs: [{ href: '/docs/features/voice-and-memory', label: 'Voice and memory' }],
  },
  {
    slug: 'connected-apps',
    title: 'Connected apps',
    summary: 'Give folks access to the services you already use.',
    intro:
      'Connect Gmail, GitHub, Slack, Notion and many other services from the Connections page. OpenFolks turns each connection into tools that supported engines can use.',
    sections: [
      {
        heading: 'How it works',
        bullets: [
          'Open Connections and search for a service.',
          'Select Connect and finish authorization in your browser.',
          'Ask a folk to use the service.',
        ],
      },
      {
        heading: 'Accounts and tokens',
        body: [
          'The official desktop build registers its installation with a managed connected-apps service built on Composio, so you do not need your own key. The installation identity is kept in your operating system’s secure storage, and provider tokens stay with Composio rather than in briefs or the interface.',
          'You can connect several accounts to one service and give each an alias such as work or personal. When more than one account could do a job, OpenFolks asks which to use.',
          'Disconnecting revokes the grant at the provider, not only in the local list.',
        ],
      },
      {
        heading: 'Your own tools',
        body: ['Folks can also use tools you attach through MCP, and a source build can use your own Composio project.'],
      },
    ],
    limits: [
      'Actions in a connected service are performed with the permissions of the account you connect. Connect accounts with only the access a folk needs.',
    ],
    docs: [
      { href: '/docs/connected-apps', label: 'Connected apps' },
      { href: '/docs/connected-apps/multiple-accounts', label: 'Several accounts' },
      { href: '/docs/connected-apps/self-hosted-composio', label: 'Self-hosted Composio' },
    ],
  },
  {
    slug: 'approvals',
    title: 'Approvals and oversight',
    summary: 'See what a folk is doing and decide what it may do.',
    intro:
      'OpenFolks turns structured engine events into cards in the conversation. Questions, permission requests, tool activity and failures appear on the task that produced them.',
    sections: [
      {
        heading: 'Approval cards',
        body: [
          'When an engine supports approvals, the request appears in the thread. Read the action and its scope before you allow it. Denying hands control back so the folk can choose a safer path. “Always allow” is tied to a specific request and does not grant general execution.',
        ],
      },
      {
        heading: 'Backstage',
        body: ['Backstage shows the live record of a turn: tool calls, requests, errors and the engine protocol recorded for the thread.'],
      },
      {
        heading: 'Failed runs',
        body: ['OpenFolks retries transient stream failures. If retries end in an authentication or configuration error, the fix is in the engine setup.'],
      },
    ],
    limits: ['Approvals depend on what the engine reports. Some engines run actions without asking.'],
    docs: [
      { href: '/docs/features/approvals-and-inspector', label: 'Approvals and Backstage' },
      { href: '/docs/security', label: 'Security model' },
    ],
  },
];

export const FEATURE_BY_SLUG = Object.fromEntries(FEATURES.map((f) => [f.slug, f]));
