import type { FolkId } from "@/lib/folks";

export type Msg =
  | { kind: "text"; from: "you" | "folk"; text: string }
  | { kind: "steps"; lines: [string, string][] }
  | { kind: "routine"; name: string }
  | { kind: "handoff"; a: FolkId; b: FolkId; text: string };

export interface Thread {
  id: FolkId;
  preview: string;
  time: string;
  messages: Msg[];
}

const t = (from: "you" | "folk", text: string): Msg => ({ kind: "text", from, text });

/** Original copy, written for OpenFolks. */
export const THREADS: Thread[] = [
  {
    id: "outbound",
    preview: "Done.",
    time: "7:11 PM",
    messages: [
      t("you", "Build me a list of 50 accounts that look like our best customers and draft the first touch."),
      t("folk", "On it. I'll use my own computer so nothing touches yours."),
      {
        kind: "steps",
        lines: [
          ["Salesforce", "list pulled · 52 accounts"],
          ["Lookalikes", "3 segments scored"],
          ["LinkedIn", "4 profiles skipped · recently contacted"],
          ["Sequencer", "36 drafts queued · 0 sent"],
        ],
      },
      { kind: "handoff", a: "inbox", b: "chief", text: "sent over the Acme + Globex threads and flagged the priority accounts. Both are folded into tonight's list." },
      t("folk", "The 36 drafts are waiting in the queue with recipient, opener and a Draft badge on each. Nothing goes out until you've had a look."),
      t("you", "The top 10 look good. Send it. Run this every week."),
      { kind: "routine", name: "Overnight outbound" },
      t("folk", "Done."),
    ],
  },
  {
    id: "chief",
    preview: "booked the venue and sent the confirmation around.",
    time: "Yesterday",
    messages: [
      t("you", "Find a venue for the team offsite, 12 people, first week of next month."),
      t("folk", "Three options under budget. The lakeside one has the AV you asked for and a free cancellation window."),
      t("you", "Book the lakeside one."),
      t("folk", "Booked. Confirmation is in your inbox and I sent the details to everyone attending."),
    ],
  },
  {
    id: "inbox",
    preview: "sent. inbox at zero, 5 drafts parked for tomorrow.",
    time: "4:12 PM",
    messages: [
      t("you", "Clear my inbox. Reply to anything routine, park anything that needs me."),
      t("folk", "14 threads. 9 routine replies sent in your voice, 5 drafted and parked for tomorrow, 0 left."),
      t("you", "Nice. Keep doing that every weekday morning."),
      { kind: "routine", name: "Weekday inbox zero" },
    ],
  },
  {
    id: "scout",
    preview: "3 intros drafted in your voice, held for your ok.",
    time: "11:12 AM",
    messages: [
      t("you", "Find three senior designers who've shipped a design system, and draft an intro to each."),
      t("folk", "Found three strong fits. Intros are drafted in your voice and held for your ok, nothing is sent."),
    ],
  },
  {
    id: "books",
    preview: "report filed. 9 receipts, nothing outstanding.",
    time: "3:12 PM",
    messages: [
      t("you", "File this month's expenses."),
      t("folk", "Report filed. 9 receipts matched, 0 missing, nothing outstanding."),
    ],
  },
  {
    id: "dev",
    preview: "fixed the failing checkout test, PR is up for review.",
    time: "1:12 PM",
    messages: [
      t("you", "The checkout test is flaky on CI. Can you sort it?"),
      {
        kind: "steps",
        lines: [
          ["Planner", "reproduced · race in the cart fixture"],
          ["Builder", "fix applied · 3 runs green"],
          ["Reviewer", "diff reviewed · no regressions"],
        ],
      },
      t("folk", "Fixed. The fixture was reading before the cart settled. PR is up for review."),
    ],
  },
];

interface Reply {
  match: RegExp;
  text: string;
}

const REPLIES: Reply[] = [
  { match: /inbox|email|mail|reply/i, text: "I'll triage it: reply to anything routine, draft the rest in your voice and hold those for your ok. Want it as a weekday routine?" },
  { match: /report|weekly|summary|expens/i, text: "Pulling the numbers now. I'll leave a short summary plus the raw sheet, and note anything that looks off." },
  { match: /bug|test|fix|code|deploy|pr\b/i, text: "I'll reproduce it first, then make a focused fix, run the checks and open a PR for your review." },
  { match: /research|compet|market|find|look up/i, text: "Starting research. I'll gather sources, separate fact from speculation and return a short brief with the open questions." },
  { match: /price|cost|free|pay|licen/i, text: "OpenFolks itself is free and MIT-licensed. You only pay the providers whose models you plug in." },
  { match: /download|install|windows|mac|linux|try/i, text: "You can have this running on your own machine in a minute. The download button is just below." },
  { match: /routine|schedule|every|daily|weekday/i, text: "Done: I've set that up as a routine. Each run starts fresh, leaves a receipt and pings you only if it needs you." },
  { match: /hello|hi\b|hey|who are you/i, text: "Hi, I'm a folk: an AI teammate with my own role, memory and computer. Give me a task and I'll come back with finished work." },
];

const FALLBACK =
  "Got it. On the real Desk I'd start right now, keep working while you do something else, and come back when I need your approval.";

export function replyFor(input: string): string {
  return REPLIES.find((r) => r.match.test(input))?.text ?? FALLBACK;
}

export const SUGGESTIONS = [
  "Clear my inbox every weekday",
  "Fix the flaky checkout test",
  "Research three competitors",
];
