import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseBotPackage, type ParsedBotPackage } from "../bot-package.ts";
import { composePlaybook, loadPlaybookText } from "./paths.ts";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const JOB_SEARCH_PACKAGE_PATH = join(REPO_ROOT, "packages/crews/job-search/catalog.md");

function playbook(key: string, name: string, summary: string, triggers: string[], bodyFile: string) {
  return {
    key,
    name,
    summary,
    triggers,
    instructions: composePlaybook(loadPlaybookText(bodyFile)),
  };
}

function scrapeRankPlaybook() {
  return {
    key: "scrape-rank",
    name: "Job search and rank",
    summary: "Find jobs via portal CLIs, dedupe, quick-fit, and rank shortlists.",
    triggers: ["find jobs", "search jobs", "scrape", "rank jobs", "job search"],
    instructions: composePlaybook(loadPlaybookText("scrape-rank-brief")),
  };
}

/** Build the Job Search package from playbooks — used to regenerate packages/crews/job-search/catalog.md. */
export function buildOpenFolksPackageSource(): ParsedBotPackage {
  const playbooks = [
    scrapeRankPlaybook(),
    playbook("apply-pipeline", "Tailor application", "Evaluate fit, draft CV and cover letter, review, compile PDF, ATS check.", ["apply", "tailor", "cv", "cover letter", "job description"], "apply-pipeline-brief"),
    playbook("job-evaluation", "Job fit evaluation", "Score postings with deal-breakers and language gate.", ["fit", "evaluate job", "should I apply"], "job-evaluation-brief"),
    playbook("outcome-tracker", "Application tracker", "Log outcomes, follow-ups, and archive applications.", ["track application", "outcome", "follow up", "status"], "outcome-tracker-brief"),
    playbook("interview-coach", "Interview prep", "Stage-specific prep packs and mock interviews.", ["interview", "mock interview", "prep"], "interview-coach-brief"),
    playbook("linkedin-profile", "LinkedIn and profile", "Draft LinkedIn and branding suggestions — never auto-post.", ["linkedin", "profile", "headline", "branding"], "linkedin-profile"),
    playbook("semi-auto-apply", "Semi-auto apply", "Fill forms via computer-use; user approves Submit.", ["apply for me", "submit application", "fill form"], "semi-auto-apply"),
    playbook("generalist", "General job assistant", "Ad hoc job-search tasks.", ["help", "career", "job"], "generalist"),
  ];

  return parseBotPackage({
    format: "openfolks.package",
    version: 1,
    package: {
      id: "job-search",
      release: "1.0.0",
      name: "Job Search",
      tagline: "Your job-search crew — find, tailor, track, and prep.",
      summary: "Scout, Tailor, Tracker, Coach, and Generalist — five agents with a shared Job Search channel.",
      category: "Job Search",
      author: { name: "OpenFolks" },
      license: "Apache-2.0",
      outcomes: [
        "Find and rank relevant job postings",
        "Tailor CV and cover letter per role with PDF compile and ATS check",
        "Track applications and follow-ups",
        "Prep for interviews and improve LinkedIn profile drafts",
      ],
      setupMinutes: 10,
      requirements: {
        apps: [],
        capabilities: ["bash", "file edits"],
      },
      agents: [
        {
          key: "scout",
          name: "Scout",
          title: "Job finder",
          description: "Finds and ranks job postings via portal CLIs. Can drive semi-automated apply with your approval at Submit.",
          appearance: { color: "blue" },
          playbooks: ["scrape-rank", "semi-auto-apply", "job-evaluation"],
        },
        {
          key: "tailor",
          name: "Tailor",
          title: "Application tailor",
          description: "Paste a job description — fit evaluation, tailored CV and cover letter, PDF compile, ATS verification.",
          appearance: { color: "purple" },
          playbooks: ["apply-pipeline", "job-evaluation"],
        },
        {
          key: "tracker",
          name: "Tracker",
          title: "Application tracker",
          description: "Answers questions about your pipeline, logs outcomes, surfaces stale applications for follow-up.",
          appearance: { color: "teal" },
          playbooks: ["outcome-tracker"],
        },
        {
          key: "coach",
          name: "Coach",
          title: "Interview and profile coach",
          description: "Interview prep, mock roleplay, LinkedIn suggestions, and skill-gap analysis.",
          appearance: { color: "orange" },
          playbooks: ["interview-coach", "linkedin-profile", "job-evaluation"],
        },
        {
          key: "generalist",
          name: "Generalist",
          title: "General job assistant",
          description: "Anything else job-related — open-ended help across your job-search workspace.",
          appearance: { color: "green" },
          playbooks: ["generalist"],
        },
      ],
      chiefOfStaff: "generalist",
      rooms: [
        {
          key: "job-search",
          name: "Job Search",
          members: ["scout", "tailor", "tracker", "coach", "generalist"],
          bulletin:
            "Shared job-search workspace. Scout finds and ranks roles; Tailor tailors applications; Tracker logs pipeline; Coach preps interviews; Generalist handles ad hoc tasks. Never auto-submit applications — user approves Submit. All folks share the project folder.",
          defaultResponder: { kind: "agent", agent: "generalist" },
        },
      ],
      playbooks,
      tags: ["job-search", "career", "openfolks"],
    },
  });
}

/** Load the published Job Search BotMRR package from disk (same path remote teams use). */
export function loadOpenFolksPackageDocument(): ParsedBotPackage {
  if (existsSync(JOB_SEARCH_PACKAGE_PATH)) {
    return parseBotPackage(readFileSync(JOB_SEARCH_PACKAGE_PATH, "utf8"));
  }
  return buildOpenFolksPackageSource();
}

/** @deprecated Prefer loadOpenFolksPackageDocument — kept for tests and package regeneration. */
export function buildOpenFolksPackageDocument(): ParsedBotPackage {
  return loadOpenFolksPackageDocument();
}

export const JOB_SEARCH_PLAYBOOK_KEYS = [
  "scrape-rank",
  "apply-pipeline",
  "job-evaluation",
  "outcome-tracker",
  "interview-coach",
  "linkedin-profile",
  "semi-auto-apply",
  "generalist",
] as const;
