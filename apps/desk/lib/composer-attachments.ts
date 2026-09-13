// What is attached to the next message: text too long for the input or a
// file dropped onto the window. Chips fold back into a normal prompt on
// send, so every driver receives the same message shape.
export type PasteAttachment = {
  kind: "paste";
  id: string;
  text: string;
  size: number;
  lines: number;
};

export type FileAttachment = {
  kind: "file";
  id: string;
  path: string;
  name: string;
  size: number;
};

export type ImageAttachment = {
  kind: "image";
  id: string;
  path: string;
  name: string;
  size: number;
  mime: string;
};

export type Attachment = PasteAttachment | FileAttachment | ImageAttachment;

export function isAttachment(value: unknown): value is Attachment {
  if (!value || typeof value !== "object") return false;
  const attachment = value as Record<string, unknown>;
  if (typeof attachment.id !== "string" || !validSize(attachment.size)) return false;
  if (attachment.kind === "paste") {
    return (
      typeof attachment.text === "string" &&
      typeof attachment.lines === "number" &&
      Number.isInteger(attachment.lines) &&
      attachment.lines >= 1
    );
  }
  if (attachment.kind === "file") {
    return (
      typeof attachment.path === "string" &&
      attachment.path.length > 0 &&
      typeof attachment.name === "string"
    );
  }
  if (attachment.kind === "image") {
    return (
      typeof attachment.path === "string" &&
      attachment.path.length > 0 &&
      typeof attachment.name === "string" &&
      typeof attachment.mime === "string" &&
      attachment.mime.startsWith("image/")
    );
  }
  return false;
}

function validSize(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Past this, a paste stops reading as typing and becomes an attachment.
 * Long-but-narrow (a stack trace, a log) counts by line, not just chars. */
export const PASTE_CHARS = 900;
export const PASTE_LINES = 12;

export function isLongPaste(text: string): boolean {
  return text.length >= PASTE_CHARS || countLines(text) >= PASTE_LINES;
}

export function countLines(text: string): number {
  return text.split("\n").length;
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `a${Math.random().toString(36).slice(2)}`;
}

export function fileAttachment(name: string, path: string, size: number): FileAttachment {
  return { kind: "file", id: newId(), path, name, size };
}

/** Matches the server's IMAGE_MAX_BYTES — checked client-side so an
 * oversized paste is refused before the upload starts, not mid-stream. */
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export function isImageFile(file: { type: string; size: number }): boolean {
  return (
    file.type.startsWith("image/") &&
    ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type.split(";")[0]!.trim().toLowerCase())
  );
}

/** Persist a pasted image server-side and return the attachment chip data.
 * The server writes ~/.openfolks/attachments/<uuid>.<ext> and answers
 * with the path; the prompt references that path so every CLI can open it. */
export async function imageAttachmentFromFile(file: File): Promise<ImageAttachment | null> {
  if (!isImageFile(file)) return null;
  if (file.size > IMAGE_MAX_BYTES) throw Object.assign(new Error(`${file.name} exceeds 10 MB`), { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const response = await fetch("/api/attachments", {
    method: "POST",
    headers: { "content-type": file.type },
    body: bytes,
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => ({ error: response.statusText }))) as { error?: string };
    throw Object.assign(new Error(detail.error ?? "upload failed"), { status: response.status });
  }
  const saved = (await response.json()) as { path: string; mime: string; bytes: number };
  return { kind: "image", id: newId(), path: saved.path, name: file.name || "pasted image", size: saved.bytes, mime: saved.mime };
}

export function pasteAttachment(text: string): PasteAttachment {
  const id = newId();
  // measured once, here: a chip re-renders on every keystroke in the
  // composer, and encoding half a megabyte each time would be felt
  return { kind: "paste", id, text, size: byteLength(text), lines: countLines(text) };
}

/** Move a pasted attachment into the editable composer draft without
 * running the text back through the paste threshold. */
export function appendPastedText(text: string, pasted: string): string {
  if (!text) return pasted;
  return `${text}${text.endsWith("\n") ? "" : "\n\n"}${pasted}`;
}

export const INLINE_DROP_LIMIT = 512 * 1024;

export type DroppedFile = Pick<File, "name" | "size" | "type" | "text">;

/** Turn a browser drop into composer attachments. Electron-backed files
 * keep their disk path; small pathless text drops keep their contents.
 * Promise.all preserves the user's drop order even when text reads finish
 * in a different order. */
export async function attachmentsFromDroppedFiles<T extends DroppedFile>(
  files: readonly T[],
  getPath: (file: T) => string,
): Promise<{ attachments: Attachment[]; rejectedNames: string[] }> {
  const results = await Promise.all(
    files.map(async (file) => {
      let path = "";
      try {
        path = getPath(file);
      } catch {
        // A browser or older desktop shell has no disk path to expose.
      }
      if (path) return { attachment: fileAttachment(file.name, path, file.size) };
      if (isInlineText(file) && file.size <= INLINE_DROP_LIMIT) {
        try {
          return { attachment: pasteAttachment(await file.text()) };
        } catch {
          // Treat an unreadable browser drag like any other pathless file.
        }
      }
      return { rejectedName: file.name };
    }),
  );

  return {
    attachments: results.flatMap((result) =>
      "attachment" in result && result.attachment ? [result.attachment] : [],
    ),
    rejectedNames: results.flatMap((result) =>
      "rejectedName" in result && result.rejectedName ? [result.rejectedName] : [],
    ),
  };
}

function isInlineText(file: DroppedFile): boolean {
  return file.type.startsWith("text/") || file.type === "application/json";
}

/** What the paste actually weighs — String#length counts UTF-16 units, so
 * it reads a third under on accented text and half under on CJK. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** "12 lines, 3.4 KB" — what the chip says under the preview. */
export function pasteSummary(a: { lines: number; size: number }): string {
  return `${a.lines} lines, ${formatSize(a.size)}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The prompt the bot receives: what was typed, then one block per
 * attachment. Tagged blocks rather than fences — pasted code and markdown
 * carry fences of their own, and nesting them loses the boundary. A file
 * needs only its path: every driver here is an agent that can open it. */
export function composeMessage(text: string, attachments: Attachment[]): string {
  const parts = [text.trim()];
  attachments.forEach((a, i) => {
    if (a.kind === "paste") {
      parts.push(`<pasted-text index="${i + 1}">\n${a.text}\n</pasted-text>`);
    } else if (a.kind === "image") {
      parts.push(`<attached-image path="${escapeAttribute(a.path)}" />`);
    } else {
      parts.push(`<attached-file path="${escapeAttribute(a.path)}" />`);
    }
  });
  return parts.filter(Boolean).join("\n\n");
}

/** File paths are untrusted prompt content. Keep them inside the quoted
 * attribute even when a filename contains XML characters or line breaks. */
export function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\t", "&#9;")
    .replaceAll("\r", "&#13;")
    .replaceAll("\n", "&#10;");
}

export type TranscriptFileAttachment = {
  path: string;
  name: string;
};

export type TranscriptAttachments = {
  display: string;
  images: string[];
  files: TranscriptFileAttachment[];
};

/** Decode only entities emitted by escapeAttribute. A second encoded pass
 * stays encoded, rather than turning attacker-controlled text into markup. */
function decodeAttachmentAttribute(value: string): string {
  return value.replace(/&(quot|lt|gt|amp);|&#(9|10|13);/g, (entity, named: string | undefined, numeric: string | undefined) => {
    if (numeric === "9") return "\t";
    if (numeric === "10") return "\n";
    if (numeric === "13") return "\r";
    if (named === "quot") return '"';
    if (named === "lt") return "<";
    if (named === "gt") return ">";
    if (named === "amp") return "&";
    return entity;
  });
}

/** Keep transcript-provided names compact and visually honest. File chips
 * are deliberately not links, but control and bidi characters can still
 * make an untrusted name misleading. */
function transcriptFileName(path: string, suppliedName?: string): string {
  const decoded = suppliedName ? decodeAttachmentAttribute(suppliedName) : attachmentBasename(path);
  const clean = (value: string) => Array.from(value, (character) => {
    const code = character.codePointAt(0) ?? 0;
    const control = code <= 31 || (code >= 127 && code <= 159);
    const bidiControl = (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
    return control || bidiControl ? " " : character;
  }).join("").replace(/\s+/g, " ").trim();
  const safe = clean(attachmentBasename(decoded));
  const fallback = clean(attachmentBasename(path));
  return Array.from(safe || fallback || "Attached file").slice(0, 180).join("");
}

/** Split a stored user message into its display text and attachments for
 * transcript rendering. Prompt-only tags never show in the bubble. */
export function splitTranscriptAttachments(text: string): TranscriptAttachments {
  const images: string[] = [];
  const files: TranscriptFileAttachment[] = [];
  const display = text.replace(
    /^[\t ]*<attached-(image|file)\b((?:[\t ]+[A-Za-z_:][\w:.-]*="[^"\r\n]*")*)[\t ]*\/>[\t ]*(?:\r?\n)?/gm,
    (match, kind: "image" | "file", rawAttributes: string) => {
      const attributes = new Map<string, string>();
      for (const attribute of rawAttributes.matchAll(/\s+([A-Za-z_:][\w:.-]*)="([^"]*)"/g)) {
        if (!attributes.has(attribute[1]!)) attributes.set(attribute[1]!, attribute[2]!);
      }
      const rawPath = attributes.get("path");
      if (rawPath === undefined) return match;
      const path = decodeAttachmentAttribute(rawPath);
      if (!path) return match;
      if (kind === "image") images.push(path);
      else files.push({ path, name: transcriptFileName(path, attributes.get("name")) });
      return "";
    },
  );
  return { display: display.trim(), images, files };
}

/** Kept for callers outside the desktop bundle that used the old helper. */
export function splitAttachedImages(text: string): { display: string; images: string[] } {
  const { display, images } = splitTranscriptAttachments(text);
  return { display, images };
}

/** The bare filename a saved attachment path ends in — what the serving
 * route expects. Works for POSIX and Windows separators. */
export function attachmentBasename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] ?? "";
}

/** The renderer never loads a transcript-provided URL directly. Only names
 * the attachment server itself can have generated become same-origin image
 * URLs; malformed and executable-image paths render nothing, while a string
 * that looks remote can at most resolve to a local generated filename. */
export function attachmentImageUrl(path: string): string | null {
  const name = attachmentBasename(path);
  if (!/^[A-Za-z0-9-]+\.(png|jpg|gif|webp)$/.test(name)) return null;
  return `/api/attachments/${encodeURIComponent(name)}`;
}

/** One intake path for files arriving by drop OR by the composer's attach
 * button, so a picked file and a dropped one can never behave differently.
 * The image uploader is injected: the caller owns the network, this owns
 * the ordering and the sentence the user reads when something is refused. */
export async function intakeFiles<T extends DroppedFile & { type: string }>(
  _files: readonly T[],
  _opts: {
    allowImages: boolean;
    getPath: (file: T) => string;
    uploadImage: (file: T) => Promise<Attachment | null>;
  },
): Promise<{ attachments: Attachment[]; notice: string | null }> {
  const files = [..._files];
  const { allowImages, getPath, uploadImage } = _opts;
  const attachments: Attachment[] = [];
  const rejectedNames: string[] = [];
  const imageErrors: string[] = [];
  // Finish each selected file in sequence so the chips retain the order in
  // which the user chose or dropped them.
  for (const file of files) {
    if (allowImages && isImageFile(file)) {
      try {
        const attachment = await uploadImage(file);
        if (attachment) attachments.push(attachment);
      } catch (err) {
        imageErrors.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      continue;
    }
    const result = await attachmentsFromDroppedFiles([file], getPath);
    attachments.push(...result.attachments);
    rejectedNames.push(...result.rejectedNames);
  }
  const pathless = rejectedNames.length
    ? `${rejectedNames.join(", ")} — that file has no path on disk. Save it first, then attach it from Finder.`
    : null;
  const failed = imageErrors.length ? imageErrors.join("; ") : null;
  return {
    attachments,
    notice: pathless && failed ? `${pathless} (${failed})` : (pathless ?? failed),
  };
}
