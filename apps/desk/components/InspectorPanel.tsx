// Backstage: what a folk’s turns looked like under the chat — harness
// events live, plus the engine’s own protocol when a turn settles.
//
//   Live     — RuntimeEvent stream (turns, tools, approvals, errors)
//   Protocol — provider messages from the native tee on disk
//
// Logs already live under ~/.openfolks; this panel only reads them.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Radio, RefreshCw, X } from "lucide-react";
import { useStore, type Bot } from "@/state/store";
import { cn } from "@/lib/cn";
import { formatTime, toRows, type InspectorEntry, type InspectorPage, type InspectorRow } from "@/lib/inspector";
import { openLiveEvents } from "@/lib/live-events";
import type { RuntimeEvent } from "../../harness/contracts.ts";

type Lens = "events" | "raw";

const LENSES: Array<{ id: Lens; label: string; hint: string }> = [
  { id: "events", label: "Live", hint: "Harness turns, tools, and requests as they happen" },
  { id: "raw", label: "Protocol", hint: "Engine messages recorded for this thread" },
];

export function InspectorPanel({ bot }: { bot: Bot }) {
  const { dispatch } = useStore();
  const threadId = bot.threadId;
  const [lens, setLens] = useState<Lens>("events");
  const [page, setPage] = useState<InspectorPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const loadAbort = useRef<AbortController | null>(null);
  const managedRefresh = useRef<() => void>(() => {});

  const load = useCallback(async (): Promise<boolean> => {
    loadAbort.current?.abort();
    const controller = new AbortController();
    loadAbort.current = controller;
    try {
      const res = await fetch(`/api/threads/${threadId}/events?limit=400`, { signal: controller.signal });
      if (!res.ok) throw new Error(`${res.status}`);
      // SAFETY: this same-version renderer calls the harness's typed
      // inspector endpoint; malformed transport data is handled by catch.
      const next = (await res.json()) as InspectorPage;
      if (controller.signal.aborted) return false;
      setPage(next);
      setError(null);
      return true;
    } catch (e) {
      if (controller.signal.aborted) return false;
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      if (loadAbort.current === controller) loadAbort.current = null;
    }
  }, [threadId]);

  useEffect(() => {
    setPage(null);
    setExpanded(new Set());
    stickToBottom.current = true;
    void load();
    return () => loadAbort.current?.abort();
  }, [load]);

  useEffect(() => {
    let alive = true;
    let settle: ReturnType<typeof setTimeout> | null = null;
    let refreshGeneration = 0;
    let refreshing = false;
    const pendingRuntime: RuntimeEvent[] = [];

    const appendRuntime = (runtime: RuntimeEvent) => {
      setPage((prev) => {
        if (
          prev?.entries.some(
            (entry) => entry.kind === "runtime" && entry.data.eventId === runtime.eventId,
          )
        ) {
          return prev;
        }
        const entry: InspectorEntry = { kind: "runtime", at: runtime.createdAt, data: runtime };
        if (!prev) return { entries: [entry], total: { runtime: 1, native: 0 } };
        return { entries: [...prev.entries, entry], total: { ...prev.total, runtime: prev.total.runtime + 1 } };
      });
    };

    const flushPendingRuntime = () => {
      for (const runtime of pendingRuntime.splice(0)) appendRuntime(runtime);
    };

    const refresh = async (flushLiveOnFailure: boolean): Promise<boolean> => {
      const generation = ++refreshGeneration;
      refreshing = true;
      const loaded = await load();
      if (!alive || generation !== refreshGeneration) return false;
      refreshing = false;
      if (!loaded) {
        if (flushLiveOnFailure) flushPendingRuntime();
        return false;
      }
      flushPendingRuntime();
      return true;
    };
    const requestRefresh = () => void refresh(true);
    const refreshFromSnapshot = (): Promise<boolean> => {
      pendingRuntime.splice(0);
      return refresh(false);
    };
    managedRefresh.current = requestRefresh;

    const stopLive = openLiveEvents({
      screens: false,
      onSnapshotRequired: refreshFromSnapshot,
      onFrame: (frame) => {
        if (frame.kind !== "runtime") return;
        const event = frame.event;
        if (!event || Array.isArray(event) || Object(event) !== event) return;
        const runtime = event as RuntimeEvent;
        if (runtime.threadId !== threadId) return;
        if (refreshing) pendingRuntime.push(runtime);
        else appendRuntime(runtime);
        if (runtime.type === "turn.completed" || runtime.type === "runtime.error") {
          if (settle) clearTimeout(settle);
          settle = setTimeout(requestRefresh, 400);
        }
      },
    });
    return () => {
      alive = false;
      if (managedRefresh.current === requestRefresh) managedRefresh.current = () => {};
      stopLive();
      if (settle) clearTimeout(settle);
    };
  }, [threadId, load]);

  const entries = useMemo(
    () => (page ? page.entries.filter((e) => (lens === "raw" ? e.kind === "native" : e.kind === "runtime")) : []),
    [page, lens],
  );
  const rows = useMemo(() => toRows(entries), [entries]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [page?.entries.length, rows.length, lens]);
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const shown = entries.length;
  const total = lens === "raw" ? (page?.total.native ?? 0) : (page?.total.runtime ?? 0);
  const live = Boolean(bot.busy) && lens === "events";

  return (
    <aside className="animate-panel-in flex h-full w-[440px] shrink-0 flex-col border-l border-hairline/40 bg-panel">
      <div className="relative overflow-hidden border-b border-hairline/40 px-4 pb-3 pt-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_55%)]"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Radio size={14} strokeWidth={2.25} />
              </span>
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">Backstage</h2>
              {live && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[10.5px] font-medium text-success">
                  <span className="size-1.5 animate-pulse rounded-full bg-success" />
                  Live
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-ink-secondary">
              Behind <span className="font-medium text-ink">{bot.name}</span>&apos;s chat — turns,
              tools, and engine traffic for this thread.
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: "toggleInspector", open: false })}
            aria-label="Close Backstage"
            title="Close Backstage"
            className="relative shrink-0 rounded-md p-1 text-ink-secondary hover:bg-raised hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-3 flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Backstage lens"
            className="flex flex-1 rounded-full border border-hairline/40 bg-inset/80 p-0.5"
          >
            {LENSES.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={lens === item.id}
                title={item.hint}
                onClick={() => setLens(item.id)}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  lens === item.id
                    ? "bg-card text-ink shadow-sm"
                    : "text-ink-secondary hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => managedRefresh.current()}
            className="rounded-full border border-hairline/40 p-1.5 text-ink-secondary hover:bg-raised hover:text-ink"
            title="Reload from disk"
            aria-label="Reload from disk"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="relative mt-2.5 flex items-center justify-between text-[11px] text-ink-secondary">
          <span>
            {page
              ? shown < total
                ? `Showing latest ${shown} of ${total}`
                : `${shown} ${lens === "raw" ? "protocol" : "live"} ${shown === 1 ? "entry" : "entries"}`
              : "Loading thread tape…"}
          </span>
          {page && (
            <span className="tabular-nums text-ink-secondary/80">
              {page.total.runtime} live · {page.total.native} protocol
            </span>
          )}
        </div>
      </div>

      <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {error && (
          <div className="mb-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-[12.5px] text-danger">
            Couldn&apos;t load Backstage: {error}
          </div>
        )}
        {page && rows.length === 0 && !error && (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline/50 bg-inset/40 px-6 text-center">
            <Radio size={22} className="mb-3 text-ink-secondary/70" />
            <div className="text-[13px] font-medium text-ink">
              {lens === "raw" ? "No protocol yet" : "Quiet so far"}
            </div>
            <p className="mt-1 max-w-[16rem] text-[12px] leading-relaxed text-ink-secondary">
              {lens === "raw"
                ? "Engine messages show up here after a turn settles."
                : "Send a message and this tape fills as the folk works."}
            </p>
          </div>
        )}
        {rows.length > 0 && (
          <ol className="relative m-0 list-none space-y-0 p-0">
            <div
              aria-hidden
              className="absolute bottom-3 left-[11px] top-3 w-px bg-hairline/50"
            />
            {rows.map((row) => (
              <Row key={row.key} row={row} open={expanded.has(row.key)} onToggle={() => toggle(row.key)} />
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

function Row({ row, open, onToggle }: { row: InspectorRow; open: boolean; onToggle: () => void }) {
  return (
    <li className="relative pl-7">
      <span
        aria-hidden
        className={cn(
          "absolute left-[7px] top-[14px] size-[9px] rounded-full border-2 border-panel",
          row.tone === "error"
            ? "bg-danger"
            : row.tone === "boundary"
              ? "bg-accent"
              : row.kind === "native"
                ? "bg-accent/70"
                : "bg-ink-secondary/55",
        )}
      />
      <div
        className={cn(
          "mb-1.5 overflow-hidden rounded-xl border transition-colors",
          open ? "border-hairline/50 bg-card" : "border-transparent hover:border-hairline/35 hover:bg-card/70",
          row.tone === "error" && "border-danger/25 bg-danger/5",
          row.tone === "boundary" && !open && "bg-raised/35",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-start gap-2 px-2.5 py-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  row.kind === "native"
                    ? "bg-accent/15 text-accent"
                    : row.tone === "error"
                      ? "bg-danger/20 text-danger"
                      : "bg-inset text-ink-secondary",
                )}
              >
                {row.tag}
                {row.count > 1 ? ` ×${row.count}` : ""}
              </span>
              <span className="tabular-nums text-[10.5px] text-ink-secondary">{formatTime(row.at)}</span>
            </div>
            <div
              className={cn(
                "mt-1 text-[12.5px] leading-snug",
                row.tone === "error" ? "text-danger" : "text-ink",
              )}
            >
              {row.summary}
            </div>
          </div>
        </button>
        {open && (
          <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap break-all border-t border-hairline/30 bg-app/80 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink-secondary">
            {JSON.stringify(row.data, null, 2)}
          </pre>
        )}
      </div>
    </li>
  );
}
