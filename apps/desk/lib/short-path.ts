/** ~ for the home folder, so a path reads at a glance. Only home itself or a
 * real child of home shortens — /Users/annex must not render as ~ex when home
 * is /Users/ann. */
export function shortPath(p: string, home: string | undefined): string {
  if (!home || !p.startsWith(home)) return p;
  const rest = p.slice(home.length);
  return rest === "" || rest.startsWith("/") || rest.startsWith("\\") ? `~${rest}` : p;
}

const UUID_FOLDER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Last path segment, without a trailing slash. */
export function pathLeaf(p: string): string {
  return p.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || p;
}

/** Chip label for a working folder. Private folk workspaces live under
 * …/workspaces/<botId>/ — showing the UUID is noise, so those read as a
 * short friendly name. Real project folders keep their leaf name. */
export function workingFolderLabel(
  path: string,
  opts?: { botId?: string; privateLabel?: string },
): string {
  const leaf = pathLeaf(path);
  const privateLabel = opts?.privateLabel ?? "Workspace";
  if (opts?.botId && leaf === opts.botId) return privateLabel;
  if (/(?:^|[\\/])workspaces[\\/]/i.test(path) && UUID_FOLDER.test(leaf)) return privateLabel;
  if (UUID_FOLDER.test(leaf)) return privateLabel;
  return leaf;
}
