import type { FolkId } from "@/lib/folks";

export type Msg =
  | { kind: "text"; from: "you" | "folk" | "peer"; text: string; name?: string }
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
/** Messages inside a folk chat: the leader on the right, the specialist on the left, no human involved. */
const lead = (text: string): Msg => ({ kind: "text", from: "peer", text, name: "Assistant" });
const coach = (text: string): Msg => ({ kind: "text", from: "folk", text, name: "Coach" });

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
      lead("You are now the gym folk. The user wants a starter plan: three days a week, no equipment details yet. Draft something I can show them."),
      { kind: "worked", seconds: 9 },
      coach("Draft ready. Day 1 push, day 2 pull, day 3 legs, five exercises each, a rest day between. I assumed a full gym."),
      lead("They have not said what equipment they have. Keep it simple and flag the assumption."),
      coach("Flagged. I added a note at the top: swap any lift for a dumbbell or bodyweight version if they train at home. The plan is saved to plan.md in my notes."),
      lead("Good. I will pass it on and ask about their equipment and goals."),
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

interface Persona {
  replies: Reply[];
  fallback: string;
  suggestions: string[];
}

const PERSONAS: Partial<Record<FolkId, Persona>> = {
  assistant: {
    replies: [
      { match: /gym|workout|fitness|train|exercise/i, text: "That belongs to @Coach. I will pass it on with what you told me and bring back the plan." },
      { match: /eye|screen|sleep|health/i, text: "That is @Vision's area. I will ask for a routine and keep it in your Desk." },
      { match: /inbox|email|mail/i, text: "@Inbox handles that. I will have it triage your mail and park anything that needs you." },
      { match: /bug|test|fix|code|deploy|pr\b/i, text: "I will hand it to @Dev Crew: reproduce, fix, review, and a pull request for you." },
      { match: /price|cost|free|pay|licen/i, text: "OpenFolks is free under the MIT License. You only pay the providers whose models you connect." },
      { match: /download|install|windows|mac|linux|try/i, text: "You can have this on your own machine in a few minutes. The download button is further down this page." },
      { match: /hello|hi\b|hey|who are you/i, text: "Hi. I am the Assistant, the leader of your team. Tell me what you need and I will pick the right folk or create one." },
    ],
    fallback: "Got it. I would decide which folk should take that, brief them, and report back when it is done.",
    suggestions: ["Add a folk for my finances", "Who handles my email?", "Is OpenFolks free?"],
  },
  vision: {
    replies: [
      { match: /remind|routine|break|every|daily|weekday/i, text: "Added to the routine. I will prompt you at the same times each weekday and keep a receipt of each run." },
      { match: /sleep|bed|night|tired/i, text: "Dim screens an hour before bed, keep the same wake time, and avoid scrolling in the dark. General guidance, not medical advice." },
      { match: /dry|strain|head|sore|blur/i, text: "That sounds like eye strain. Try the 20-20-20 rule, blink fully, and check your screen height. If it persists, see an optometrist." },
      { match: /screen|monitor|laptop|light|brightness/i, text: "Put the top of the screen at eye level, about an arm away, and match brightness to the room." },
    ],
    fallback: "I only cover eye care and daily health habits. Tell me about your screen time or sleep and I will adjust your routine.",
    suggestions: ["My eyes feel dry by evening", "Add a lunchtime walk", "How should I set up my monitor?"],
  },
  inbox: {
    replies: [
      { match: /every|daily|weekday|morning|routine/i, text: "Set as a routine. Every weekday morning I triage, reply to the routine mail and park the rest for you." },
      { match: /newsletter|promo|spam|unsubscribe/i, text: "I will filter those into a digest and unsubscribe from the ones you never open, after you approve the list." },
      { match: /urgent|important|boss|manager|client|vip/i, text: "I will flag those first and never auto-reply to them. They go to the top of your Desk for you." },
      { match: /reply|draft|write/i, text: "I draft in your voice and hold anything sensitive for your approval before it goes out." },
    ],
    fallback: "I handle email: triage, drafts and parking. Point me at a sender or a rule and I will apply it.",
    suggestions: ["Never auto-reply to my manager", "Digest my newsletters", "Clear my inbox every weekday"],
  },
  dev: {
    replies: [
      { match: /flaky|test|fail|ci/i, text: "I will rerun it in a loop to reproduce, find the race, fix it, and run the checks before opening a pull request." },
      { match: /deploy|release|ship/i, text: "I will build, run the checks, and prepare the release notes. Deploying waits for your approval." },
      { match: /review|pr\b|pull/i, text: "I will review the diff, flag risks and missing tests, and leave comments on the pull request." },
      { match: /bug|error|crash|fix/i, text: "Send me the error or steps. I will reproduce it first, then make a focused fix." },
    ],
    fallback: "I work on code: bugs, tests, reviews and pull requests. Give me a repo and a problem.",
    suggestions: ["Fix the flaky checkout test", "Review my open pull request", "Prepare release notes"],
  },
};

const FALLBACK_PERSONA: Persona = {
  replies: [],
  fallback: "Understood. In the real app I would start now and come back when I need your approval.",
  suggestions: [],
};

const persona = (id: FolkId): Persona => PERSONAS[id] ?? FALLBACK_PERSONA;

export function replyFor(id: FolkId, input: string): string {
  const p = persona(id);
  return p.replies.find((r) => r.match.test(input))?.text ?? p.fallback;
}

export const suggestionsFor = (id: FolkId): string[] => persona(id).suggestions;
