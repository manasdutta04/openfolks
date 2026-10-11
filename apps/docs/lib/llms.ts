import { FEATURES } from '@/lib/features';
import { REPO, SITE_URL } from '@/lib/site';

/**
 * Plain-text description of OpenFolks for search engines and language models.
 * Every statement is taken from the documentation or the code; keep it that way.
 */
export function llmsOverview(): string {
  const u = (p: string) => `${SITE_URL}${p}`;
  return `# OpenFolks

> OpenFolks is a free, open-source desktop app for working with a team of AI agents ("folks"). Each folk has its own model, instructions, working folder, notes and computer. You assign work in a chat window, review what the folk did, and approve risky actions. Conversations and files are stored on your own computer. MIT License. Windows, macOS and Ubuntu.

Key facts:
- What it is: a desktop workplace for AI agents. A folk is a long-lived teammate; a task is one conversation with a folk; a room puts several folks in one conversation; a crew is a ready-made team installed from the Marketplace (Dev Crew, Job Search, Sales Pipeline, Research Desk, Content Studio).
- Engines: folks run through agent tools you set up yourself, such as Claude and Codex, or a local model. OpenFolks is not a model provider and does not proxy that traffic.
- Computers: each folk can work with no computer, on your own machine (explicit opt-in, per folk), in an isolated Local VM (Docker or Podman), on a hosted cloud computer, or on a server you own over SSH. You can watch live and take over.
- Routines: tasks that run once, on selected weekdays, or from a webhook. They run locally, so the app must be open.
- Memory: plain-text notes per folk that you can read, edit and delete. Stored locally.
- Connected apps: Gmail, GitHub, Slack, Notion and others through Composio; several accounts per service; disconnecting revokes the grant at the provider.
- Approvals: risky actions appear as approval cards in the conversation. "Always allow" is tied to a specific request.
- Data: stored in ~/.openfolks (override with OPENFOLKS_DATA_DIR). The app sends anonymous usage events by default (event names only, no message content; opt out in Settings, General). Content goes to the model provider you choose. The website uses no cookies or analytics.
- Systems: Windows 10 and 11 (x64), macOS (Apple silicon and Intel), Ubuntu 24.04 (x64). There is no mobile app.
- Installers are not signed with an Apple or Microsoft certificate. Each release publishes SHA256SUMS.txt. On macOS run: xattr -cr /Applications/OpenFolks.app. On Windows choose More info, then Run anyway in SmartScreen.
- Limits: host control of your own computer is unavailable on Ubuntu for now; dictation and call mode are macOS only; routines and webhooks stop when the app is closed.

## Pages
- [Home](${u('/')}): overview and an interactive demo of the Desk
- [Features](${u('/features')}): what the app does and where it stops
${FEATURES.map((f) => `- [${f.title}](${u(`/features/${f.slug}`)}): ${f.summary}`).join('\n')}
- [Download](${u('/download')}): installers, requirements, first launch, checksums
- [Security](${u('/security')}): boundaries, approvals, secrets, how to report a vulnerability
- [Privacy](${u('/privacy')}): what stays on your computer and what the app sends
- [Terms](${u('/terms')}): MIT License and terms of use
- [Documentation](${u('/docs')}): guides for installation, folks, computers, connected apps, self-hosting and troubleshooting
- [Changelog](${u('/docs/changelog')}): release history

## Links
- [GitHub](${REPO})
- [Releases and checksums](${REPO}/releases/latest)
- [Report a security issue](${REPO}/security/advisories/new)
- [Full text for LLMs](${u('/llms-full.txt')})

## Documentation index
`;
}

/** Feature pages as plain text, for llms-full.txt. */
export function featuresText(): string {
  return FEATURES.map((f) => {
    const sections = f.sections
      .map((s) => `## ${s.heading}\n\n${[...(s.body ?? []), ...(s.bullets ?? []).map((b) => `- ${b}`)].join('\n\n')}`)
      .join('\n\n');
    return `# ${f.title} (${SITE_URL}/features/${f.slug})\n\n${f.intro}\n\n${sections}\n\n## Limits\n\n${f.limits.map((l) => `- ${l}`).join('\n')}`;
  }).join('\n\n');
}
