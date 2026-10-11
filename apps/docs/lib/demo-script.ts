import type { FolkId } from "@/lib/folks";

export type Msg =
  | { kind: "text"; from: "you" | "folk"; text: string }
  | { kind: "worked"; seconds: number }
  | { kind: "messaged"; to: FolkId }
  | { kind: "steps"; lines: [string, string][] }
  | { kind: "routine"; name: string };

export interface Thread {
  id: FolkId;
  messages: Msg[];
}

const you = (text: string): Msg => ({ kind: "text", from: "you", text });
const folk = (text: string): Msg => ({ kind: "text", from: "folk", text });

/** Original copy, written for OpenFolks. */
export const THREADS: Thread[] = [
  {
    id: "assistant",
    messages: [
      you("Spin up two folks: one for the gym, one for eye care and general health."),
      { kind: "worked", seconds: 16 },
      folk(
        "Done. Two specialists are now on your team:\n• @Coach, gym and fitness: plans your weekly workouts and gym sessions.\n• @Vision, eye care and health: a daily checklist for screen habits, sleep and routine.\nI asked each of them to draft a starter plan. Tell me your goals and your screen habits so they can adjust it.",
      ),
      { kind: "messaged", to: "coach" },
      { kind: "messaged", to: "vision" },
      folk(
        "@Vision replied with a starter routine: every 20 minutes look at something 20 feet away for 20 seconds, blink fully while you read, and keep lubricating drops nearby. It is general guidance, not medical advice.",
      ),
    ],
  },
  {
    id: "coach",
    messages: [
      you("Draft a three-day gym plan for me."),
      { kind: "worked", seconds: 9 },
      folk("Day 1 push, day 2 pull, day 3 legs, with five exercises each and a rest day between them. Tell me what equipment you have and I will adjust the plan."),
    ],
  },
  {
    id: "vision",
    messages: [
      you("Remind me to take eye breaks on weekdays."),
      { kind: "routine", name: "Eye break reminders" },
      folk("Set. I will prompt you every 20 minutes between 9:00 and 18:00 on weekdays, and each run leaves a receipt."),
    ],
  },
  {
    id: "inbox",
    messages: [
      you("Clear my inbox. Reply to anything routine and park anything that needs me."),
      { kind: "worked", seconds: 41 },
      folk("14 threads. 9 routine replies sent in your voice, 5 drafted and parked for tomorrow, none left."),
      you("Good. Do that every weekday morning."),
      { kind: "routine", name: "Weekday inbox" },
    ],
  },
  {
    id: "dev",
    messages: [
      you("The checkout test fails now and then on CI. Can you sort it out?"),
      {
        kind: "steps",
        lines: [
          ["Planner", "reproduced it: a race in the cart fixture"],
          ["Builder", "fix applied, three runs passed"],
          ["Reviewer", "diff reviewed, no regressions"],
        ],
      },
      folk("Fixed. The fixture read the cart before it had settled. A pull request is open for review."),
    ],
  },
];

interface Reply {
  match: RegExp;
  text: string;
}

const REPLIES: Reply[] = [
  { match: /inbox|email|mail|reply/i, text: "I will triage it: reply to anything routine, draft the rest in your voice and hold those for your approval. Should I make this a weekday routine?" },
  { match: /report|weekly|summary|expens/i, text: "Pulling the numbers now. I will leave a short summary and the raw sheet, and note anything that looks off." },
  { match: /bug|test|fix|code|deploy|pr\b/i, text: "I will reproduce it first, make a focused fix, run the checks and open a pull request for your review." },
  { match: /research|compet|market|find|look up/i, text: "Starting research. I will gather sources, separate fact from guesswork and send back a short brief with the open questions." },
  { match: /price|cost|free|pay|licen/i, text: "OpenFolks is free under the MIT License. You only pay the providers whose models you connect." },
  { match: /download|install|windows|mac|linux|try/i, text: "You can have this running on your own machine in a few minutes. The download button is further down this page." },
  { match: /routine|schedule|every|daily|weekday/i, text: "Done. I set that up as a routine. Each run starts fresh, leaves a receipt, and I only message you if I need you." },
  { match: /hello|hi\b|hey|who are you/i, text: "Hi. I am a folk: an AI teammate with a role, notes it keeps, and a computer to work on. Give me a task and I will report back when it is done." },
];

const FALLBACK =
  "Understood. In the real app I would start now, keep working while you do something else, and come back when I need your approval.";

export function replyFor(input: string): string {
  return REPLIES.find((r) => r.match.test(input))?.text ?? FALLBACK;
}

export const SUGGESTIONS = [
  "Clear my inbox every weekday",
  "Fix the flaky checkout test",
  "Research three competitors",
];
