// PostHog usage analytics.
// The phc_ token is a write-only public key (safe to ship in the client).
// Only the named events below are sent — autocapture is OFF on purpose:
// it would ship the $el_text of clicked elements, and the sidebar/option
// cards render model output and message previews, so it would leak fragments
// of private conversations to a third party.
import posthog from "posthog-js";
import { readMigratedStorage, writeStorage } from "./storage-key.js";

const TOKEN = "phc_m2hP39w8y2gLPvHgDvSXAu6xcZ3agjf4ruL56rGcMZEe";

// Analytics are on by default; Settings → General turns them off. The choice
// lives in localStorage because it has to be readable BEFORE init() runs: an
// opted-out install must never call posthog.init(), so no request — not even
// the library's own — leaves the machine. Once running, opting out routes
// through opt_out_capturing(), which also drops anything already queued.
const OPT_OUT_KEY = "openfolks-analytics-opt-out";
const OPT_OUT_KEY_LEGACY = "omb-analytics-opt-out";
const INSTALLED_KEY = "openfolks-installed";
const INSTALLED_KEY_LEGACY = "omb-installed";

let ready = false;

// The choice as made in THIS process, which outranks storage. Without it a
// rejected write silently loses an opt-out: the setter would swallow the
// error, the next analyticsEnabled() would read nothing and answer true, and
// a later initAnalytics() would start the client the user just switched off.
// Storage is how the choice survives a restart, not where it lives.
let choice: boolean | undefined;

/** False once the user has opted out on this machine. */
export function analyticsEnabled(): boolean {
  if (choice !== undefined) return choice;
  return readMigratedStorage(OPT_OUT_KEY, OPT_OUT_KEY_LEGACY) !== "1";
}

/** What flipping the switch has to do, given the new setting and whether the
 * client is already running. A plain function so the decision can be checked
 * without standing up an analytics client to observe. */
export type OptAction = "init" | "opt-in" | "opt-out" | "none";
export function optAction(enabled: boolean, running: boolean): OptAction {
  if (!enabled) return running ? "opt-out" : "none";
  return running ? "opt-in" : "init";
}

/** Flip the setting and act on it immediately, in both directions. */
export function setAnalyticsEnabled(enabled: boolean) {
  choice = enabled; // before persisting: the decision must not depend on it
  writeStorage(OPT_OUT_KEY, enabled ? "0" : "1");
  switch (optAction(enabled, ready)) {
    case "opt-out":
      posthog.opt_out_capturing(); // also drops whatever is still queued
      break;
    case "opt-in":
      posthog.opt_in_capturing();
      break;
    case "init":
      initAnalytics(); // first opt-in of a session that started opted out
      break;
    case "none":
      break;
  }
}

export function initAnalytics() {
  if (ready || !analyticsEnabled()) return;
  posthog.init(TOKEN, {
    api_host: "https://us.i.posthog.com",
    autocapture: false, // never capture clicked-element text (conversation leak)
    capture_pageview: false, // single-window desktop app — no page routes
    person_profiles: "identified_only",
    persistence: "localStorage",
  });
  // opt_out_capturing() persists in PostHog's own storage, so after
  // opt-out → restart → opt-in the client would boot opted out and drop
  // every capture below while the switch says on. Clear the stale flag
  // before the first capture of the session.
  if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing();
  ready = true;
  const platform = navigator.userAgent.includes("Electron") ? "desktop" : "browser";
  // one-time install marker — app_first_open counts installs (the closest
  // truth to "downloads that mattered"; raw download counts live on the
  // GitHub release assets)
  if (!readMigratedStorage(INSTALLED_KEY, INSTALLED_KEY_LEGACY)) {
    writeStorage(INSTALLED_KEY, new Date().toISOString());
    posthog.capture("app_first_open", { platform });
  }
  posthog.capture("app_opened", { platform });
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!ready || !analyticsEnabled()) return;
  posthog.capture(event, props);
}

// first-run onboarding gate (legacy key name kept so existing installs stay past the gate)
const GATE_KEY = "openfolks-email-gate";
const GATE_KEY_LEGACY = "omb-email-gate";
export function emailGateDone(): boolean {
  return Boolean(readMigratedStorage(GATE_KEY, GATE_KEY_LEGACY));
}
export function setEmailGateDone(status: "submitted" | "skipped") {
  writeStorage(GATE_KEY, status);
}
