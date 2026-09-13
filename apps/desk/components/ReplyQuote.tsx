import { CornerDownRight, X } from "lucide-react";

import { replyAuthor, replySnippet } from "@/lib/replies";
import type { Message } from "@/state/store";
import { cn } from "@/lib/cn";

export function ReplyQuote({
  message,
  fallbackName,
  onJump,
  onClear,
  compact = false,
}: {
  message: Message;
  fallbackName?: string;
  onJump?: () => void;
  onClear?: () => void;
  compact?: boolean;
}) {
  const author = replyAuthor(message, fallbackName);
  const snippet = replySnippet(message.text ?? "", compact ? 96 : 140);

  const content = (
    <>
      <CornerDownRight
        size={compact ? 11 : 13}
        className="mt-px shrink-0 text-ink-secondary"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">
        <span className="font-medium text-ink">{author}</span>
        <span className="text-ink-secondary"> · {snippet}</span>
      </span>
    </>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-2xl bg-inset/80",
        compact ? "px-2 py-1" : "px-2.5 py-1.5",
      )}
    >
      {onJump ? (
        <button
          type="button"
          onClick={onJump}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 text-left transition hover:opacity-90",
            compact ? "text-[11px]" : "text-[12.5px]",
          )}
          title="Jump to original message"
        >
          {content}
        </button>
      ) : (
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5",
            compact ? "text-[11px]" : "text-[12.5px]",
          )}
        >
          {content}
        </div>
      )}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Cancel reply"
          className="shrink-0 rounded-lg p-1 text-ink-secondary transition hover:bg-raised hover:text-ink"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
