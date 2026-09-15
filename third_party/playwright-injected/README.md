# playwright-injected

Vendored, unmodified sources from [Microsoft Playwright](https://github.com/microsoft/playwright)
(Apache-2.0 — see `LICENSE`), pinned to the commit in `UPSTREAM_COMMIT`:

- `src/` ← `packages/injected/src/{ariaSnapshot,ariaSnapshotDistiller,domUtils,roleUtils}.ts`
- `isomorphic/` ← `packages/isomorphic/{ariaSnapshot,ariaSnapshotRenderer,stringUtils,cssTokenizer,yaml}.ts`

`entry.ts` is OpenFolks's. It exposes Playwright's accessibility-tree
snapshot (the `[ref=eN]` YAML models receive) on the built-in browser
bridge (`window.__ombBrowser`) and resolves refs back to elements for
clicks and fills.

`scripts/build-browser-snapshot.mjs` bundles this into
`electron/resources/browser-snapshot.js` (committed). Re-run it after
changing anything here. To refresh the vendored sources, re-fetch the
files above at a newer commit, update `UPSTREAM_COMMIT`, rebuild, and run
the browser tests.
