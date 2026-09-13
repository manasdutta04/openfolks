import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  Star,
  Inbox,
  Loader2,
  MessageSquare,
  Radio,
  RefreshCw,
  Save,
  Store,
  X,
} from "lucide-react";

import { BotAvatar } from "./Avatar";
import { api, formatTime, useStore, type Bot } from "@/state/store";
import { buildDesk, type DeskItem } from "@/lib/desk";
import {
  EMPTY_FOLKS_RADAR_SNAPSHOT,
  buildFolksRadarEdges,
  buildFolksRadarSections,
  folksRadarStatus,
  type FolksRadarEdge,
  type FolksRadarSnapshot,
} from "@/lib/folks-radar";
import { cn } from "@/lib/cn";

const statusTone = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  idle: "bg-ink-secondary/35",
} as const;

function DeskRow({
  item,
  bot,
  tone,
}: {
  item: DeskItem;
  bot?: Bot;
  tone: "needs-you" | "working" | "unread";
}) {
  const { dispatch } = useStore();
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "select", id: item.botId })}
      className="group flex w-full items-center gap-3 rounded-2xl border border-hairline/40 bg-card/80 px-3.5 py-3 text-left shadow-sm transition hover:border-accent/40 hover:bg-raised/50"
    >
      {bot ? (
        <BotAvatar bot={bot} size={36} animated={false} />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-full bg-raised text-ink-secondary">
          <MessageSquare size={16} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-ink">{item.botName}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
              tone === "needs-you" && "bg-warning/15 text-warning",
              tone === "working" && "bg-success/15 text-success",
              tone === "unread" && "bg-accent/15 text-accent",
            )}
          >
            {tone === "needs-you" ? "Needs you" : tone === "working" ? "Working" : "Unread"}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-ink">{item.title}</span>
        <span className="block truncate text-[11.5px] text-ink-secondary">{item.detail}</span>
      </span>
      <ArrowRight size={14} className="shrink-0 text-ink-secondary opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

function QueueSection({
  title,
  hint,
  empty,
  count,
  children,
}: {
  title: string;
  hint?: string;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          {hint && <p className="text-[11.5px] text-ink-secondary">{hint}</p>}
        </div>
        <span className="rounded-full bg-control px-2 py-0.5 text-[11px] tabular-nums text-ink-secondary">{count}</span>
      </div>
      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline/50 bg-panel/40 px-4 py-5 text-[13px] text-ink-secondary">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

function CrewFolkTile({ bot, featured = false }: { bot: Bot; featured?: boolean }) {
  const { dispatch } = useStore();
  const status = folksRadarStatus(bot);
  const subtitle = bot.title?.trim() || bot.modelSelection.model;
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "select", id: bot.id })}
      title={`${bot.name} — ${subtitle} · ${status.label}`}
      className={cn(
        "group relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl text-left transition",
        featured
          ? "w-full border border-hairline/50 bg-card/90 px-3 py-3 hover:border-accent/40"
          : "border border-transparent bg-card/55 px-2.5 py-2 hover:border-hairline/50 hover:bg-card",
      )}
    >
      <span className="relative shrink-0">
        <BotAvatar bot={bot} size={featured ? 40 : 32} animated={false} />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-panel",
            statusTone[status.tone],
            status.label === "Working" && "animate-pulse",
          )}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="flex min-w-0 items-center gap-1">
          <span className={cn("truncate font-semibold text-ink", featured ? "text-[14px]" : "text-[12.5px]")}>
            {bot.name}
          </span>
          {featured && <Star size={12} className="shrink-0 text-warning" aria-label="Leader" />}
        </span>
        <span className="block truncate text-[11px] text-ink-secondary">{featured ? subtitle : status.label}</span>
      </span>
    </button>
  );
}

function CrewSectionCard({
  name,
  chiefs,
  members,
  onOpenContext,
}: {
  name: string;
  chiefs: Bot[];
  members: Bot[];
  onOpenContext: () => void;
}) {
  const crew = [...chiefs, ...members];
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-hairline/40 bg-panel">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_70%)]"
      />
      <div className="relative flex items-center justify-between gap-2 border-b border-hairline/30 px-3.5 py-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold tracking-tight text-ink">{name}</h3>
          <p className="text-[11px] text-ink-secondary">
            {crew.length} {crew.length === 1 ? "folk" : "folks"}
            {chiefs.length > 0 ? ` · ${chiefs.length} chief` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenContext}
          className="flex shrink-0 items-center gap-1 rounded-full border border-hairline/40 bg-card/70 px-2.5 py-1 text-[11px] font-medium text-ink-secondary hover:border-accent/30 hover:text-ink"
          title="Shared section context"
        >
          <BookOpen size={12} />
          Context
        </button>
      </div>

      <div className="relative space-y-3 p-3.5">
        {chiefs.map((bot) => (
          <CrewFolkTile key={bot.id} bot={bot} featured />
        ))}

        {chiefs.length > 0 && members.length > 0 && (
          <div className="flex items-center gap-2 px-1" aria-hidden>
            <span className="h-px flex-1 bg-hairline/50" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-secondary/80">crew</span>
            <span className="h-px flex-1 bg-hairline/50" />
          </div>
        )}

        {members.length > 0 && (
          <div className="grid min-w-0 grid-cols-2 gap-2">
            {members.map((bot) => (
              <CrewFolkTile key={bot.id} bot={bot} />
            ))}
          </div>
        )}

        {crew.length === 0 && (
          <p className="py-4 text-center text-[12.5px] text-ink-secondary">No folks in this section.</p>
        )}
      </div>
    </section>
  );
}

function EdgeRow({ edge, bots }: { edge: FolksRadarEdge; bots: Bot[] }) {
  const { dispatch } = useStore();
  const source = bots.find((bot) => bot.id === edge.sourceBotId);
  const target = bots.find((bot) => bot.id === edge.targetBotId);
  if (!source || !target) return null;
  const live = edge.state !== "connected";
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "select", id: edge.groupId ?? target.id })}
      className="flex w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl border border-hairline/35 bg-card/60 px-3 py-2 text-left transition hover:bg-card"
    >
      <BotAvatar bot={source} size={22} animated={false} />
      <ArrowRight size={12} className={cn("shrink-0", live ? "text-accent" : "text-ink-secondary")} />
      <BotAvatar bot={target} size={22} animated={false} />
      <span className="min-w-0 flex-1 truncate text-[12px] text-ink">
        <span className="font-medium">{source.name}</span>
        <span className="text-ink-secondary"> → </span>
        <span className="font-medium">{target.name}</span>
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
          edge.state === "running"
            ? "bg-success/15 text-success"
            : edge.state === "queued"
              ? "bg-warning/15 text-warning"
              : "bg-control text-ink-secondary",
        )}
      >
        {edge.state === "running" ? "Live" : edge.state === "queued" ? "Queued" : edge.lastAt ? formatTime(edge.lastAt) : "Linked"}
      </span>
    </button>
  );
}

interface SectionContextResponse {
  section: string;
  label: string;
  text: string;
  updatedAt: number | null;
  maxBytes: number;
}

function SectionContextDialog({ section, label, onClose }: { section: string; label: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const onCloseRef = useRef(onClose);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [maxBytes, setMaxBytes] = useState(24_000);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = text !== savedText;
  const bytes = useMemo(() => new TextEncoder().encode(text).byteLength, [text]);
  onCloseRef.current = onClose;
  savingRef.current = saving;
  dirtyRef.current = dirty;

  const requestClose = useCallback(() => {
    if (savingRef.current) return;
    if (dirtyRef.current && !window.confirm("Discard unsaved changes to this shared context?")) return;
    onCloseRef.current();
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [requestClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api(`/api/section-context?section=${encodeURIComponent(section)}`)
      .then((result: SectionContextResponse) => {
        if (cancelled) return;
        setText(result.text);
        setSavedText(result.text);
        setUpdatedAt(result.updatedAt);
        setMaxBytes(result.maxBytes);
        window.setTimeout(() => textareaRef.current?.focus(), 0);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  const save = async () => {
    if (bytes > maxBytes) return;
    setSaving(true);
    setError(null);
    try {
      const result: SectionContextResponse = await api(
        `/api/section-context?section=${encodeURIComponent(section)}`,
        { method: "PUT", body: JSON.stringify({ text }) },
      );
      setSavedText(result.text);
      setText(result.text);
      setUpdatedAt(result.updatedAt);
      setMaxBytes(result.maxBytes);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && requestClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desk-section-context-title"
        tabIndex={-1}
        className="flex max-h-[min(680px,calc(100dvh-2rem))] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-hairline/50 bg-panel shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline/40 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-accent" />
              <h2 id="desk-section-context-title" className="text-[18px] font-semibold text-ink">
                {label} shared context
              </h2>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              Shown to every folk in this section at the start of a turn.
            </p>
          </div>
          <button type="button" onClick={requestClose} disabled={saving} className="rounded-lg p-2 text-ink-secondary hover:bg-raised hover:text-ink">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-ink-secondary">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[240px] w-full resize-y rounded-xl border border-hairline/50 bg-card px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent"
              placeholder={"Goals\n- …\n\nDecisions\n- …"}
            />
          )}
          {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-hairline/40 px-6 py-4">
          <span className="text-[11.5px] text-ink-secondary">
            {bytes.toLocaleString()} / {maxBytes.toLocaleString()} bytes
            {updatedAt ? ` · saved ${formatTime(updatedAt)}` : ""}
            {dirty ? " · unsaved" : ""}
          </span>
          <button
            type="button"
            disabled={saving || !dirty || bytes > maxBytes}
            onClick={() => void save()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-fg disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/** Human HQ: work queue + live crew map (former Folks radar) in one place. */
export function DeskPage() {
  const { state, dispatch } = useStore();
  const [snapshot, setSnapshot] = useState<FolksRadarSnapshot>(EMPTY_FOLKS_RADAR_SNAPSHOT);
  const [refreshing, setRefreshing] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [contextEditor, setContextEditor] = useState<{ section: string; label: string } | null>(null);

  const desk = useMemo(() => buildDesk(state.bots, state.groups), [state.bots, state.groups]);
  const botsById = useMemo(() => new Map(state.bots.map((bot) => [bot.id, bot])), [state.bots]);
  const bots = useMemo(() => state.bots.filter((bot) => !bot.hidden), [state.bots]);
  const sections = useMemo(() => buildFolksRadarSections(bots), [bots]);
  const edges = useMemo(() => buildFolksRadarEdges(bots, snapshot), [bots, snapshot]);

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      setSnapshot(await api("/api/team-map"));
      setMapError(null);
    } catch (requestError) {
      setMapError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 3_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const attention = desk.needsYou.length;
  const working = desk.working.length;
  const unread = desk.unread.length;

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-app text-ink">
      <header className="shrink-0 border-b border-hairline/40 px-6 py-5 max-md:pl-12 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Inbox size={18} />
              </span>
              <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Desk</h1>
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10.5px] font-medium text-success">
                <Radio size={10} /> Live
              </span>
            </div>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink-secondary">
              Your command center — approvals waiting on you, live turns, unread updates, and the crew map with
              handoffs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh(true)}
            disabled={refreshing}
            className="rounded-xl border border-hairline/50 bg-card p-2.5 text-ink-secondary hover:bg-raised hover:text-ink disabled:opacity-50"
            aria-label="Refresh desk"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="mt-5 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            [bots.length, "Folks", "text-ink"],
            [attention, "Needs you", attention ? "text-warning" : "text-ink"],
            [working, "Working", working ? "text-success" : "text-ink"],
            [unread, "Unread", unread ? "text-accent" : "text-ink"],
          ].map(([value, label, tone]) => (
            <div key={String(label)} className="rounded-2xl border border-hairline/40 bg-panel px-3.5 py-3">
              <div className={cn("text-[20px] font-semibold tabular-nums", tone)}>{value}</div>
              <div className="text-[11.5px] text-ink-secondary">{label}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-7">
            <div>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-secondary">
                Needs attention
              </h2>
              <div className="space-y-6">
                {attention === 0 && working === 0 && unread === 0 && (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-hairline/40 bg-gradient-to-b from-card to-panel px-6 py-12 text-center">
                    <img
                      src="/openfolk.png"
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-xl"
                      draggable={false}
                    />
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-text">
                        OpenFolks
                      </div>
                      <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                        Your Desk is clear
                      </div>
                      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-secondary">
                        Folks do real work here — approvals and handoffs land on the Desk instead of vanishing into one
                        chat thread.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "togglePlugins", open: true, tab: "folks" })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white"
                      >
                        <Store size={14} />
                        Browse Marketplace
                      </button>
                      {bots.length === 0 && (
                        <p className="w-full text-[12px] text-ink-secondary">
                          Or create a folk from the sidebar to staff your crew.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <QueueSection
                  title="Needs you"
                  hint="Approvals, questions, and blocked turns"
                  empty="Nothing waiting on you."
                  count={desk.needsYou.length}
                >
                  {desk.needsYou.map((item) => (
                    <DeskRow key={item.id} item={item} bot={botsById.get(item.botId)} tone="needs-you" />
                  ))}
                </QueueSection>
                <QueueSection title="Working now" empty="Nobody is mid-turn." count={desk.working.length}>
                  {desk.working.map((item) => (
                    <DeskRow key={item.id} item={item} bot={botsById.get(item.botId)} tone="working" />
                  ))}
                </QueueSection>
                <QueueSection title="Unread" empty="You're caught up." count={desk.unread.length}>
                  {desk.unread.map((item) => (
                    <DeskRow key={item.id} item={item} bot={botsById.get(item.botId)} tone="unread" />
                  ))}
                </QueueSection>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                    Crew map
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-ink-secondary">Who leads, who helps — tap anyone to open.</p>
                </div>
              </div>
              {mapError && (
                <div className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                  {mapError}
                </div>
              )}
              <div className="min-w-0 space-y-3">
                {sections.map((section) => (
                  <CrewSectionCard
                    key={section.key || "__general__"}
                    name={section.name}
                    chiefs={section.chiefs}
                    members={section.members}
                    onOpenContext={() => setContextEditor({ section: section.key, label: section.name })}
                  />
                ))}
                {sections.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-hairline/50 bg-panel/50 px-4 py-10 text-center text-[13px] text-ink-secondary">
                    No folks yet — create one or import a crew from Marketplace.
                  </div>
                )}
              </div>
            </div>

            <section className="min-w-0">
              <div className="mb-2.5">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                  Handoffs
                </h2>
                <p className="mt-0.5 text-[11.5px] text-ink-secondary">Live and recent folk-to-folk work.</p>
              </div>
              <div className="space-y-1.5">
                {edges.slice(0, 12).map((edge) => (
                  <EdgeRow key={`${edge.sourceBotId}:${edge.targetBotId}`} edge={edge} bots={bots} />
                ))}
                {edges.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-hairline/50 bg-panel/40 px-4 py-6 text-center text-[12.5px] text-ink-secondary">
                    No handoffs yet. When a chief delegates, it shows up here.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {contextEditor && (
        <SectionContextDialog
          section={contextEditor.section}
          label={contextEditor.label}
          onClose={() => setContextEditor(null)}
        />
      )}
    </main>
  );
}
