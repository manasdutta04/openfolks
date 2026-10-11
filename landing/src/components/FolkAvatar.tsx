import { BotAvatar, type BotAvatarType } from "bot-avatars";
import { COLORS, type ColorName } from "../folks";

interface Props {
  type: BotAvatarType;
  color: ColorName;
  size?: number;
  working?: boolean;
  sleeping?: boolean;
  /** follow the pointer / hop on click */
  interactive?: boolean;
  label?: string;
}

/**
 * The app's own mascot (bot-avatars), configured like Desk's MausAvatar:
 * plastic shading, softened motion, a mouth while working.
 */
export function FolkAvatar({ type, color, size = 40, working, sleeping, interactive, label }: Props) {
  const state = working ? "working" : sleeping ? "sleeping" : "default";
  return (
    <span className="avatar" style={{ width: size, height: size }} role="img" aria-label={label ?? "OpenFolks mascot"}>
      <BotAvatar
        type={type}
        color={COLORS[color]}
        state={state}
        face={working ? "mouth" : "eyes"}
        size={size}
        shading="plastic"
        speed={working ? 0.92 : 0.78}
        turn={0.65}
        jumpEvery={working ? 4.5 : 11}
        jumpHeight={working ? 18 : 14}
        interactive={interactive}
      />
    </span>
  );
}
