import { describe, expect, it, vi } from "vitest";

import {
  BUNDLED_TEAM_SLUG,
  TEAM_LIBRARY_CATALOG_URL,
  TEAM_LIBRARY_RAW_ROOT,
  fetchGithubTeam,
  fetchLibraryTeam,
  fetchTeamCatalog,
  getBundledCatalogEntry,
  githubManifestUrls,
  parseTeamCatalog,
} from "./team-library.ts";

const manifest = {
  format: "openfolks.team",
  version: 2,
  team: {
    name: "Engineering",
    members: [
      {
        key: "lead",
        name: "Ada",
        title: "Tech Lead",
        description: "Coordinates the work",
        appearance: { color: "purple" },
      },
    ],
  },
};

const catalog = {
  format: "openfolks.catalog",
  version: 1,
  teams: [
    {
      slug: "engineering",
      name: "Engineering Team",
      summary: "Plan and ship software.",
      category: "Engineering",
      manifest: "crews/engineering/crew.openfolks.json",
      readme: "crews/engineering/README.md",
      members: 1,
      skills: ["crews/engineering/skills/release/SKILL.md"],
      requires: { apps: ["GitHub"] },
    },
  ],
};

function response(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("team library", () => {
  it("validates catalog paths and adds the trusted repository URL", () => {
    const parsed = parseTeamCatalog(catalog);
    expect(parsed.repositoryUrl).toBe("http://github.com/manasdutta04/openfolks");
    expect(parsed.teams[0]).toMatchObject({ slug: "engineering", members: 1 });

    const unsafe = structuredClone(catalog);
    unsafe.teams[0]!.manifest = "../private.json";
    expect(() => parseTeamCatalog(unsafe)).toThrow("safe catalog path");
  });

  it("accepts openmaus.catalog from legacy catalog formats", () => {
    const openmaus = {
      ...catalog,
      format: "openmaus.catalog",
      teams: [
        {
          ...catalog.teams[0],
          package: "packages/engineering.md",
          members: 4,
        },
      ],
    };
    const parsed = parseTeamCatalog(openmaus);
    expect(parsed.format).toBe("openmaus.catalog");
    expect(parsed.teams[0]).toMatchObject({
      slug: "engineering",
      members: 4,
      package: "packages/engineering.md",
    });
  });

  it("loads only the manifest selected by the trusted catalog", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target === TEAM_LIBRARY_CATALOG_URL) return response(catalog);
      if (target === `${TEAM_LIBRARY_RAW_ROOT}/crews/engineering/crew.openfolks.json`) return response(manifest);
      return response({}, 404);
    }) as unknown as typeof fetch;

    const loaded = await fetchLibraryTeam("engineering", fetcher);
    if (loaded.format !== "openfolks.team") throw new Error("expected a legacy team");
    expect(loaded.team.name).toBe("Engineering");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("prepends bundled teams and serves Job Search locally", async () => {
    const bundled = getBundledCatalogEntry();
    expect(bundled.slug).toBe(BUNDLED_TEAM_SLUG);
    expect(bundled.name).toBe("Job Search");
    expect(bundled.members).toBe(5);
    expect(bundled.package).toBe("packages/crews/job-search/catalog.md");
    expect(bundled.skills.length).toBe(8);

    const fetcher = vi.fn(async (url: string | URL | Request) => {
      if (String(url) === TEAM_LIBRARY_CATALOG_URL) return response(catalog);
      return response({}, 404);
    }) as unknown as typeof fetch;

    const merged = await fetchTeamCatalog(fetcher);
    expect(merged.teams[0]?.slug).toBe(BUNDLED_TEAM_SLUG);
    expect(merged.teams.some((team) => team.slug === "content-studio")).toBe(true);
    expect(merged.teams.some((team) => team.slug === "dev-crew")).toBe(true);
    expect(merged.teams.some((team) => team.slug === "engineering")).toBe(true);

    const loaded = await fetchLibraryTeam(BUNDLED_TEAM_SLUG, fetcher);
    if (loaded.format !== "openfolks.package") throw new Error("expected a folk package");
    expect(loaded.package.agents).toHaveLength(5);
    expect(loaded.package.rooms).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(1);

    const content = await fetchLibraryTeam("content-studio", fetcher);
    if (content.format !== "openfolks.team") throw new Error("expected a legacy team");
    expect(content.team.name).toBe("Content Studio");
    expect(content.team.members).toHaveLength(3);
  });

  it("returns bundled crews when the remote catalog is unavailable", async () => {
    const fetcher = vi.fn(async () => response({}, 502)) as unknown as typeof fetch;
    const merged = await fetchTeamCatalog(fetcher);
    expect(merged.teams.some((team) => team.slug === BUNDLED_TEAM_SLUG)).toBe(true);
    expect(merged.teams.some((team) => team.slug === "research-desk")).toBe(true);
    expect(merged.teams.length).toBeGreaterThanOrEqual(5);
  });

  it("normalizes public GitHub repository, blob, and raw links", () => {
    expect(githubManifestUrls("https://github.com/acme/team")).toEqual([
      "https://raw.githubusercontent.com/acme/team/main/botmrr.md",
      "https://raw.githubusercontent.com/acme/team/main/team.md",
      "https://raw.githubusercontent.com/acme/team/main/crew.openfolks.json",
      "https://raw.githubusercontent.com/acme/team/main/team.mausteam.json",
      "https://raw.githubusercontent.com/acme/team/master/botmrr.md",
      "https://raw.githubusercontent.com/acme/team/master/team.md",
      "https://raw.githubusercontent.com/acme/team/master/crew.openfolks.json",
      "https://raw.githubusercontent.com/acme/team/master/team.mausteam.json",
    ]);
    expect(githubManifestUrls("https://github.com/acme/team/blob/main/presets/seo.mausteam.json")).toEqual([
      "https://raw.githubusercontent.com/acme/team/main/presets/seo.mausteam.json",
    ]);
    expect(githubManifestUrls("https://raw.githubusercontent.com/acme/team/main/team.mausteam.json")).toEqual([
      "https://raw.githubusercontent.com/acme/team/main/team.mausteam.json",
    ]);
    expect(() => githubManifestUrls("http://example.com/team.json")).toThrow("public HTTPS GitHub");
    expect(() => githubManifestUrls("https://github.com/acme/team/blob/main/run.sh")).toThrow("Markdown playbook");
  });

  it("falls back from main to master for a repository link", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) =>
      String(url).endsWith("team.mausteam.json") && String(url).includes("/master/")
        ? response(manifest)
        : response({}, 404),
    ) as unknown as typeof fetch;

    const loaded = await fetchGithubTeam("https://github.com/acme/team", fetcher);
    if (loaded.format !== "openfolks.team") throw new Error("expected a legacy team");
    expect(loaded.team.members[0]?.name).toBe("Ada");
    expect(fetcher).toHaveBeenCalledTimes(8);
  });
});
