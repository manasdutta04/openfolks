import { execSync } from "node:child_process";

export interface ToolchainStatus {
  bun: boolean;
  python: boolean;
  lualatex: boolean;
  xelatex: boolean;
}

function hasCommand(cmd: string): boolean {
  try {
    execSync(process.platform === "win32" ? `where ${cmd}` : `command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function checkToolchain(): ToolchainStatus {
  return {
    bun: hasCommand("bun"),
    python: hasCommand("python") || hasCommand("python3"),
    lualatex: hasCommand("lualatex"),
    xelatex: hasCommand("xelatex"),
  };
}

export function toolchainSummary(status: ToolchainStatus): string[] {
  const notes: string[] = [];
  if (!status.bun) notes.push("Install Bun for job portal CLIs (https://bun.sh)");
  if (!status.python) notes.push("Install Python 3 for ATS PDF verification");
  if (!status.lualatex) notes.push("Install LaTeX (lualatex) for CV PDF compile");
  if (!status.xelatex) notes.push("Install LaTeX (xelatex) for cover letter PDF compile");
  return notes;
}
