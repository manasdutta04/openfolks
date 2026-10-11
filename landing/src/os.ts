import { useEffect, useState } from "react";

export type Os = "windows" | "mac" | "linux" | "other";

const BASE = "https://github.com/manasdutta04/openfolks/releases/latest/download/";
export const RELEASES = "https://github.com/manasdutta04/openfolks/releases/latest";

export interface Download {
  os: Exclude<Os, "other">;
  label: string;
  sub: string;
  href: string;
}

export const DOWNLOADS: Download[] = [
  { os: "windows", label: "Windows", sub: "Windows 10 and 11 (x64) · .exe", href: BASE + "OpenFolks-setup.exe" },
  { os: "mac", label: "macOS · Apple silicon", sub: "M-series Macs · .dmg", href: BASE + "OpenFolks.dmg" },
  { os: "mac", label: "macOS · Intel", sub: "Intel Macs · .dmg", href: BASE + "OpenFolks-intel.dmg" },
  { os: "linux", label: "Linux · .deb", sub: "Ubuntu 24.04 (x64), recommended", href: BASE + "OpenFolks-amd64.deb" },
  { os: "linux", label: "Linux · AppImage", sub: "Portable, any x64 distro", href: BASE + "OpenFolks.AppImage" },
];

export function detectOs(ua = typeof navigator === "undefined" ? "" : navigator.userAgent): Os {
  if (/Windows/i.test(ua)) return "windows";
  if (/iPhone|iPad|Android/i.test(ua)) return "other";
  if (/Mac/i.test(ua)) return "mac";
  if (/Linux|X11|CrOS/i.test(ua)) return "linux";
  return "other";
}

/** Primary CTA for the visitor's OS. Mac gets Apple silicon first. */
export function primaryFor(os: Os): { label: string; href: string } {
  switch (os) {
    case "windows": return { label: "Download for Windows", href: DOWNLOADS[0]!.href };
    case "mac": return { label: "Download for Mac", href: DOWNLOADS[1]!.href };
    case "linux": return { label: "Download for Linux", href: DOWNLOADS[3]!.href };
    default: return { label: "Download OpenFolks", href: "#download" };
  }
}

export function useOs(): Os {
  const [os, setOs] = useState<Os>("windows");
  useEffect(() => setOs(detectOs()), []);
  return os;
}
