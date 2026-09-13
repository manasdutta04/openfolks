import { PEBBLE_SEEDS, avatarSeedFor } from "../../../shared/pebble-avatars";
import { cn } from "@/lib/cn";
import type { Bot } from "@/state/store";
import { BotAvatar, MausAvatar } from "./Avatar";

type AvatarPatch = Partial<Pick<Bot, "avatarCrop" | "avatarUrl" | "avatarSeed">>;

export function BotProfileAvatarCard({
  bot,
  onPatch,
}: {
  bot: Bot;
  onPatch: (patch: AvatarPatch) => void;
}) {
  const pebbleBot = { ...bot, avatarUrl: null, avatarCrop: "mascot" as const };
  const activeSeed = avatarSeedFor(bot);

  const applyPebble = (seed: string) => {
    onPatch({ avatarCrop: "mascot", avatarUrl: null, avatarSeed: seed });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-hairline/40 bg-card">
      <div className="flex items-center justify-between border-b border-hairline/40 px-3 py-2.5">
        <span className="rounded-lg bg-control px-3 py-1.5 text-[14px] font-medium text-ink">Avatar</span>
        <button
          type="button"
          onClick={() => applyPebble(PEBBLE_SEEDS[0]!)}
          className="rounded-md px-2 py-1.5 text-[13px] text-ink-secondary hover:bg-control hover:text-ink"
        >
          Reset
        </button>
      </div>

      <div className="p-3">
        <div className="flex justify-center py-3">
          <BotAvatar bot={pebbleBot} size={112} />
        </div>

        <div className="grid grid-cols-6 gap-2">
          {PEBBLE_SEEDS.map((seed) => (
            <button
              key={seed}
              type="button"
              aria-pressed={activeSeed === seed}
              onClick={() => applyPebble(seed)}
              className={cn(
                "flex h-[52px] items-center justify-center rounded-xl bg-inset transition-colors hover:bg-control",
                activeSeed === seed && "ring-2 ring-accent-border",
              )}
              title={seed}
              aria-label={`Use this look`}
            >
              <MausAvatar seed={seed} size={36} animated={false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
