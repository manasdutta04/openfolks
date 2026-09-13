/** Collect local candidates for the universal search palette. */
import { splitTranscriptAttachments } from "./composer-attachments";
import { rankByName } from "./palette-rank";
import type { Bot, Group, Message } from "@/state/store";
import type { Routine } from "@/lib/routines";
import type { SearchHit } from "@/lib/search-hit";

export type SearchTab =
  | "all"
  | "messages"
  | "folks"
  | "groups"
  | "files"
  | "links"
  | "routines"
  | "actions";

export const SEARCH_TABS: ReadonlyArray<{ id: SearchTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "messages", label: "Messages" },
  { id: "folks", label: "Folks" },
  { id: "groups", label: "Groups" },
  { id: "files", label: "Files" },
  { id: "links", label: "Links" },
  { id: "routines", label: "Routines" },
  { id: "actions", label: "Actions" },
];

export type UniversalAction = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
};

export type FileHit = {
  key: string;
  name: string;
  path: string;
  ownerName: string;
  botId?: string;
  groupId?: string;
  threadId: string;
  messageId: string;
};

export type LinkHit = {
  key: string;
  url: string;
  title: string;
  ownerName: string;
  botId?: string;
  groupId?: string;
  threadId?: string;
  messageId?: string;
};

const URL_RE = /https?:\/\/[^\s<>"'`)\]]+/gi;

function matchesQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

function rankActions(actions: UniversalAction[], query: string): UniversalAction[] {
  const q = query.trim().toLowerCase();
  if (!q) return actions;
  const scored = actions
    .map((action) => {
      const blob = [action.title, action.subtitle, ...action.keywords].join(" ").toLowerCase();
      if (action.title.toLowerCase().startsWith(q)) return { action, score: 0 };
      if (blob.includes(q)) return { action, score: 1 };
      return null;
    })
    .filter((row): row is { action: UniversalAction; score: number } => row !== null);
  scored.sort((a, b) => a.score - b.score);
  return scored.map((row) => row.action);
}

function walkMessages(
  bots: Bot[],
  groups: Group[],
  visit: (owner: { botId?: string; groupId?: string; name: string; threadId: string }, message: Message) => void,
): void {
  for (const bot of bots) {
    if (bot.hidden) continue;
    for (const message of bot.messages ?? []) {
      visit({ botId: bot.id, name: bot.name, threadId: bot.threadId }, message);
    }
  }
  for (const group of groups) {
    for (const message of group.messages ?? []) {
      visit({ groupId: group.id, name: group.name, threadId: group.threadId }, message);
    }
  }
}

/** Files attached in currently loaded transcripts (and routine context files). */
export function collectFileHits(
  bots: Bot[],
  groups: Group[],
  routines: Routine[],
  query: string,
): FileHit[] {
  const hits: FileHit[] = [];
  const seen = new Set<string>();

  walkMessages(bots, groups, (owner, message) => {
    if (message.role !== "user" || !message.text) return;
    const { files } = splitTranscriptAttachments(message.text);
    for (const file of files) {
      if (!matchesQuery(`${file.name} ${file.path} ${owner.name}`, query)) continue;
      const key = `${owner.threadId}:${message.id}:${file.path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        key,
        name: file.name,
        path: file.path,
        ownerName: owner.name,
        botId: owner.botId,
        groupId: owner.groupId,
        threadId: owner.threadId,
        messageId: message.id,
      });
    }
  });

  for (const routine of routines) {
    for (const attachment of routine.attachments ?? []) {
      if (attachment.kind !== "file" && attachment.kind !== "image") continue;
      if (!matchesQuery(`${attachment.name} ${attachment.path} ${routine.name}`, query)) continue;
      const key = `routine:${routine.id}:${attachment.path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        key,
        name: attachment.name,
        path: attachment.path,
        ownerName: routine.name,
        botId: routine.botId,
        threadId: "",
        messageId: "",
      });
    }
  }

  return hits.slice(0, 40);
}

/** Links found in loaded transcripts and message search snippets. */
export function collectLinkHits(
  bots: Bot[],
  groups: Group[],
  messageHits: SearchHit[],
  query: string,
): LinkHit[] {
  const hits: LinkHit[] = [];
  const seen = new Set<string>();

  const push = (hit: LinkHit) => {
    if (seen.has(hit.url)) return;
    if (!matchesQuery(`${hit.url} ${hit.title} ${hit.ownerName}`, query)) return;
    seen.add(hit.url);
    hits.push(hit);
  };

  walkMessages(bots, groups, (owner, message) => {
    if (!message.text) return;
    const { display } = splitTranscriptAttachments(message.text);
    for (const match of display.matchAll(URL_RE)) {
      const url = match[0]?.replace(/[.,;:!?)]+$/, "") ?? "";
      if (!url) continue;
      push({
        key: `${owner.threadId}:${message.id}:${url}`,
        url,
        title: url.replace(/^https?:\/\//, ""),
        ownerName: owner.name,
        botId: owner.botId,
        groupId: owner.groupId,
        threadId: owner.threadId,
        messageId: message.id,
      });
    }
  });

  for (const hit of messageHits) {
    for (const match of hit.snippet.matchAll(URL_RE)) {
      const url = match[0]?.replace(/[.,;:!?)]+$/, "") ?? "";
      if (!url) continue;
      push({
        key: `search:${hit.threadId}:${hit.messageId}:${url}`,
        url,
        title: url.replace(/^https?:\/\//, ""),
        ownerName: hit.name,
        botId: hit.botId,
        groupId: hit.groupId,
        threadId: hit.threadId,
        messageId: hit.messageId,
      });
    }
  }

  return hits.slice(0, 40);
}

export function collectRoutineHits(routines: Routine[], query: string): Routine[] {
  return rankByName(routines, query).slice(0, 40);
}

export function collectActionHits(actions: UniversalAction[], query: string): UniversalAction[] {
  return rankActions(actions, query);
}

export function filterMessageHits(hits: SearchHit[], query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return hits;
}
