// Shared folk computer destination control: simple This computer / Local VM /
// Off strip, with Box + VPS tucked under Advanced so the default path stays clear.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Bot } from "@/state/store";
import type { CloudBackend } from "../../harness/contracts.ts";
import { cn } from "@/lib/cn";
import { simpleComputerAutoDescription } from "@/lib/local-computer";
import { CloudBackendPicker } from "./CloudBackendPicker";
import { Switch } from "./SettingsPrimitives";

type SimpleMode = "vm" | "local" | "off";

const SIMPLE_MODES: Array<[SimpleMode, string, string]> = [
  ["local", "This computer", "Your Windows or Mac, with permission prompts"],
  ["vm", "Local VM", "Isolated Linux desktop in Docker / Podman / WSL"],
  ["off", "Off", "No computer for this folk"],
];

export function ComputerDestinationPicker({
  bot,
  title = "Computer",
  localSelectable,
  localDisabledReason,
  vmSupported,
  cloudSupported,
  vpsSupported,
  onSelectComputer,
  onSelectCloudBackend,
  onToggleAutoStartVps,
}: {
  bot: Bot;
  title?: string;
  localSelectable: boolean;
  localDisabledReason: string | null;
  vmSupported: boolean;
  cloudSupported: boolean;
  vpsSupported: boolean;
  onSelectComputer: (mode: NonNullable<Bot["computer"]>) => void;
  onSelectCloudBackend: (backend: CloudBackend) => void;
  onToggleAutoStartVps: () => void;
}) {
  const cloudBackend = bot.cloudBackend ?? "box";
  const onCloud = bot.computer === "cloud";
  // Always start collapsed — cloud selection shows via the Active chip only.
  const [advancedOpen, setAdvancedOpen] = useState(false);
  return (
    <div className="rounded-xl bg-card p-4">
      <div className="text-[15px] font-medium text-ink">{title}</div>
      <div className="mt-0.5 text-[13px] text-ink-secondary">
        {!bot.computer
          ? simpleComputerAutoDescription()
          : onCloud
            ? "Using a hosted cloud computer."
            : "Where this folk runs computer work."}
      </div>

      <div className="mt-3 flex overflow-hidden rounded-lg border border-hairline/40">
        {SIMPLE_MODES.map(([mode, label], i) => {
          const disabled =
            (mode === "vm" && !vmSupported) || (mode === "local" && !localSelectable);
          const unavailableTitle =
            mode === "vm" && !vmSupported
              ? "This model engine cannot use the Local VM"
              : mode === "local" && !localSelectable
                ? (localDisabledReason ?? "Local computer control isn't ready")
                : undefined;
          return (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              title={unavailableTitle ?? SIMPLE_MODES.find(([m]) => m === mode)?.[2]}
              onClick={() => {
                if (mode === bot.computer) return;
                onSelectComputer(mode);
              }}
              className={cn(
                "flex-1 py-1.5 text-[13px]",
                i > 0 && "border-l border-hairline/40",
                disabled && "cursor-not-allowed opacity-40",
                bot.computer === mode
                  ? "bg-control text-ink"
                  : "text-ink-secondary hover:bg-control/60 hover:text-ink",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-[12.5px] font-medium text-ink-secondary hover:bg-raised/50 hover:text-ink"
          aria-expanded={advancedOpen}
        >
          <ChevronDown
            size={14}
            className={cn("shrink-0 transition-transform", advancedOpen ? "rotate-0" : "-rotate-90")}
          />
          Advanced: cloud computers
          {onCloud && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10.5px] font-medium text-accent">
              Active
            </span>
          )}
        </button>

        {advancedOpen && (
          <div className="mt-1 space-y-3 rounded-lg border border-hairline/40 bg-inset/40 p-3">
            <p className="text-[11.5px] leading-relaxed text-ink-secondary">
              Hosted Box or a self-hosted Linux Docker host over SSH. Most people can ignore this and
              use This computer or Local VM instead.
            </p>
            <button
              type="button"
              disabled={!cloudSupported}
              title={
                !cloudSupported ? "This model engine cannot use cloud computer tools" : undefined
              }
              onClick={() => {
                if (bot.computer !== "cloud") onSelectComputer("cloud");
              }}
              className={cn(
                "w-full rounded-lg border border-hairline/40 py-1.5 text-[13px]",
                !cloudSupported && "cursor-not-allowed opacity-40",
                onCloud
                  ? "bg-control text-ink"
                  : "text-ink-secondary hover:bg-control/60 hover:text-ink",
              )}
            >
              Use cloud computer
            </button>
            <CloudBackendPicker
              value={cloudBackend}
              vpsSupported={vpsSupported}
              onChange={(backend) => {
                onSelectCloudBackend(backend);
                if (bot.computer && bot.computer !== "cloud") onSelectComputer("cloud");
              }}
            />
            {(onCloud || !bot.computer) && cloudBackend === "vps" && (
              <div className="flex items-center justify-between gap-4 rounded-lg bg-card/80 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13px] text-ink">Start VPS automatically</div>
                  <div className="mt-0.5 text-[11.5px] text-ink-secondary">
                    Off by default. When enabled, Auto may create or wake this folk&apos;s managed
                    container.
                  </div>
                </div>
                <Switch
                  checked={Boolean(bot.autoStartVps)}
                  aria-label="Start VPS automatically"
                  onClick={onToggleAutoStartVps}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
