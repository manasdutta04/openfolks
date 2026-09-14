import { rm } from "node:fs/promises";

const generatedPaths = [
  "dist",
  "dist-electron",
  "dist-native",
  "dist-server",
  "release",
  "apps/shell/resources/speech-helper",
  "apps/shell/resources/OpenFolks Speech.app",
];

await Promise.all(
  generatedPaths.map((path) => rm(path, { recursive: true, force: true })),
);
