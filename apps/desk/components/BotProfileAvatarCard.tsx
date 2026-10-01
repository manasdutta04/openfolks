import { useState } from "react";
import { Shuffle } from "lucide-react";
import {
  BOT_AVATAR_TYPES,
  avatarSeedFor,
  avatarTypeFor,
  pickBotAvatarType,
  type BotAvatarShape,
} from "../../../shared/pebble-avatars";
import { MAUS_COLOR_NAMES, MAUS_COLORS, type MausColor } from "@/lib/mascot";
import { cn } from "@/lib/cn";
import type { Bot } from "@/state/store";
import { BotAvatar, MausAvatar } from "./Avatar";

type AvatarPatch = Partial<
  Pick<Bot, "avatarCrop" | "avatarUrl" | "avatarSeed" | "mascotShape" | "color">
>;

type PreviewState = "idle" | "working" | "sleeping";

const SHAPE_LABELS: Record<BotAvatarShape, string> = {
  clover: "Clover",
  flower: "Flower",
  star: "Star",
  ghost: "Ghost",
  circle: "Circle",
  hexagon: "Hexagon",
  square: "Square",
  triangle: "Triangle",
  blob: "Blob",
  drop: "Drop",
  droid: "Droid",
  mech: "Mech",
  alien: "Alien",
  cat: "Cat",
  cloud: "Cloud",
  pill: "Pill",
  pebble: "Pebble",
  puddle: "Puddle",
};

export function BotProfileAvatarCard({
  bot,
  onPatch,
  usedSeeds = [],
}: {
  bot: Bot;
  onPatch: (patch: AvatarPatch) => void;
  usedSeeds?: Array<string | null | undefined>;
}) {
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const shapeBot = { ...bot, avatarUrl: null, avatarCrop: "mascot" as const };
  const activeType = avatarTypeFor(bot);
  const activeSeed = avatarSeedFor(bot);
  const activeColor = (bot.color && MAUS_COLOR_NAMES.includes(bot.color as MausColor)
    ? bot.color
    : "green") as MausColor;

  const applyShape = (shape: string) => {
    onPatch({
      avatarCrop: "mascot",
      avatarUrl: null,
      avatarSeed: shape,
      mascotShape: shape,
    });
  };

  const applyColor = (color: MausColor) => {
    onPatch({
      avatarCrop: "mascot",
      avatarUrl: null,
      color,
    });
  };

  const shuffle = () => {
    const nextShape = pickBotAvatarType(
      [...usedSeeds, activeSeed].filter((s) => s !== activeType),
      Math.floor(Math.random() * 64),
    );
    const nextColor =
      MAUS_COLOR_NAMES[Math.floor(Math.random() * MAUS_COLOR_NAMES.length)]!;
    onPatch({
      avatarCrop: "mascot",
      avatarUrl: null,
      avatarSeed: nextShape,
      mascotShape: nextShape,
      color: nextColor,
    });
  };

  const reset = () => {
    onPatch({
      avatarCrop: "mascot",
      avatarUrl: null,
      avatarSeed: "clover",
      mascotShape: "clover",
      color: "green",
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-hairline/40 bg-card">
      <div className="flex items-center justify-between border-b border-hairline/40 px-3 py-2.5">
        <span className="rounded-lg bg-control px-3 py-1.5 text-[14px] font-medium text-ink">Avatar</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={shuffle}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] text-ink-secondary hover:bg-control hover:text-ink"
            title="Shuffle shape and color"
          >
            <Shuffle size={14} />
            Shuffle
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md px-2 py-1.5 text-[13px] text-ink-secondary hover:bg-control hover:text-ink"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4 p-3">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-inset/60 px-3 py-4">
          <div className="flex h-[140px] w-[140px] items-center justify-center overflow-visible">
            <BotAvatar
              bot={shapeBot}
              size={96}
              animated
              interactive
              state={previewState}
              motion="none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-control p-1">
            {(["idle", "working", "sleeping"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={previewState === s}
                onClick={() => setPreviewState(s)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
                  previewState === s
                    ? "bg-panel text-ink shadow-sm"
                    : "text-ink-secondary hover:text-ink",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-ink-secondary">
            {SHAPE_LABELS[activeType]} · {activeColor}
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-[12px] font-medium text-ink-secondary">Shape</div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {BOT_AVATAR_TYPES.map((shape) => (
              <button
                key={shape}
                type="button"
                aria-pressed={activeType === shape}
                onClick={() => applyShape(shape)}
                className={cn(
                  "flex min-h-[76px] flex-col items-center justify-center gap-1 overflow-visible rounded-xl bg-inset px-1 py-2 transition-colors hover:bg-control",
                  activeType === shape && "bg-control ring-2 ring-accent-border",
                )}
                title={SHAPE_LABELS[shape]}
                aria-label={`Use ${SHAPE_LABELS[shape]} avatar`}
              >
                <span className="flex h-[48px] w-[48px] items-center justify-center overflow-visible">
                  <MausAvatar
                    seed={shape}
                    mascotShape={shape}
                    color={activeColor}
                    size={34}
                    animated={false}
                    interactive={false}
                  />
                </span>
                <span className="max-w-full truncate text-[10px] capitalize text-ink-secondary">
                  {SHAPE_LABELS[shape]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[12px] font-medium text-ink-secondary">Color</div>
          <div className="grid grid-cols-5 gap-2">
            {MAUS_COLOR_NAMES.map((color) => (
              <button
                key={color}
                type="button"
                aria-pressed={activeColor === color}
                onClick={() => applyColor(color)}
                className={cn(
                  "flex min-h-[64px] flex-col items-center justify-center gap-1.5 overflow-visible rounded-xl bg-inset px-1 py-2 transition-colors hover:bg-control",
                  activeColor === color && "bg-control ring-2 ring-accent-border",
                )}
                title={color}
                aria-label={`Use ${color} color`}
              >
                <span className="flex h-[40px] w-[40px] items-center justify-center overflow-visible">
                  <MausAvatar
                    seed={activeType}
                    mascotShape={activeType}
                    color={color}
                    size={28}
                    animated={false}
                    interactive={false}
                  />
                </span>
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: MAUS_COLORS[color] }}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
