/** Folk color tokens — still used for non-avatar chrome (chips, lists). */
export const MAUS_COLOR_NAMES = [
  "green",
  "blue",
  "red",
  "orange",
  "purple",
  "cyan",
  "pink",
  "yellow",
  "teal",
  "coral",
] as const;

export type MausColor = (typeof MAUS_COLOR_NAMES)[number];

export const MAUS_COLORS = {
  green: "#009957",
  blue: "#377FE6",
  red: "#D94B52",
  orange: "#E78531",
  purple: "#8057C8",
  cyan: "#0EA5C6",
  pink: "#D84F8B",
  yellow: "#D8A729",
  teal: "#01A492",
  coral: "#E5634E",
} satisfies Record<MausColor, string>;

export const MAUS_MOTIONS = [
  "arrive",
  "switch",
  "customize",
  "alert",
  "thinking",
  "working",
  "launch",
  "success",
  "celebrate",
  "blink",
  "surprise",
  "failure",
] as const;

export type MausMotion = "none" | (typeof MAUS_MOTIONS)[number];

export type MausState = "idle" | "working" | "happy";

export function normalizeState(_value: string | null | undefined): MausState | null {
  return null;
}

export type MascotBotProfile = {
  name: string;
  title?: string;
  description?: string;
  mascotExpression?: string | null;
  busy?: boolean;
  unread?: boolean;
  messages?: Array<{ kind: string; tool?: { ok?: boolean } }>;
};

export function stateForBot(bot: MascotBotProfile): MausState {
  if (bot.busy) return "working";
  return "idle";
}
