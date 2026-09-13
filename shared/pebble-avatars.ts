/** SpaceUI Pebble identities. Auto-created folks each get a unused seed
 * so every new folk looks different. */
export const PEBBLE_SEEDS = [
  "orion",
  "sirius",
  "vega",
  "altair",
  "deneb",
  "rigel",
  "betelgeuse",
  "polaris",
  "capella",
  "spica",
  "antares",
  "aldebaran",
  "procyon",
  "castor",
  "pollux",
  "regulus",
  "arcturus",
  "canopus",
  "mira",
  "lyra",
  "cygnus",
  "andromeda",
  "perseus",
  "cassiopeia",
  "draco",
  "phoenix",
  "hydra",
  "pegasus",
  "aquila",
  "lynx",
  "ursa",
  "cepheus",
  "bootes",
  "fornax",
  "indus",
  "volans",
] as const;

export type PebbleSeed = (typeof PEBBLE_SEEDS)[number];

export const PEBBLE_VARIANT = "pebble" as const;

export function isPebbleSeed(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 80;
}

/** Prefer catalog names nobody is using yet; then mint unique pebble-N seeds. */
export function pickPebbleSeed(
  used: Iterable<string | null | undefined>,
  index = 0,
): string {
  const taken = new Set<string>();
  for (const value of used) {
    if (typeof value === "string" && value.trim()) taken.add(value.trim());
  }
  const free = PEBBLE_SEEDS.filter((id) => !taken.has(id));
  if (free.length > 0) {
    return free[((index % free.length) + free.length) % free.length]!;
  }
  let n = Math.max(0, index);
  while (taken.has(`pebble-${n}`)) n += 1;
  return `pebble-${n}`;
}

export function avatarSeedFor(bot: {
  id?: string;
  avatarSeed?: string | null;
  name?: string;
}): string {
  const stored = bot.avatarSeed?.trim();
  if (stored) return stored;
  if (bot.id) return bot.id;
  const name = bot.name?.trim();
  if (name) return name;
  return "folk";
}
