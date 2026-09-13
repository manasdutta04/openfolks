import type { MouseEvent } from "react";
import { useDesktopCapabilities } from "@/components/DesktopCapabilities";
import { cn } from "@/lib/cn";

const MENUS = ["File", "Edit", "View", "Go", "Folks", "Window", "Help"] as const;

/**
 * Windows title strip: app name + menus on one row with the caption buttons.
 * Constrains itself to Electron's titlebar-area env() so min/max/close stay clear.
 */
export function AppTitleBar() {
  const { capabilities } = useDesktopCapabilities();
  if (capabilities.windowChrome !== "win-overlay") return null;

  const openMenu = (label: string, event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    void window.ogb?.popupMenu?.(label, Math.round(rect.left), Math.round(rect.bottom));
  };

  return (
    <div
      className="flex shrink-0 items-center gap-3 border-b border-hairline/30 bg-app text-ink"
      style={
        {
          WebkitAppRegion: "drag",
          height: "env(titlebar-area-height, 36px)",
          marginLeft: "env(titlebar-area-x, 0px)",
          width: "env(titlebar-area-width, 100%)",
          paddingLeft: 12,
          paddingRight: 8,
        } as React.CSSProperties
      }
    >
      <div className="flex shrink-0 items-center gap-2">
        <img
          src="/openfolk.png"
          alt=""
          width={18}
          height={18}
          className="shrink-0 rounded-[4px]"
          draggable={false}
        />
        <span className="shrink-0 text-[13.5px] font-semibold tracking-[0.02em] text-ink">
          OpenFolks
        </span>
      </div>
      <nav
        className="flex min-w-0 items-center gap-0.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        aria-label="Application"
      >
        {MENUS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={(event) => openMenu(label, event)}
            className={cn(
              "rounded-md px-2 py-1 text-[12.5px] text-ink-secondary",
              "hover:bg-raised/80 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
