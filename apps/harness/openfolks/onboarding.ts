import type { AppConfig } from "../config.ts";
import { loadConfig, saveConfig } from "../config.ts";

export function isOpenFolksOnboardingComplete(cfg: AppConfig = loadConfig()): boolean {
  return cfg.openfolks?.onboardingComplete === true;
}

export function openfolksProjectFolder(cfg: AppConfig = loadConfig()): string | null {
  const folder = cfg.openfolks?.projectFolder?.trim();
  return folder || null;
}

export function markOpenFolksOnboardingComplete(projectFolder?: string | null) {
  const folder = projectFolder?.trim();
  saveConfig({
    openfolks: {
      onboardingComplete: true,
      ...(folder ? { projectFolder: folder } : {}),
    },
  });
}

export function openfolksOnboardingState() {
  const cfg = loadConfig();
  return {
    complete: isOpenFolksOnboardingComplete(cfg),
    projectFolder: openfolksProjectFolder(cfg),
  };
}
