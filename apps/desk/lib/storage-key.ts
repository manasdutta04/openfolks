/** Read a localStorage value, migrating once from a legacy key if needed. */
export function readMigratedStorage(key: string, legacyKey: string): string | null {
  try {
    const current = localStorage.getItem(key);
    if (current != null) return current;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy == null) return null;
    localStorage.setItem(key, legacy);
    localStorage.removeItem(legacyKey);
    return legacy;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — drafts are best-effort */
  }
}

export function removeStorage(key: string, legacyKey?: string): void {
  try {
    localStorage.removeItem(key);
    if (legacyKey) localStorage.removeItem(legacyKey);
  } catch {
    /* ignore */
  }
}
