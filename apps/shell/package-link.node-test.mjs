import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { packageUrlFromCommandLine, packageUrlFromDeepLink } from "./package-link.mjs";

describe("BotMRR package deep links", () => {
  it("accepts a public GitHub package URL", () => {
    const target = "https://raw.githubusercontent.com/acme/folks/main/reddit-lead-miner.md";
    assert.equal(packageUrlFromDeepLink(`openfolks://install?url=${encodeURIComponent(target)}`), target);
    assert.equal(packageUrlFromCommandLine(["OpenFolks", "--flag", `openfolks://install?url=${encodeURIComponent(target)}`]), target);
  });

  it("rejects other commands, hosts, protocols, credentials, and unsupported file types", () => {
    assert.equal(packageUrlFromDeepLink("openfolks://settings"), null);
    assert.equal(packageUrlFromDeepLink("openfolks://install?url=https://evil.example/folk.json"), null);
    assert.equal(packageUrlFromDeepLink("openfolks://install?url=http://raw.githubusercontent.com/a/b/main/folk.json"), null);
    assert.equal(packageUrlFromDeepLink("openfolks://install?url=https://user@example.com/folk.json"), null);
    assert.equal(packageUrlFromDeepLink("openfolks://install?url=https://github.com/acme/folk/run.sh"), null);
  });
});
