import { visibleMessages, type Bot, type Group, type Message } from "@/state/store";

export type DeskItemKind = "needs-you" | "working" | "unread";

export type DeskItem = {
  id: string;
  kind: DeskItemKind;
  botId: string;
  botName: string;
  title: string;
  detail: string;
  at: number;
};

export type DeskSummary = {
  needsYou: DeskItem[];
  working: DeskItem[];
  unread: DeskItem[];
};

function latestMessageAt(bot: Bot): number {
  let latest = 0;
  for (const message of bot.messages) {
    if (message.at > latest) latest = message.at;
  }
  return latest;
}

function openApprovals(messages: Message[]) {
  return messages.filter(
    (m) => m.kind === "options" && m.card?.requestId && m.card.tool && !m.card.answered && !m.card.dismissed,
  );
}

function approvalTitle(message: Message): string {
  const cardTitle = message.card?.title?.trim();
  if (cardTitle) return cardTitle;
  if (message.card?.skillRequest) {
    return message.card.skillRequest.action === "update"
      ? "Update a learned skill"
      : "Enable a learned skill";
  }
  if (message.card?.routineRequest) return "Confirm a routine";
  return message.card?.tool ? `Approve ${message.card.tool}` : "Approval needed";
}

/** Cross-folk work queue — the human HQ OpenFolks adds on top of chat. */
export function buildDesk(bots: Bot[], groups: Group[] = []): DeskSummary {
  const visibleBots = bots.filter((bot) => !bot.hidden);
  const needsYou: DeskItem[] = [];
  const working: DeskItem[] = [];
  const unread: DeskItem[] = [];

  for (const bot of visibleBots) {
    const approvals = openApprovals(visibleMessages(bot));
    if (approvals.length > 0 || bot.activity === "waiting-on-you") {
      if (approvals.length > 0) {
        for (const message of approvals) {
          needsYou.push({
            id: `approval:${bot.id}:${message.card!.requestId}`,
            kind: "needs-you",
            botId: bot.id,
            botName: bot.name,
            title: approvalTitle(message),
            detail: message.card?.subtitle?.trim() || bot.title || "Waiting for your decision",
            at: message.at,
          });
        }
      } else {
        needsYou.push({
          id: `waiting:${bot.id}`,
          kind: "needs-you",
          botId: bot.id,
          botName: bot.name,
          title: "Waiting on you",
          detail: bot.title || "Open the conversation to continue",
          at: latestMessageAt(bot),
        });
      }
    }

    if (bot.activity === "working" || (bot.busy && bot.activity !== "waiting-on-you")) {
      working.push({
        id: `working:${bot.id}`,
        kind: "working",
        botId: bot.id,
        botName: bot.name,
        title: "Working",
        detail: bot.title || "Turn in progress",
        at: latestMessageAt(bot),
      });
    }

    if (bot.unread && bot.activity !== "waiting-on-you" && approvals.length === 0) {
      unread.push({
        id: `unread:${bot.id}`,
        kind: "unread",
        botId: bot.id,
        botName: bot.name,
        title: "Unread update",
        detail: bot.title || "New activity in this conversation",
        at: latestMessageAt(bot),
      });
    }
  }

  for (const group of groups) {
    if (!group.unread && !group.busyBotId) continue;
    if (group.busyBotId) {
      const worker = visibleBots.find((bot) => bot.id === group.busyBotId);
      working.push({
        id: `group-working:${group.id}`,
        kind: "working",
        botId: group.id,
        botName: group.name,
        title: "Room working",
        detail: worker ? `${worker.name} is active in this room` : "A folk is active in this room",
        at: Date.now(),
      });
    } else if (group.unread) {
      unread.push({
        id: `group-unread:${group.id}`,
        kind: "unread",
        botId: group.id,
        botName: group.name,
        title: "Unread room",
        detail: "New activity in this room",
        at: Date.now(),
      });
    }
  }

  const byRecency = (a: DeskItem, b: DeskItem) => b.at - a.at;
  return {
    needsYou: needsYou.sort(byRecency),
    working: working.sort(byRecency),
    unread: unread.sort(byRecency),
  };
}

export function deskNeedsYouCount(summary: DeskSummary): number {
  return summary.needsYou.length;
}
