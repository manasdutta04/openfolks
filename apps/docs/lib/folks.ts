import type { BotAvatarType } from "bot-avatars";

/**
 * Same palette and shape set the Desk uses (apps/desk/lib/mascot.ts and
 * shared/pebble-avatars.ts), so the mascots on this page are the app's own.
 */
export const COLORS = {
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
  white: "#f4f4f6",
} as const;
export type ColorName = keyof typeof COLORS;

export type FolkId = "assistant" | "coach" | "vision" | "inbox" | "dev" | "chief" | "outbound" | "scout" | "books";

export interface Folk {
  id: FolkId;
  name: string;
  role: string;
  type: BotAvatarType;
  color: ColorName;
}

export const FOLKS: Record<FolkId, Folk> = {
  assistant: { id: "assistant", name: "Assistant", role: "Leader", type: "clover", color: "green" },
  coach: { id: "coach", name: "Coach", role: "Gym and fitness", type: "star", color: "red" },
  vision: { id: "vision", name: "Vision", role: "Eye care and health", type: "circle", color: "purple" },
  chief: { id: "chief", name: "Chief", role: "Chief of staff", type: "blob", color: "teal" },
  outbound: { id: "outbound", name: "Sales Outbound", role: "Pipeline", type: "hexagon", color: "orange" },
  inbox: { id: "inbox", name: "Inbox", role: "Email triage", type: "triangle", color: "purple" },
  scout: { id: "scout", name: "Scout", role: "Talent scout", type: "clover", color: "blue" },
  books: { id: "books", name: "Books", role: "Expenses", type: "star", color: "yellow" },
  dev: { id: "dev", name: "Dev Crew", role: "Engineering", type: "droid", color: "green" },
};

/** Crew-file colour names → avatar shape, so each member looks distinct. */
export const SHAPE_BY_COLOR: Record<string, BotAvatarType> = {
  blue: "clover",
  green: "blob",
  red: "flower",
  orange: "hexagon",
  purple: "triangle",
  cyan: "drop",
  pink: "cat",
  yellow: "star",
  teal: "ghost",
  coral: "pebble",
};
