import { existsSync, readFileSync, cpSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const OPENFOLKS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../packages/folks-kit");
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const JOB_SEARCH_TEAM_ROOT = join(REPO_ROOT, "crews/job-search");
export const TEMPLATE_ROOT = join(OPENFOLKS_ROOT, "template");
export const PLAYBOOKS_ROOT = join(OPENFOLKS_ROOT, "playbooks");

export function loadPlaybookText(name: string): string {
  const path = join(PLAYBOOKS_ROOT, `${name}.md`);
  if (!existsSync(path)) throw new Error(`Missing playbook: ${path}`);
  return normalizePlaybookPaths(readFileSync(path, "utf8"));
}

export function normalizePlaybookPaths(text: string): string {
  return text
    .replace(/\.claude\/skills\/job-application-assistant\//g, "profile/")
    .replace(/\.agents\/skills\//g, "portals/")
    .replace(/Use the \*\*Agent tool\*\* to spawn a `general-purpose` reviewer agent\./g,
      "**Switch to reviewer mode** in this same conversation (fresh reasoning pass — do not assume drafter conclusions).")
    .replace(/\/apply\b/g, "apply workflow")
    .replace(/\/rank\b/g, "rank workflow")
    .replace(/\/scrape\b/g, "scrape workflow")
    .replace(/\/outcome\b/g, "outcome workflow")
    .replace(/\/interview\b/g, "interview workflow")
    .replace(/\/setup\b/g, "profile setup");
}

export function composePlaybook(...parts: string[]): string {
  const preamble = loadPlaybookText("security-preamble");
  return [preamble, ...parts.map((part) => part.trim())].filter(Boolean).join("\n\n---\n\n");
}

function copyRecursive(src: string, dest: string) {
  if (!existsSync(src)) return;
  const stat = statSync(src);
  if (stat.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(src)) {
      copyRecursive(join(src, name), join(dest, name));
    }
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

/** Scaffold an empty or partial folder with the OpenFolks job-search template. */
export function scaffoldProjectFolder(projectFolder: string) {
  mkdirSync(projectFolder, { recursive: true });
  for (const name of readdirSync(TEMPLATE_ROOT)) {
    if (name === ".gitignore") continue;
    const src = join(TEMPLATE_ROOT, name);
    const dest = join(projectFolder, name);
    if (existsSync(dest)) continue;
    copyRecursive(src, dest);
  }
}

export function defaultProjectFolder(): string {
  return join(homedir(), "OpenFolks", "job-search");
}
