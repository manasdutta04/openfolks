---
name: verify-folks
description: "Verify OpenFolks server and conversation changes against an isolated fake-engine instance before claiming they work."
---

# Verify OpenFolks

Follow [`docs/verifying.md`](../../docs/verifying.md). Use `pnpm control:folks`
(or `scripts/control-folks.ts launch` for an isolated harness). Do not drive the
user's live OpenFolks instance or invent ad-hoc API scripts for the same job.
