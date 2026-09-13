import { describe, expect, it } from "vitest";
import { buildDesk, deskNeedsYouCount } from "./desk";
import type { Bot, Group, Message } from "@/state/store";

function bot(partial: Partial<Bot> & Pick<Bot, "id" | "name">): Bot {
  return {
    threadId: `${partial.id}-thread`,
    title: "",
    description: "",
    notifications: true,
    color: "blue",
    unread: false,
    modelSelection: { instanceId: "i", model: "m" },
    messages: [],
    ...partial,
  };
}

function approval(id: string, at = 100): Message {
  return {
    id,
    role: "bot",
    kind: "options",
    at,
    text: "",
    card: {
      requestId: `req-${id}`,
      tool: "Bash",
      title: "Run a command?",
      subtitle: "ls -la",
      options: ["Allow", "Deny"],
    },
  };
}

describe("buildDesk", () => {
  it("collects approvals and waiting folks into needs-you", () => {
    const summary = buildDesk([
      bot({
        id: "a",
        name: "Alpha",
        messages: [approval("1", 50)],
      }),
      bot({
        id: "b",
        name: "Beta",
        activity: "waiting-on-you",
        title: "Needs a decision",
      }),
    ]);
    expect(summary.needsYou.map((item) => item.botName)).toEqual(["Alpha", "Beta"]);
    expect(deskNeedsYouCount(summary)).toBe(2);
  });

  it("lists working folks and unread without double-counting waiting", () => {
    const summary = buildDesk([
      bot({ id: "w", name: "Worker", busy: true, activity: "working" }),
      bot({ id: "u", name: "Unread", unread: true }),
      bot({
        id: "wait",
        name: "Waiter",
        unread: true,
        activity: "waiting-on-you",
      }),
    ]);
    expect(summary.working).toHaveLength(1);
    expect(summary.unread.map((item) => item.botName)).toEqual(["Unread"]);
    expect(summary.needsYou.map((item) => item.botName)).toEqual(["Waiter"]);
  });

  it("includes busy rooms under working", () => {
    const groups = [
      {
        id: "g1",
        threadId: "g1-thread",
        name: "Job Search",
        memberIds: ["a"],
        defaultResponder: { kind: "everyone" },
        bulletin: "",
        unread: false,
        createdAt: 1,
        busyBotId: "a",
        messages: [],
      } satisfies Group,
    ];
    const summary = buildDesk([bot({ id: "a", name: "Scout", busy: true, activity: "working" })], groups);
    expect(summary.working.some((item) => item.botName === "Job Search")).toBe(true);
  });
});
