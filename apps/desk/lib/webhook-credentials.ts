import type { WebhookCredential } from "./webhooks.js";
import { readMigratedStorage, writeStorage } from "./storage-key.js";

const KEY = "openfolks-webhook-credentials";
const KEY_LEGACY = "omb-webhook-credentials";

type Store = Pick<Storage, "getItem" | "setItem"> | undefined;

function isCredential(value: unknown): value is WebhookCredential {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return [candidate.endpointUrl, candidate.secret, candidate.url].every(
    (part) => typeof part === "string" && part.length > 0,
  );
}

function readRaw(store: Store): string | null {
  if (store === webhookCredentialStore()) return readMigratedStorage(KEY, KEY_LEGACY);
  try {
    return store?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

/** Private webhook URLs are returned only when created or rotated. Keep that
 * one-time value in this app's local browser storage so changing tabs or
 * relaunching the desktop app does not force a surprise secret rotation. */
export function loadWebhookCredentials(store: Store): Record<string, WebhookCredential> {
  try {
    const raw = readRaw(store);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, WebhookCredential] => isCredential(entry[1])),
    );
  } catch {
    return {};
  }
}

export function saveWebhookCredential(store: Store, webhookId: string, credential: WebhookCredential): void {
  const credentials = loadWebhookCredentials(store);
  credentials[webhookId] = credential;
  if (store === webhookCredentialStore()) {
    writeStorage(KEY, JSON.stringify(credentials));
    return;
  }
  try {
    store?.setItem(KEY, JSON.stringify(credentials));
  } catch {
    // Storage is best-effort. The URL remains usable for this mount.
  }
}

export function removeWebhookCredential(store: Store, webhookId: string): void {
  const credentials = loadWebhookCredentials(store);
  delete credentials[webhookId];
  if (store === webhookCredentialStore()) {
    writeStorage(KEY, JSON.stringify(credentials));
    return;
  }
  try {
    store?.setItem(KEY, JSON.stringify(credentials));
  } catch {
    // A failed cleanup must not block deleting the webhook itself.
  }
}

export function webhookCredentialStore(): Store {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
