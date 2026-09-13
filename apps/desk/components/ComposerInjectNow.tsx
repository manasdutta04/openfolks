import { ArrowUp } from "lucide-react";

/** A mid-turn send is waiting: the composer can interrupt so those words
 * run now instead of after the current turn finishes. */
export function composerCanInjectNow(busy: boolean, locked: boolean, pendingCount: number): boolean {
  return busy && !locked && pendingCount > 0;
}

/** Green send control shown while a queued message is waiting. Clicking it
 * interrupts the live turn so the queued words drain immediately. */
export function ComposerInjectNow({ onInject }: { onInject: () => void }) {
  return (
    <>
      <span className="whitespace-nowrap pr-0.5 text-[13px] font-medium text-success">inject now</span>
      <button
        type="button"
        onClick={onInject}
        aria-label="Inject queued message now"
        title="Interrupt this turn and send the queued message now"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success hover:brightness-110"
      >
        <ArrowUp size={17} />
      </button>
    </>
  );
}
