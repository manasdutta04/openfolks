// Landing on a message: after a search hit, scroll the row into view and
// flash it. Rows are wrapped in `display: contents` (no box of their own),
// so the wrapper carries data-mid and its last child — the bubble/chip,
// after any day separator — is what gets scrolled and highlighted.
import { useEffect } from "react";
import { api, useStore, type Action, type AppState } from "@/state/store";
import type { SearchHit } from "@/lib/search-hit";

const FLASH_CLASSES = ["ring-2", "ring-accent/70", "rounded-2xl", "transition-shadow"];

/** Select and prepare the exact conversation represented by a search hit. */
export async function landOnSearchHit(
  hit: SearchHit,
  state: Pick<AppState, "bots" | "groups">,
  dispatch: React.Dispatch<Action>,
): Promise<void> {
  const ownerId = hit.botId ?? hit.groupId;
  const bot = hit.botId ? state.bots.find((candidate) => candidate.id === hit.botId) : undefined;
  const group = hit.groupId ? state.groups.find((candidate) => candidate.id === hit.groupId) : undefined;
  if (!ownerId || (!bot && !group)) throw new Error("That conversation is no longer available.");

  dispatch({ type: "select", id: ownerId });
  if (bot && bot.threadId !== hit.threadId) {
    const result = await api(`/api/bots/${bot.id}/tasks/${hit.threadId}`, { method: "POST" });
    if (result?.bot) dispatch({ type: "taskSwitched", bot: result.bot });
  }
  if (group && group.threadId !== hit.threadId) {
    const result = await api(`/api/groups/${group.id}/tasks/${hit.threadId}`, { method: "POST" });
    if (result?.group) dispatch({ type: "groupPatched", group: result.group });
  }
  if (bot && !hit.onActivePath) {
    const branch = await api(`/api/bots/${bot.id}/active-branch`, {
      method: "POST",
      body: JSON.stringify({ messageId: hit.messageId }),
    });
    if (branch?.activeLeafId) {
      dispatch({ type: "threadActive", threadId: hit.threadId, activeLeafId: branch.activeLeafId });
    }
  }
  dispatch({ type: "focusMessage", threadId: hit.threadId, messageId: hit.messageId });
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Nearest ancestor that actually scrolls — not the window/shell. */
function nearestScrollParent(from: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = from.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Center `target` inside its transcript scroller only. Native scrollIntoView
 * also scrolls outer ancestors (the app shell), which on Electron leaves a
 * permanent black gap under the sidebar + composer.
 */
function scrollTargetIntoScroller(
  target: HTMLElement,
  behavior: ScrollBehavior = "auto",
): void {
  const scroller = nearestScrollParent(target);
  if (!scroller) return;
  const targetRect = target.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  const delta =
    targetRect.top + targetRect.height / 2 - (scrollerRect.top + scrollerRect.height / 2);
  const nextTop = Math.max(0, scroller.scrollTop + delta);
  if (behavior === "smooth" && typeof scroller.scrollTo === "function") {
    scroller.scrollTo({ top: nextTop, behavior: "smooth" });
  } else {
    scroller.scrollTop = nextTop;
  }
  // Belt-and-suspenders: undo any window/shell scroll scrollIntoView may have
  // already applied on a previous attempt or via a browser quirk.
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const root = document.getElementById("root");
  if (root) root.scrollTop = 0;
}

export function useFocusMessage(threadId: string, ready: boolean) {
  const { state, dispatch } = useStore();
  const focus = state.focusMessage;
  useEffect(() => {
    if (!focus || focus.consumed || focus.threadId !== threadId || !ready) return;
    // messages may land a tick after the task switch; try briefly
    let tries = 0;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let flashTimer: ReturnType<typeof setTimeout> | null = null;
    let target: HTMLElement | null = null;
    const attempt = () => {
      if (cancelled) return;
      try {
        const wrapper = document.querySelector<HTMLElement>(`[data-mid="${cssEscape(focus.messageId)}"]`);
        // Prefer the bubble/chip, not a day separator that may share the
        // display:contents wrapper (lastElementChild alone is brittle there).
        const children = wrapper ? ([...wrapper.children] as HTMLElement[]) : [];
        target =
          children.find((el) => el.dataset.daySep == null && el.dataset.mid == null) ??
          (wrapper?.lastElementChild as HTMLElement | null) ??
          null;
        if (!target) {
          if (tries++ < 20) retryTimer = setTimeout(attempt, 100);
          return;
        }
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        scrollTargetIntoScroller(target, reducedMotion ? "auto" : "smooth");
        target.classList.add(...FLASH_CLASSES);
        // Consume only after the target is mounted and the flash has begun.
        // `consumed` is intentionally not an effect dependency, so this active
        // flash survives the bookkeeping update while future remounts ignore it.
        dispatch({ type: "focusMessageConsumed", nonce: focus.nonce });
        flashTimer = setTimeout(() => target?.classList.remove(...FLASH_CLASSES), 1800);
      } catch (error) {
        console.error("focusMessage land failed", error);
        dispatch({ type: "focusMessageConsumed", nonce: focus.nonce });
      }
    };
    attempt();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (flashTimer) clearTimeout(flashTimer);
      target?.classList.remove(...FLASH_CLASSES);
    };
  }, [dispatch, focus?.nonce, focus?.threadId, focus?.messageId, threadId, ready]);
}
