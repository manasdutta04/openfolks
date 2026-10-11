import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Crew {
  name: string;
  description: string;
  members: { key: string; name: string; title: string; description: string; color?: string }[];
}

/** Reads the shipped crew packs at build time so the site never drifts from them. */
export function loadCrews(): Crew[] {
  const dir = join(process.cwd(), '..', '..', 'crews');
  const out: Crew[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const json = JSON.parse(readFileSync(join(dir, entry.name, 'crew.openfolks.json'), 'utf8'));
      const t = json.team;
      out.push({
        name: t.name,
        description: t.description,
        members: t.members.map((m: { key: string; name: string; title: string; description: string; appearance?: { color?: string } }) => ({
          key: m.key,
          name: m.name,
          title: m.title,
          description: m.description,
          color: m.appearance?.color,
        })),
      });
    } catch {
      /* a malformed pack must not break the site build */
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
