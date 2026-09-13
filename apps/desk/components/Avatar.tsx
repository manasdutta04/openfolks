import { useEffect, useState } from "react";
import { Avatar } from "@usespaceui/avatars/react";
import { avatarSeedFor, PEBBLE_VARIANT } from "../../../shared/pebble-avatars";
import { botAvatarProfile, type BotAvatarCrop } from "../../../shared/bot-avatar";
import type { MausColor } from "@/lib/mascot";

export type MausAvatarProps = {
  seed?: string;
  size?: number;
  label?: string;
  animated?: boolean;
  circle?: boolean;
  /** Kept so existing call sites compile; pebble generates its own palette. */
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
};

/** Pebble avatar from a deterministic seed. Same seed always looks the same. */
export function MausAvatar({
  seed = "folk",
  size = 44,
  label,
  animated = false,
  circle = true,
}: MausAvatarProps) {
  return (
    <span className="inline-flex shrink-0" title={label} aria-label={label}>
      <Avatar
        name={seed}
        variant={PEBBLE_VARIANT}
        size={size}
        circle={circle}
        animate={animated}
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
 * Folk profile image when one is set; otherwise a unique Pebble avatar.
 * A broken custom image falls back to Pebble so the row never shows a hole.
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
