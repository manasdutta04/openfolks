import { useEffect, useState } from "react";
import {
  BotAvatar as LibraryBotAvatar,
  type BotAvatarState,
  type BotAvatarType,
} from "bot-avatars";
import {
  animationSeedFor,
  avatarSeedFor,
  avatarTypeFor,
} from "../../../shared/pebble-avatars";
import { botAvatarProfile, type BotAvatarCrop } from "../../../shared/bot-avatar";
import { MAUS_COLORS, type MausColor } from "@/lib/mascot";

export type MausAvatarProps = {
  seed?: string;
  size?: number;
  label?: string;
  animated?: boolean;
  circle?: boolean;
  /** Optional body colour override (folk chrome colour). */
  color?: MausColor;
  state?: string;
  expression?: number;
  motion?: string;
  motionKey?: number;
  mascotShape?: string | null;
  turn?: number;
  gaze?: { x?: number; y?: number };
  spring?: number;
  eyeScale?: number;
  showMouth?: boolean;
  mouthStroke?: number;
  forward?: boolean;
  lookAround?: number;
  trackPointer?: boolean;
  interactive?: boolean;
};

function mapState(state?: string): BotAvatarState {
  if (state === "working") return "working";
  if (state === "sleeping") return "sleeping";
  return "default";
}

/** Animated bot-avatars shape from a deterministic seed / type. */
export function MausAvatar({
  seed = "folk",
  size = 44,
  label,
  animated = false,
  color,
  state,
  mascotShape,
  turn,
  showMouth,
  interactive = false,
}: MausAvatarProps) {
  const type = avatarTypeFor({ avatarSeed: seed, mascotShape }) as BotAvatarType;
  const libraryState = mapState(state);
  const face = showMouth || libraryState === "working" ? "mouth" : "eyes";
  const bodyColor = color ? MAUS_COLORS[color] : undefined;
  const isWorking = libraryState === "working";

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-visible"
      title={label}
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <LibraryBotAvatar
        type={type}
        state={libraryState}
        face={face}
        size={size}
        seed={animationSeedFor(seed)}
        color={bodyColor}
        paused={!animated}
        // Softer motion so idle rows and the picker don't feel twitchy.
        speed={animated ? (isWorking ? 0.92 : 0.78) : 1}
        turn={turn ?? (animated ? 0.65 : 0)}
        jumpEvery={animated ? (isWorking ? 4.5 : 11) : 0}
        jumpHeight={isWorking ? 18 : 14}
        jumpSpin={isWorking ? 0.85 : 0.55}
        jumpLean={isWorking ? 4 : 3}
        jumpStretch={0.7}
        jumpSquash={0.9}
        whirl={isWorking ? 0.55 : 0}
        interactive={interactive}
        shading="plastic"
      />
    </span>
  );
}

export type BotAvatarProps = Omit<MausAvatarProps, "seed"> & {
  bot: {
    id?: string;
    name?: string;
    avatarSeed?: string | null;
    color?: MausColor;
    mascotShape?: string | null;
    avatarUrl?: string | null;
    avatarCrop?: BotAvatarCrop;
  };
};

/**
 * Folk profile image when one is set; otherwise a bot-avatars shape.
 * A broken custom image falls back to the shape so the row never shows a hole.
 */
export function BotAvatar({ bot, size = 44, label, animated = false, ...rest }: BotAvatarProps) {
  const profile = botAvatarProfile(bot);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [profile.avatarUrl]);

  if (profile.avatarCrop === "mascot" || !profile.avatarUrl || imageFailed) {
    return (
      <MausAvatar
        {...rest}
        seed={avatarSeedFor(bot)}
        mascotShape={bot.mascotShape ?? bot.avatarSeed}
        color={bot.color}
        size={size}
        label={label ?? bot.name}
        animated={animated}
      />
    );
  }

  const radius =
    profile.avatarCrop === "circle"
      ? "50%"
      : profile.avatarCrop === "rounded"
        ? "22%"
        : "0";
  return (
    <img
      src={profile.avatarUrl}
      alt={label ?? (bot.name ? `${bot.name} avatar` : "Folk avatar")}
      width={size}
      height={size}
      draggable={false}
      onError={() => setImageFailed(true)}
      className="block shrink-0 bg-raised object-cover"
      style={{ width: size, height: size, borderRadius: radius }}
    />
  );
}

export function InitialsAvatar({
  initials,
  size = 32,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-raised text-ink-secondary font-medium"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
