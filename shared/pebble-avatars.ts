/**
 * Bot avatar shapes from `bot-avatars`.
 * `avatarSeed` on a folk stores the shape type (clover, star, …).
 * Older pebble names (orion, …) still resolve via a stable hash.
 */

export const BOT_AVATAR_TYPES = [
  "clover",
  "flower",
  "star",
  "ghost",
  "circle",
  "hexagon",
  "square",
  "triangle",
  "blob",
  "drop",
  "droid",
  "mech",
  "alien",
  "cat",
  "cloud",
  "pill",
  "pebble",
  "puddle",
] as const;

/** Shapes shown in the profile picker — every library type is choosable. */
export const BOT_AVATAR_CHOICES = BOT_AVATAR_TYPES;

export type BotAvatarShape = (typeof BOT_AVATAR_TYPES)[number];
export type BotAvatarChoice = (typeof BOT_AVATAR_CHOICES)[number];

/** @deprecated Prefer BOT_AVATAR_TYPES — kept for older call sites/tests. */
export const PEBBLE_SEEDS = BOT_AVATAR_TYPES;
export type PebbleSeed = BotAvatarShape;

export const PEBBLE_VARIANT = "bot-avatars" as const;

const TYPE_SET = new Set<string>(BOT_AVATAR_TYPES);

export function isBotAvatarType(value: unknown): value is BotAvatarShape {
  return typeof value === "string" && TYPE_SET.has(value.trim());
}

/** Accepts a shape type or any short identity string (legacy seeds). */
export function isPebbleSeed(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 80;
}

function hashKey(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function typeFromKey(key: string): BotAvatarShape {
  return BOT_AVATAR_TYPES[hashKey(key) % BOT_AVATAR_TYPES.length]!;
}

/** Prefer unused catalog shapes; then mint unique shape-N seeds that still hash. */
export function pickPebbleSeed(
  used: Iterable<string | null | undefined>,
  index = 0,
): string {
  const taken = new Set<string>();
  for (const value of used) {
    if (typeof value === "string" && value.trim()) taken.add(value.trim());
  }
  const free = BOT_AVATAR_TYPES.filter((id) => !taken.has(id));
  if (free.length > 0) {
    return free[((index % free.length) + free.length) % free.length]!;
  }
  let n = Math.max(0, index);
  while (taken.has(`shape-${n}`)) n += 1;
  return `shape-${n}`;
}

export function pickBotAvatarType(
  used: Iterable<string | null | undefined>,
  index = 0,
): BotAvatarShape {
  const picked = pickPebbleSeed(used, index);
  return isBotAvatarType(picked) ? picked : typeFromKey(picked);
}

export function avatarSeedFor(bot: {
  id?: string;
  avatarSeed?: string | null;
  mascotShape?: string | null;
  name?: string;
}): string {
  const stored = bot.avatarSeed?.trim() || bot.mascotShape?.trim();
  if (stored) return stored;
  if (bot.id) return bot.id;
  const name = bot.name?.trim();
  if (name) return name;
  return "folk";
}

/** Resolve the canvas shape for a folk. */
export function avatarTypeFor(bot: {
  id?: string;
  avatarSeed?: string | null;
  mascotShape?: string | null;
  name?: string;
}): BotAvatarShape {
  const raw = bot.avatarSeed?.trim() || bot.mascotShape?.trim();
  if (raw === "hexagonal") return "hexagon";
  if (raw && isBotAvatarType(raw)) return raw;
  return typeFromKey(avatarSeedFor(bot));
}

/** 0–1 animation offset so a roster does not blink in unison. */
export function animationSeedFor(key: string): number {
  return (hashKey(key) % 1000) / 1000;
}
