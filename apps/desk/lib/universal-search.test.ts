import { describe, expect, it } from "vitest";

import {
  collectActionHits,
  collectFileHits,
  collectLinkHits,
  collectRoutineHits,
} from "./universal-search";
import type { Bot, Group } from "@/state/store";
import type { Routine } from "@/lib/routines";

const bot = (overrides: Partial<Bot> & Pick<Bot, "id" | "name" | "messages">): Bot =>
  ({
    threadId: `${overrides.id}-thread`,
    title: "",
    description: "",
    notifications: true,
    color: "green",
    unread: false,
    modelSelection: { instanceId: "x", model: "y" },
    ...overrides,
  }) as Bot;

describe("universal-search collectors", () => {
  it("finds attached files in loaded transcripts", () => {
    const bots = [
      bot({
        id: "b1",
        name: "Ada",
        messages: [
          {
            id: "m1",
            role: "user",
            kind: "text",
            at: 1,
            text: 'please review\n\n<attached-file path="/tmp/brief.pdf" />',
          },
        ],
      }),
    ];
    const hits = collectFileHits(bots, [], [], "brief");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.name).toBe("brief.pdf");
    expect(hits[0]?.botId).toBe("b1");
  });

  it("finds links in transcripts and search snippets", () => {
    const bots = [
      bot({
        id: "b1",
        name: "Ada",
        messages: [
          {
            id: "m1",
            role: "bot",
            kind: "text",
            at: 1,
            text: "See https://example.com/docs for more.",
          },
        ],
      }),
    ];
    const fromLocal = collectLinkHits(bots, [] as Group[], [], "example");
    expect(fromLocal.map((hit) => hit.url)).toEqual(["https://example.com/docs"]);

    const fromSearch = collectLinkHits(
      [],
      [],
      [
        {
          name: "Ada",
          botId: "b1",
          threadId: "t1",
          messageId: "m2",
          role: "bot",
          kind: "text",
          at: 1,
          snippet: "open https://openfolks.app/now",
          matchStart: 5,
          matchLength: 4,
          onActivePath: true,
        },
      ],
      "openfolks",
    );
    expect(fromSearch[0]?.url).toBe("https://openfolks.app/now");
  });

  it("ranks routines and actions by query", () => {
    const routines = [
      { id: "r1", name: "Morning brief", prompt: "summarize inbox", botId: "b1" },
      { id: "r2", name: "Weekly cleanup", prompt: "archive old tasks", botId: "b1" },
    ] as Routine[];
    expect(collectRoutineHits(routines, "morn").map((routine) => routine.id)).toEqual(["r1"]);

    const actions = [
      { id: "desk", title: "Open Desk", subtitle: "queue", keywords: ["inbox"] },
      { id: "new-folk", title: "New Folk", subtitle: "create", keywords: ["bot"] },
    ];
    expect(collectActionHits(actions, "desk").map((action) => action.id)).toEqual(["desk"]);
    expect(collectActionHits(actions, "bot").map((action) => action.id)).toEqual(["new-folk"]);
  });
});
