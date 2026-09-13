// Universal search (⌘/Ctrl+K): Spotlight-style overlay with Grok-like tabs.
// Folks/groups/actions/routines/files/links from local state; messages from
// /api/search. Self-contained — owns open state and the global chord.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  FileText,
  Link2,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { api, useStore, type Bot, type Group } from "@/state/store";
import { BotAvatar } from "./Avatar";
import { rankByName } from "@/lib/palette-rank";
import { cn } from "@/lib/cn";
import type { SearchHit } from "@/lib/search-hit";
import { landOnSearchHit } from "@/lib/focus-message";
import type { Routine } from "@/lib/routines";
import {
  SEARCH_TABS,
  collectActionHits,
  collectFileHits,
  collectLinkHits,
  collectRoutineHits,
  type FileHit,
  type LinkHit,
  type SearchTab,
  type UniversalAction,
} from "@/lib/universal-search";

type PaletteEntry =
  | { kind: "folk"; bot: Bot }
  | { kind: "group"; group: Group }
  | { kind: "message"; hit: SearchHit }
  | { kind: "file"; hit: FileHit }
  | { kind: "link"; hit: LinkHit }
  | { kind: "routine"; routine: Routine }
  | { kind: "action"; action: UniversalAction; run: () => void };

function typeLabel(entry: PaletteEntry): string {
  switch (entry.kind) {
    case "folk":
      return "Folk";
    case "group":
      return "Group";
    case "message":
      return "Message";
    case "file":
      return "File";
    case "link":
      return "Link";
    case "routine":
      return "Routine";
    case "action":
      return "Action";
  }
}

export function CommandPalette(props: { onOpenChange?: (open: boolean) => void } = {}) {
  const { onOpenChange } = props;
  const { state, dispatch } = useStore();
  const open = state.universalSearchOpen;
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const [messageHits, setMessageHits] = useState<SearchHit[]>([]);
  const [cursor, setCursor] = useState(0);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setOpen = (value: boolean) => {
    dispatch({ type: "toggleUniversalSearch", open: value });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ⌘/Ctrl+K and ⌘/Ctrl+F both open universal search (chat find is gone).
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key !== "k" && key !== "f") return;
      e.preventDefault();
      dispatch({ type: "toggleUniversalSearch" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  // Native menu Edit/Go → Search…
  useEffect(() => {
    return window.ogb?.onMenuCommand?.((command) => {
      if (command === "open-search") setOpen(true);
    });
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setTab("all");
    setMessageHits([]);
    setCursor(0);
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  const q = query.trim().toLowerCase();

  useEffect(() => {
    if (!open || !q) {
      setMessageHits([]);
      return;
    }
    setMessageHits([]);
    let alive = true;
    const timer = setTimeout(() => {
      api(`/api/search?q=${encodeURIComponent(q)}&limit=24`)
        .then((result: { hits?: SearchHit[] }) => alive && setMessageHits(result.hits ?? []))
        .catch(() => alive && setMessageHits([]));
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, q]);

  useEffect(() => setCursor(0), [q, tab, messageHits]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor, messageHits, tab]);

  const actions = useMemo<UniversalAction[]>(
    () => [
      { id: "desk", title: "Open Desk", subtitle: "Approvals, handoffs, and the crew map", keywords: ["home", "inbox", "queue"] },
      { id: "new-folk", title: "New Folk", subtitle: "Create someone for your crew", keywords: ["bot", "agent", "create"] },
      { id: "marketplace", title: "Marketplace", subtitle: "Connected apps and crew packages", keywords: ["plugins", "apps", "store"] },
      { id: "marketplace-folks", title: "Browse Folks", subtitle: "Import a crew from Marketplace", keywords: ["team", "package", "library"] },
      { id: "settings-general", title: "Settings · General", subtitle: "Look, language, and housekeeping", keywords: ["skin", "theme", "appearance"] },
      { id: "settings-connections", title: "Settings · Connections", subtitle: "Keys and services on this machine", keywords: ["api", "keys", "box", "vps"] },
      { id: "settings-engines", title: "Settings · Engines", subtitle: "Which CLI each provider runs", keywords: ["models", "claude", "ollama"] },
      { id: "settings-computer", title: "Settings · Local VM", subtitle: "A virtual desktop folks can borrow", keywords: ["vm", "computer", "desktop"] },
      { id: "settings-mcp", title: "Settings · MCP", subtitle: "Model context servers and tools", keywords: ["mcp", "tools"] },
    ],
    [],
  );

  const runAction = (id: string) => {
    switch (id) {
      case "desk":
        dispatch({ type: "showDesk" });
        break;
      case "new-folk":
        dispatch({ type: "newBot" });
        break;
      case "marketplace":
        dispatch({ type: "togglePlugins", open: true, tab: "plugins" });
        break;
      case "marketplace-folks":
        dispatch({ type: "togglePlugins", open: true, tab: "folks" });
        break;
      case "settings-general":
        dispatch({ type: "toggleAppSettings", open: true, section: "general" });
        break;
      case "settings-connections":
        dispatch({ type: "toggleAppSettings", open: true, section: "connections" });
        break;
      case "settings-engines":
        dispatch({ type: "toggleAppSettings", open: true, section: "engines" });
        break;
      case "settings-computer":
        dispatch({ type: "toggleAppSettings", open: true, section: "computer" });
        break;
      case "settings-mcp":
        dispatch({ type: "toggleAppSettings", open: true, section: "mcp" });
        break;
      default:
        break;
    }
  };

  const bots = useMemo(
    () => rankByName(state.bots.filter((bot) => !bot.hidden), q),
    [state.bots, q],
  );
  const rooms = useMemo(() => rankByName(state.groups, q), [state.groups, q]);
  const routines = useMemo(
    () => collectRoutineHits(state.routines, q),
    [state.routines, q],
  );
  const files = useMemo(
    () => collectFileHits(state.bots, state.groups, state.routines, q),
    [state.bots, state.groups, state.routines, q],
  );
  const links = useMemo(
    () => collectLinkHits(state.bots, state.groups, messageHits, q),
    [state.bots, state.groups, messageHits, q],
  );
  const actionHits = useMemo(() => collectActionHits(actions, q), [actions, q]);

  if (!open) return null;

  const entries: PaletteEntry[] = [];
  const include = (kind: SearchTab) => tab === "all" || tab === kind;

  if (include("folks")) {
    for (const bot of bots) entries.push({ kind: "folk", bot });
  }
  if (include("groups")) {
    for (const group of rooms) entries.push({ kind: "group", group });
  }
  if (include("messages") && q) {
    for (const hit of messageHits) entries.push({ kind: "message", hit });
  }
  // Files/links need a query (or an explicit tab) so All-with-empty stays a
  // switcher instead of dumping every attachment on open.
  if (include("files") && (q || tab === "files")) {
    for (const hit of files) entries.push({ kind: "file", hit });
  }
  if (include("links") && (q || tab === "links")) {
    for (const hit of links) entries.push({ kind: "link", hit });
  }
  if (include("routines") && (q || tab === "routines" || tab === "all")) {
    for (const routine of (q || tab === "routines" ? routines : routines.slice(0, 6))) {
      entries.push({ kind: "routine", routine });
    }
  }
  if (include("actions")) {
    for (const action of actionHits) {
      entries.push({ kind: "action", action, run: () => runAction(action.id) });
    }
  }

  const selected = entries.length ? Math.min(cursor, entries.length - 1) : 0;

  const activate = async (entry: PaletteEntry) => {
    try {
      if (entry.kind === "message") {
        await landOnSearchHit(entry.hit, state, dispatch);
      } else if (entry.kind === "folk") {
        dispatch({ type: "select", id: entry.bot.id });
      } else if (entry.kind === "group") {
        dispatch({ type: "select", id: entry.group.id });
      } else if (entry.kind === "routine") {
        dispatch({ type: "select", id: entry.routine.botId });
      } else if (entry.kind === "file") {
        if (entry.hit.messageId && entry.hit.threadId) {
          await landOnSearchHit(
            {
              botId: entry.hit.botId,
              groupId: entry.hit.groupId,
              name: entry.hit.ownerName,
              threadId: entry.hit.threadId,
              messageId: entry.hit.messageId,
              role: "user",
              kind: "text",
              at: Date.now(),
              snippet: entry.hit.name,
              matchStart: 0,
              matchLength: entry.hit.name.length,
              onActivePath: true,
            },
            state,
            dispatch,
          );
        } else if (entry.hit.botId) {
          dispatch({ type: "select", id: entry.hit.botId });
        }
      } else if (entry.kind === "link") {
        if (entry.hit.messageId && entry.hit.threadId) {
          await landOnSearchHit(
            {
              botId: entry.hit.botId,
              groupId: entry.hit.groupId,
              name: entry.hit.ownerName,
              threadId: entry.hit.threadId,
              messageId: entry.hit.messageId,
              role: "user",
              kind: "text",
              at: Date.now(),
              snippet: entry.hit.url,
              matchStart: 0,
              matchLength: entry.hit.url.length,
              onActivePath: true,
            },
            state,
            dispatch,
          );
        }
        void window.ogb?.openExternal?.(entry.hit.url)?.catch(() => {
          window.open(entry.hit.url, "_blank", "noopener,noreferrer");
        });
      } else if (entry.kind === "action") {
        entry.run();
      }
      setOpen(false);
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(entries.length ? (selected + 1) % entries.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(entries.length ? (selected - 1 + entries.length) % entries.length : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = entries[selected];
      if (entry) void activate(entry);
    } else if (e.key === "Tab" && !e.altKey) {
      e.preventDefault();
      const index = SEARCH_TABS.findIndex((item) => item.id === tab);
      const next = e.shiftKey
        ? SEARCH_TABS[(index - 1 + SEARCH_TABS.length) % SEARCH_TABS.length]
        : SEARCH_TABS[(index + 1) % SEARCH_TABS.length];
      if (next) setTab(next.id);
    }
  };

  const shortcut = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘K"
    : "Ctrl+K";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
      onKeyDown={onKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Universal search"
        className="flex max-h-[min(560px,76vh)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-hairline/40 bg-card shadow-2xl shadow-black/60"
      >
        <div className="border-b border-hairline/35 px-3 pb-2.5 pt-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-raised/70 px-3 py-2.5">
            <Search size={16} className="shrink-0 text-ink-secondary" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-secondary focus:outline-none"
            />
            <kbd className="shrink-0 rounded-md border border-hairline/40 px-1.5 py-0.5 text-[11px] text-ink-secondary">
              {shortcut}
            </kbd>
          </div>
          <div
            className="mt-2.5 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Search category"
          >
            {SEARCH_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                  tab === item.id
                    ? "bg-raised text-ink"
                    : "text-ink-secondary hover:bg-raised/50 hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {entries.length === 0 && (
            <div className="px-3 py-10 text-center text-[13px] text-ink-secondary">
              {q ? `Nothing matches “${query.trim()}”` : "Type to search folks, messages, files, and more"}
            </div>
          )}
          {entries.map((entry, index) => {
            const active = index === selected;
            return (
              <button
                key={entryKey(entry)}
                ref={active ? selectedRef : undefined}
                type="button"
                onClick={() => void activate(entry)}
                onMouseMove={() => setCursor(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left",
                  active ? "bg-raised" : "hover:bg-raised/45",
                )}
              >
                <EntryIcon entry={entry} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-[14px] font-medium text-ink">{entryTitle(entry)}</span>
                    <span className="ml-auto shrink-0 text-[12px] text-ink-secondary">{typeLabel(entry)}</span>
                  </span>
                  {entrySubtitle(entry) && (
                    <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink-secondary">
                      {entrySubtitle(entry)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function entryKey(entry: PaletteEntry): string {
  switch (entry.kind) {
    case "folk":
      return `folk:${entry.bot.id}`;
    case "group":
      return `group:${entry.group.id}`;
    case "message":
      return `msg:${entry.hit.threadId}:${entry.hit.messageId}`;
    case "file":
      return `file:${entry.hit.key}`;
    case "link":
      return `link:${entry.hit.key}`;
    case "routine":
      return `routine:${entry.routine.id}`;
    case "action":
      return `action:${entry.action.id}`;
  }
}

function entryTitle(entry: PaletteEntry): string {
  switch (entry.kind) {
    case "folk":
      return entry.bot.name;
    case "group":
      return entry.group.name;
    case "message":
      return entry.hit.from ?? entry.hit.name;
    case "file":
      return entry.hit.name;
    case "link":
      return entry.hit.title;
    case "routine":
      return entry.routine.name;
    case "action":
      return entry.action.title;
  }
}

function entrySubtitle(entry: PaletteEntry): string | null {
  switch (entry.kind) {
    case "folk":
      return entry.bot.title || entry.bot.description || null;
    case "group":
      return entry.group.memberIds.length
        ? `${entry.group.memberIds.length} members`
        : "Group chat";
    case "message": {
      const before = entry.hit.snippet.slice(0, entry.hit.matchStart);
      const match = entry.hit.snippet.slice(
        entry.hit.matchStart,
        entry.hit.matchStart + entry.hit.matchLength,
      );
      const after = entry.hit.snippet.slice(entry.hit.matchStart + entry.hit.matchLength);
      return `${before}${match}${after}`;
    }
    case "file":
      return entry.hit.ownerName;
    case "link":
      return entry.hit.ownerName;
    case "routine":
      return entry.routine.prompt;
    case "action":
      return entry.action.subtitle;
  }
}

function EntryIcon({ entry }: { entry: PaletteEntry }) {
  if (entry.kind === "folk") {
    return <BotAvatar bot={entry.bot} state="idle" size={28} animated={false} />;
  }
  if (entry.kind === "group") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-secondary">
        <Users size={14} />
      </span>
    );
  }
  if (entry.kind === "message") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-secondary">
        <MessageSquare size={14} />
      </span>
    );
  }
  if (entry.kind === "file") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-secondary">
        <FileText size={14} />
      </span>
    );
  }
  if (entry.kind === "link") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-secondary">
        <Link2 size={14} />
      </span>
    );
  }
  if (entry.kind === "routine") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-secondary">
        <CalendarClock size={14} />
      </span>
    );
  }
  const icon =
    entry.action.id === "marketplace" || entry.action.id === "marketplace-folks"
      ? Store
      : entry.action.id === "desk"
        ? Sparkles
        : entry.action.id === "new-folk"
          ? Users
          : Settings;
  const Icon = icon;
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-secondary">
      <Icon size={14} />
    </span>
  );
}
