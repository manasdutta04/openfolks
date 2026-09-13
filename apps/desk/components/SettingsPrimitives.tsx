import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  className,
  size = "md",
  ...props
}: Omit<ComponentProps<"button">, "children" | "role" | "aria-checked"> & {
  checked: boolean;
  size?: "sm" | "md";
}) {
  const compact = size === "sm";
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative shrink-0 rounded-full transition-colors disabled:opacity-40",
        compact ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-accent" : "bg-control",
        className,
      )}
    >
      <span
        className={cn(
          "absolute rounded-full bg-white transition-all",
          compact ? "top-[2px] h-4 w-4" : "top-[3px] h-[18px] w-[18px]",
          checked
            ? compact
              ? "left-[18px]"
              : "left-[21px]"
            : "left-[3px]",
        )}
      />
    </button>
  );
}

export function Card({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline/30 bg-card/90 p-4">
      {title && <div className="text-[14.5px] font-semibold tracking-tight text-ink">{title}</div>}
      {subtitle && (
        <div
          className={
            title
              ? "mt-0.5 text-[12.5px] leading-relaxed text-ink-secondary"
              : "text-[12.5px] leading-relaxed text-ink-secondary"
          }
        >
          {subtitle}
        </div>
      )}
      {children && <div className={title || subtitle ? "mt-3.5" : undefined}>{children}</div>}
    </div>
  );
}

/** A command the user is meant to run, with one-click copy. */
export function CommandLine({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard permission can be denied; leave the button unchanged */
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-inset px-3 py-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-ink">
        {command}
      </code>
      <button
        onClick={() => void copy()}
        aria-label="Copy command"
        className="shrink-0 rounded p-1 text-ink-secondary hover:bg-raised hover:text-ink"
      >
        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      </button>
    </div>
  );
}
