import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type { RoutineRunCardData } from "../../../shared/routine-run";
import type { Message } from "@/state/store";

const DETAIL_LIMIT = 280;

const COPY = {
  queued: { label: "Queued", tone: "text-ink-secondary", border: "border-hairline/45" },
  running: { label: "Running", tone: "text-accent", border: "border-accent/30" },
  waiting: { label: "Needs your input", tone: "text-warning", border: "border-warning/35" },
  completed: { label: "Completed", tone: "text-success", border: "border-success/30" },
  failed: { label: "Failed", tone: "text-danger", border: "border-danger/35" },
  cancelled: { label: "Cancelled", tone: "text-ink-secondary", border: "border-hairline/45" },
  missed: { label: "Missed", tone: "text-danger", border: "border-danger/35" },
} satisfies Record<
  RoutineRunCardData["status"],
  { label: string; tone: string; border: string }
>;

function compactDetail(value: string | undefined): string {
  const clean = value?.replace(/\s+/g, " ").trim() ?? "";
  return clean.length > DETAIL_LIMIT ? `${clean.slice(0, DETAIL_LIMIT - 1).trimEnd()}…` : clean;
}

/** A lifecycle receipt can outlive its isolated execution task. Only offer
 * navigation while the task is still present in the owning bot's task list. */
export function hasRoutineExecutionTask(
  tasks: ReadonlyArray<{ threadId: string }> | undefined,
  executionThreadId: string | undefined,
): executionThreadId is string {
  return Boolean(
    executionThreadId && tasks?.some((task) => task.threadId === executionThreadId),
  );
}

function StatusIcon({ status }: { status: RoutineRunCardData["status"] }) {
  const className = "size-4 shrink-0";
  switch (status) {
    case "running":
      return <Loader2 aria-hidden="true" className={cn(className, "animate-spin text-accent")} />;
    case "waiting":
      return <ShieldAlert aria-hidden="true" className={cn(className, "text-warning")} />;
    case "completed":
      return <CheckCircle2 aria-hidden="true" className={cn(className, "text-success")} />;
    case "failed":
    case "missed":
      return <CircleAlert aria-hidden="true" className={cn(className, "text-danger")} />;
    case "cancelled":
      return <XCircle aria-hidden="true" className={cn(className, "text-ink-secondary")} />;
    default:
      return <CalendarClock aria-hidden="true" className={cn(className, "text-ink-secondary")} />;
  }
}

export function RoutineRunCard({
  message,
  onOpen,
}: {
  message: Message;
  /** Opens the isolated execution task; absent when it no longer exists. */
  onOpen?: () => void;
}) {
  const run = message.routineRun;
  // Newer computers can send this message kind to an older or partially
  // hydrated client. Keep the concise text fallback visible instead of
  // leaving an unexplained hole in the conversation.
  if (!run) {
    const fallback = compactDetail(message.text);
    return fallback ? (
      <div className="w-fit max-w-[min(42rem,88%)] rounded-2xl bg-card px-4 py-2.5 text-[14px] leading-relaxed text-ink">
        {fallback}
      </div>
    ) : null;
  }

  const copy = COPY[run.status];
  const detail = compactDetail(
    run.status === "failed" || run.status === "missed"
      ? (run.error ?? run.summary)
      : (run.summary ?? run.error),
  );
  const actionLabel = run.status === "waiting" ? "Review" : "Open run";

  return (
    <section
      aria-label={`${run.routineName} routine run: ${copy.label}`}
      className={cn(
        "w-full max-w-[680px] rounded-2xl border bg-card px-3.5 py-3 shadow-sm",
        copy.border,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-inset">
          <StatusIcon status={run.status} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="truncate text-[13.5px] font-semibold text-ink">{run.routineName}</h3>
            <span aria-live="polite" className={cn("text-[11.5px] font-medium", copy.tone)}>
              {copy.label}
            </span>
          </div>
          {detail && <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-secondary">{detail}</p>}
        </div>
        {onOpen && run.executionThreadId && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`${actionLabel} for ${run.routineName}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
              run.status === "waiting"
                ? "bg-warning/15 text-warning hover:bg-warning/25"
                : "bg-raised text-ink-secondary hover:bg-raised-hover hover:text-ink",
            )}
          >
            {actionLabel}
            <ExternalLink aria-hidden="true" size={12} />
          </button>
        )}
      </div>
    </section>
  );
}
