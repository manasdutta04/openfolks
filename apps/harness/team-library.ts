import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseJson, type JsonValue } from "./schema.ts";
import { isBotPackage, parseBotPackage, type ParsedBotPackage } from "./bot-package.ts";
import { parseTeamManifest, type ParsedTeamManifest } from "./team-manifest.ts";
import {
  JOB_SEARCH_PLAYBOOK_KEYS,
  loadOpenFolksPackageDocument,
} from "./openfolks/load-package.ts";

export const BUNDLED_TEAM_SLUG = "job-search";

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

type BundledManifestTeam = {
  slug: string;
  category: string;
  outcome: string;
  setupMinutes: number;
  featured?: boolean;
};

/** Lightweight crews shipped in the app (JSON manifests). Job Search stays a BotMRR package. */
const BUNDLED_MANIFEST_TEAMS: BundledManifestTeam[] = [
  {
    slug: "content-studio",
    category: "Marketing",
    outcome: "Research, draft, and polish content without auto-publishing.",
    setupMinutes: 5,
    featured: true,
  },
  {
    slug: "dev-crew",
    category: "Engineering",
    outcome: "Plan, implement, and review software changes as a crew.",
    setupMinutes: 5,
    featured: true,
  },
  {
    slug: "sales-pipeline",
    category: "Sales",
    outcome: "Research accounts and draft outreach with a human send gate.",
    setupMinutes: 5,
  },
  {
    slug: "research-desk",
    category: "Strategy",
    outcome: "Investigate a question and leave a decision-ready brief.",
    setupMinutes: 5,
  },
];

export const TEAM_LIBRARY_REPOSITORY = "http://github.com/manasdutta04/openfolks";
export const TEAM_LIBRARY_RAW_ROOT = "https://raw.githubusercontent.com/manasdutta04/openfolks/main";
export const TEAM_LIBRARY_CATALOG_URL = `${TEAM_LIBRARY_RAW_ROOT}/catalog.json`;

const JOB_SEARCH_SKILL_PREFIX = "crews/job-search/skills/";

const MAX_CATALOG_BYTES = 256_000;
const MAX_MANIFEST_BYTES = 1_000_000;

const CATALOG_FORMATS = new Set(["openmaus.catalog", "openfolks.catalog"]);

export interface TeamCatalogEntry {
  slug: string;
  name: string;
  summary: string;
  category: string;
  outcome?: string;
  setupMinutes?: number;
  featured?: boolean;
  package?: string;
  manifest: string;
  readme: string;
  members: number;
  skills: string[];
  requires: { apps: string[] };
}

export interface TeamCatalog {
  format: "openmaus.catalog" | "openfolks.catalog";
  version: 1;
  repositoryUrl: typeof TEAM_LIBRARY_REPOSITORY;
  teams: TeamCatalogEntry[];
}

type Fetcher = typeof fetch;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

function relativeManifestFile(value: unknown, field: string, prefix: string): string {
  const path = text(value, field, 300);
  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    !path.startsWith(prefix) ||
    !(path.endsWith(".mausteam.json") || path.endsWith(".openfolks.json"))
  ) {
    throw new Error(`${field} is not a safe catalog path`);
  }
  return path;
}

function relativeFile(value: unknown, field: string, suffix: string, prefix: string): string {
  const path = text(value, field, 300);
  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    !path.startsWith(prefix) ||
    !path.endsWith(suffix)
  ) {
    throw new Error(`${field} is not a safe catalog path`);
  }
  return path;
}

function stringList(value: unknown, field: string, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${field} is invalid`);
  return value.map((item, index) => text(item, `${field}[${index}]`, 100));
}

/** Validate the remotely maintained index before any of it reaches the renderer. */
export function parseTeamCatalog(value: unknown): TeamCatalog {
  if (
    !isRecord(value) ||
    typeof value.format !== "string" ||
    !CATALOG_FORMATS.has(value.format) ||
    value.version !== 1
  ) {
    throw new Error("The team library catalog is not supported");
  }
  if (!Array.isArray(value.teams) || value.teams.length > 100) {
    throw new Error("The team library catalog is invalid");
  }
  const format = value.format as TeamCatalog["format"];
  const slugs = new Set<string>();
  const teams = value.teams.map((raw, index): TeamCatalogEntry => {
    const field = `teams[${index}]`;
    if (!isRecord(raw)) throw new Error(`${field} is invalid`);
    const slug = text(raw.slug, `${field}.slug`, 80);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || slugs.has(slug)) {
      throw new Error(`${field}.slug is invalid`);
    }
    slugs.add(slug);
    const prefix = `crews/${slug}/`;
    const requires = isRecord(raw.requires) ? raw.requires : {};
    return {
      slug,
      name: text(raw.name, `${field}.name`, 100),
      summary: text(raw.summary, `${field}.summary`, 300),
      category: text(raw.category, `${field}.category`, 80),
      ...(typeof raw.outcome === "string" ? { outcome: text(raw.outcome, `${field}.outcome`, 300) } : {}),
      ...(typeof raw.setupMinutes === "number" && Number.isSafeInteger(raw.setupMinutes) && raw.setupMinutes > 0 && raw.setupMinutes <= 240
        ? { setupMinutes: raw.setupMinutes }
        : {}),
      ...(typeof raw.featured === "boolean" ? { featured: raw.featured } : {}),
      ...(raw.package !== undefined
        ? { package: relativeFile(raw.package, `${field}.package`, ".md", "packages/") }
        : {}),
      manifest: relativeManifestFile(raw.manifest, `${field}.manifest`, prefix),
      readme: relativeFile(raw.readme, `${field}.readme`, "README.md", prefix),
      members:
        typeof raw.members === "number" && Number.isSafeInteger(raw.members) && raw.members > 0 && raw.members <= 200
          ? raw.members
          : (() => { throw new Error(`${field}.members is invalid`); })(),
      skills: Array.isArray(raw.skills)
        ? raw.skills.map((skill, skillIndex) =>
            relativeFile(skill, `${field}.skills[${skillIndex}]`, "SKILL.md", `${prefix}skills/`),
          )
        : (() => { throw new Error(`${field}.skills is invalid`); })(),
      requires: { apps: stringList(requires.apps ?? [], `${field}.requires.apps`, 30) },
    };
  });
  return {
    format,
    version: 1,
    repositoryUrl: TEAM_LIBRARY_REPOSITORY,
    teams,
  };
}

function jobSearchSkillPaths(): string[] {
  return JOB_SEARCH_PLAYBOOK_KEYS.map((key) => `${JOB_SEARCH_SKILL_PREFIX}${key}/SKILL.md`);
}

/** OpenFolks's bundled Job Search crew — standard catalog package shape. */
export function getBundledCatalogEntry(): TeamCatalogEntry {
  const pkg = loadOpenFolksPackageDocument().package;
  const agentNames = pkg.agents.map((agent) => agent.name).join(", ");
  return {
    slug: BUNDLED_TEAM_SLUG,
    name: "Job Search",
    summary: `${agentNames} — five agents with a shared Job Search channel.`,
    category: "Job Search",
    outcome: "Find roles, tailor applications, track outcomes, and prep for interviews.",
    setupMinutes: pkg.setupMinutes,
    featured: true,
    package: "packages/crews/job-search/catalog.md",
    manifest: "crews/job-search/crew.openfolks.json",
    readme: "crews/job-search/README.md",
    members: pkg.agents.length,
    skills: jobSearchSkillPaths(),
    requires: { apps: [] },
  };
}

function catalogEntryFromManifestTeam(meta: BundledManifestTeam): TeamCatalogEntry {
  const loaded = loadBundledManifestTeam(meta.slug);
  const names = loaded.team.members.map((member) => member.name).join(", ");
  return {
    slug: meta.slug,
    name: loaded.team.name,
    summary: loaded.team.description || `${names} — a ready-made OpenFolks crew.`,
    category: meta.category,
    outcome: meta.outcome,
    setupMinutes: meta.setupMinutes,
    featured: meta.featured,
    manifest: `crews/${meta.slug}/crew.openfolks.json`,
    readme: `crews/${meta.slug}/README.md`,
    members: loaded.team.members.length,
    skills: [],
    requires: { apps: [] },
  };
}

/** Every crew shipped inside the app (Job Search package + JSON templates). */
export function getBundledCatalogEntries(): TeamCatalogEntry[] {
  const entries = [getBundledCatalogEntry()];
  for (const meta of BUNDLED_MANIFEST_TEAMS) {
    try {
      entries.push(catalogEntryFromManifestTeam(meta));
    } catch (error) {
      console.error(`bundled team ${meta.slug} skipped —`, error instanceof Error ? error.message : error);
    }
  }
  return entries;
}

function loadBundledManifestTeam(slug: string): ParsedTeamManifest {
  const dir = join(REPO_ROOT, "crews", slug);
  const openfolks = join(dir, "crew.openfolks.json");
  const legacy = join(dir, "team.mausteam.json");
  const path = existsSync(openfolks) ? openfolks : existsSync(legacy) ? legacy : "";
  if (!path) {
    throw Object.assign(new Error("That library team was not found"), { status: 404 });
  }
  return parseTeamManifest(parseJson(readFileSync(path, "utf8")));
}

export function loadBundledTeamPackage(slug: string): ParsedTeamManifest | ParsedBotPackage {
  if (slug === BUNDLED_TEAM_SLUG) return loadOpenFolksPackageDocument();
  if (BUNDLED_MANIFEST_TEAMS.some((team) => team.slug === slug)) return loadBundledManifestTeam(slug);
  throw Object.assign(new Error("That library team was not found"), { status: 404 });
}

export function isBundledTeamSlug(slug: string): boolean {
  return slug === BUNDLED_TEAM_SLUG || BUNDLED_MANIFEST_TEAMS.some((team) => team.slug === slug);
}

async function fetchJson(url: string, maxBytes: number, fetcher: Fetcher): Promise<JsonValue> {
  const response = await fetcher(url, {
    headers: { accept: "application/json, text/plain;q=0.9" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const error = Object.assign(new Error(`GitHub returned HTTP ${response.status}`), { status: response.status });
    throw error;
  }
  const announced = Number(response.headers.get("content-length") ?? 0);
  if (announced > maxBytes) throw new Error("The remote team file is too large");
  const raw = await response.text();
  if (Buffer.byteLength(raw) > maxBytes) throw new Error("The remote team file is too large");
  try {
    return parseJson(raw);
  } catch {
    throw new Error("GitHub did not return valid JSON");
  }
}

async function fetchText(url: string, maxBytes: number, fetcher: Fetcher): Promise<string> {
  const response = await fetcher(url, {
    headers: { accept: "text/markdown, text/plain;q=0.9" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw Object.assign(new Error(`GitHub returned HTTP ${response.status}`), { status: response.status });
  const announced = Number(response.headers.get("content-length") ?? 0);
  if (announced > maxBytes) throw new Error("The remote team file is too large");
  const raw = await response.text();
  if (Buffer.byteLength(raw) > maxBytes) throw new Error("The remote team file is too large");
  return raw;
}

export async function fetchTeamCatalog(fetcher: Fetcher = fetch): Promise<TeamCatalog> {
  const bundled = getBundledCatalogEntries();
  const bundledSlugs = new Set(bundled.map((team) => team.slug));
  try {
    try {
      const remote = parseTeamCatalog(await fetchJson(TEAM_LIBRARY_CATALOG_URL, MAX_CATALOG_BYTES, fetcher));
      const teams = [...bundled, ...remote.teams.filter((team) => !bundledSlugs.has(team.slug))];
      return { ...remote, teams };
    } catch {
      return {
        format: "openmaus.catalog",
        version: 1,
        repositoryUrl: TEAM_LIBRARY_REPOSITORY,
        teams: bundled,
      };
    }
  } catch {
    return {
      format: "openmaus.catalog",
      version: 1,
      repositoryUrl: TEAM_LIBRARY_REPOSITORY,
      teams: bundled.length > 0 ? bundled : [getBundledCatalogEntry()],
    };
  }
}

export type ParsedShareableTeam = ParsedTeamManifest | ParsedBotPackage;

function parseShareable(value: JsonValue | string): ParsedShareableTeam {
  if (typeof value === "string") return parseBotPackage(value);
  return isBotPackage(value) ? parseBotPackage(value) : parseTeamManifest(value);
}

async function fetchShareable(url: string, fetcher: Fetcher): Promise<ParsedShareableTeam> {
  return url.endsWith(".md")
    ? parseBotPackage(await fetchText(url, MAX_MANIFEST_BYTES, fetcher))
    : parseShareable(await fetchJson(url, MAX_MANIFEST_BYTES, fetcher));
}

export async function fetchLibraryTeam(slug: string, fetcher: Fetcher = fetch): Promise<ParsedShareableTeam> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error("That team name is invalid");
  if (isBundledTeamSlug(slug)) return loadBundledTeamPackage(slug);
  const catalog = await fetchTeamCatalog(fetcher);
  const entry = catalog.teams.find((team) => team.slug === slug);
  if (!entry) throw Object.assign(new Error("That library team was not found"), { status: 404 });
  return fetchShareable(`${TEAM_LIBRARY_RAW_ROOT}/${entry.package ?? entry.manifest}`, fetcher);
}

function safeSegment(value: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(value) && value !== "." && value !== "..";
}

/** Resolve only public GitHub Markdown playbooks and legacy JSON team files.
 * Other hosts never reach server fetch. */
export function githubManifestUrls(input: string): string[] {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Enter a valid GitHub URL");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("Only public HTTPS GitHub links are supported");
  }
  const parts = url.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  if (!parts.every(safeSegment)) throw new Error("That GitHub path is not supported");

  if (url.hostname === "github.com" || url.hostname === "www.github.com") {
    if (parts.length === 2) {
      const [owner, repo] = parts;
      return [
        `https://raw.githubusercontent.com/${owner}/${repo}/main/botmrr.md`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/team.md`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/crew.openfolks.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/team.mausteam.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/botmrr.md`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/team.md`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/crew.openfolks.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/team.mausteam.json`,
      ];
    }
    if (parts.length >= 5 && (parts[2] === "blob" || parts[2] === "raw")) {
      const [owner, repo, , ref, ...file] = parts;
      if (!file.at(-1)?.match(/\.(?:md|json)$/)) throw new Error("The GitHub link must point to a Markdown playbook or JSON team file");
      return [`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${file.join("/")}`];
    }
  }

  if (url.hostname === "raw.githubusercontent.com" && parts.length >= 4) {
    if (!parts.at(-1)?.match(/\.(?:md|json)$/)) throw new Error("The GitHub link must point to a Markdown playbook or JSON team file");
    return [`https://raw.githubusercontent.com/${parts.join("/")}`];
  }

  throw new Error("Paste a GitHub repository, Markdown playbook, or legacy JSON team link");
}

export async function fetchGithubTeam(input: string, fetcher: Fetcher = fetch): Promise<ParsedShareableTeam> {
  const urls = githubManifestUrls(input);
  let lastError: unknown;
  for (const url of urls) {
    try {
      return await fetchShareable(url, fetcher);
    } catch (error) {
      lastError = error;
      if ((error as { status?: number }).status !== 404) throw error;
    }
  }
  throw lastError ?? new Error("No botmrr.md, team.md, or legacy team file was found in that repository");
}
