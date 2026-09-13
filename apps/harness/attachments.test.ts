// attachments.ts: save + read-back, the mime allowlist, size ceiling, and
// the name-lock that keeps the serving route inside the attachments dir.
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  truncateSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The module reads DATA_DIR at import time, so the env var must be set
// before the import is evaluated.
const DATA_ROOT = mkdtempSync(join(tmpdir(), "omb-attachments-"));
process.env.OMB_DATA_DIR = join(DATA_ROOT, "data");

const {
  ATTACHMENTS_DIR,
  ATTACHMENTS_MAX_BYTES,
  ATTACHMENT_PARTIAL_MAX_AGE_MS,
  FILE_MAX_BYTES,
  IMAGE_MAX_BYTES,
  cleanupStaleAttachmentPartials,
  extensionForFileMime,
  extensionForMime,
  readAttachment,
  sanitizeSharedFileName,
  saveFile,
  saveImage,
  saveImageUpload,
  validateAttachmentUploadId,
} = await import("./attachments.ts");

const UPLOAD_A = "11111111-1111-4111-8111-111111111111";
const UPLOAD_B = "22222222-2222-4222-8222-222222222222";

describe("extensionForMime", () => {
  it("maps the accepted image mimes to extensions", () => {
    expect(extensionForMime("image/png")).toBe(".png");
    expect(extensionForMime("image/jpeg")).toBe(".jpg");
    expect(extensionForMime("image/gif")).toBe(".gif");
    expect(extensionForMime("image/webp")).toBe(".webp");
  });

  it("tolerates parameters and casing", () => {
    expect(extensionForMime("Image/PNG; charset=binary")).toBe(".png");
    expect(extensionForMime("  image/webp  ")).toBe(".webp");
  });

  it("refuses everything else — including svg, which executes script", () => {
    expect(extensionForMime("image/svg+xml")).toBeNull();
    expect(extensionForMime("text/plain")).toBeNull();
    expect(extensionForMime(undefined)).toBeNull();
  });
});

describe("saveImage", () => {
  beforeEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });
  afterEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });

  it("persists bytes under the attachments dir with a generated name", () => {
    const saved = saveImage(Buffer.from("png-bytes"), "image/png");
    expect(saved.path.startsWith(ATTACHMENTS_DIR)).toBe(true);
    expect(saved.path.endsWith(".png")).toBe(true);
    expect(saved.bytes).toBe(9);
    expect(saved.mime).toBe("image/png");
    if (process.platform !== "win32") {
      expect(statSync(ATTACHMENTS_DIR).mode & 0o777).toBe(0o700);
      expect(statSync(saved.path).mode & 0o777).toBe(0o600);
    }
  });

  it("round-trips through readAttachment with the right mime", () => {
    const saved = saveImage(Buffer.from("gif!"), "image/gif");
    const name = saved.path.split(/[\\/]/).pop()!;
    const back = readAttachment(name);
    expect(back?.bytes.toString()).toBe("gif!");
    expect(back?.mime).toBe("image/gif");
  });

  it("rejects unsupported mimes, empty bodies, and oversize bodies", () => {
    expect(() => saveImage(Buffer.from("x"), "image/svg+xml")).toThrow(/unsupported image type/);
    expect(() => saveImage(Buffer.alloc(0), "image/png")).toThrow(/empty/);
    expect(() => saveImage(Buffer.alloc(IMAGE_MAX_BYTES + 1), "image/png")).toThrow(/exceeds/);
  });

  it("makes UUID-keyed image retries idempotent without changing legacy callers", () => {
    const first = saveImage(Buffer.from("same"), "image/png", UPLOAD_A);
    const retry = saveImage(Buffer.from("same"), "image/png", UPLOAD_A.toUpperCase());
    expect(retry).toEqual(first);
    expect(readdirSync(ATTACHMENTS_DIR).filter((name) => !name.startsWith("."))).toEqual([`${UPLOAD_A}.png`]);

    expect(() => saveImage(Buffer.from("different"), "image/png", UPLOAD_A)).toThrow(/different image bytes/);
    expect(() => saveImage(Buffer.from("same"), "image/jpeg", UPLOAD_A)).toThrow(/another content type/);

    const legacyOne = saveImage(Buffer.from("same"), "image/png");
    const legacyTwo = saveImage(Buffer.from("same"), "image/png");
    expect(legacyOne.path).not.toBe(legacyTwo.path);
  });

  it("validates upload IDs before they can become filenames", () => {
    expect(validateAttachmentUploadId(UPLOAD_A.toUpperCase())).toBe(UPLOAD_A);
    for (const value of ["", "short", "../../escape", `${UPLOAD_A}.png`, "00000000-0000-0000-0000-000000000000"]) {
      expect(() => validateAttachmentUploadId(value)).toThrow(/UUID/);
    }
  });
});

describe("aggregate attachment storage", () => {
  beforeEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });
  afterEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });

  it("rejects new data at the aggregate ceiling without pruning committed attachments", () => {
    const referenced = saveImage(Buffer.from("x"), "image/png");
    truncateSync(referenced.path, ATTACHMENTS_MAX_BYTES);

    try {
      saveImage(Buffer.from("y"), "image/png");
      throw new Error("expected quota rejection");
    } catch (error) {
      expect(error).toMatchObject({ status: 507 });
      expect(error).toHaveProperty("message", expect.stringMatching(/storage is full/));
    }
    expect(existsSync(referenced.path)).toBe(true);
    expect(statSync(referenced.path).size).toBe(ATTACHMENTS_MAX_BYTES);
    expect(readdirSync(ATTACHMENTS_DIR)).toEqual([referenced.path.split(/[\\/]/).pop()!]);
  });

  it("counts concurrent reservations so uploads cannot race past the ceiling", async () => {
    const existing = saveImage(Buffer.from("x"), "image/png");
    truncateSync(existing.path, ATTACHMENTS_MAX_BYTES - 5);

    const first = saveFile((async function* () {
      yield Buffer.from("four");
    })(), "first.txt", "text/plain", { expectedBytes: 4 });

    expect(() => saveImage(Buffer.from("xx"), "image/png")).toThrow(/storage is full/);
    await expect(first).resolves.toMatchObject({ bytes: 4 });
  });

  it("lets an unknown-length stream use the exact space left below a reservation increment", async () => {
    const existing = saveImage(Buffer.from("x"), "image/png");
    truncateSync(existing.path, ATTACHMENTS_MAX_BYTES - 2);

    const saved = await saveFile((async function* () {
      yield Buffer.from("a");
    })(), "last-byte.txt", "text/plain");
    expect(saved.bytes).toBe(1);
    expect(() => saveImage(Buffer.from("b"), "image/png")).not.toThrow();
  });

  it("releases reservations and removes partials after failed uploads", async () => {
    const existing = saveImage(Buffer.from("x"), "image/png");
    truncateSync(existing.path, ATTACHMENTS_MAX_BYTES - 3);

    await expect(saveFile((async function* () {})(), "empty.txt", "text/plain", { expectedBytes: 3 }))
      .rejects.toThrow(/empty file/);
    expect(() => saveImage(Buffer.from("123"), "image/png")).not.toThrow();
    expect(readdirSync(ATTACHMENTS_DIR).every((name) => !name.endsWith(".partial"))).toBe(true);
  });

  it("cleans only stale upload partials, never committed or active-looking files", () => {
    saveImage(Buffer.from("kept"), "image/png", UPLOAD_A);
    const stale = `${ATTACHMENTS_DIR}/.openfolks-upload-${UPLOAD_A}-${UPLOAD_B}.partial`;
    const fresh = `${ATTACHMENTS_DIR}/.openfolks-upload-${UPLOAD_B}-${UPLOAD_A}.partial`;
    const unrelated = `${ATTACHMENTS_DIR}/notes.partial`;
    writeFileSync(stale, "stale");
    writeFileSync(fresh, "fresh");
    writeFileSync(unrelated, "not ours");
    const now = Date.now();
    const old = new Date(now - ATTACHMENT_PARTIAL_MAX_AGE_MS - 1_000);
    utimesSync(stale, old, old);

    expect(cleanupStaleAttachmentPartials(now)).toBe(1);
    expect(existsSync(stale)).toBe(false);
    expect(existsSync(fresh)).toBe(true);
    expect(existsSync(unrelated)).toBe(true);
    expect(existsSync(`${ATTACHMENTS_DIR}/${UPLOAD_A}.png`)).toBe(true);
  });

  it("counts fresh crash leftovers against quota, then reclaims them when stale", () => {
    const existing = saveImage(Buffer.from("x"), "image/png");
    truncateSync(existing.path, ATTACHMENTS_MAX_BYTES - 2);
    const orphan = `${ATTACHMENTS_DIR}/.openfolks-upload-${UPLOAD_A}-${UPLOAD_B}.partial`;
    writeFileSync(orphan, "xx");

    expect(() => saveImage(Buffer.from("y"), "image/png")).toThrow(/storage is full/);
    const old = new Date(Date.now() - ATTACHMENT_PARTIAL_MAX_AGE_MS - 1_000);
    utimesSync(orphan, old, old);
    expect(() => saveImage(Buffer.from("y"), "image/png")).not.toThrow();
    expect(existsSync(orphan)).toBe(false);
  });

  it("reclaims an inactive partial immediately when its upload ID retries", async () => {
    const existing = saveImage(Buffer.from("x"), "image/png");
    truncateSync(existing.path, ATTACHMENTS_MAX_BYTES - 3);
    const orphan = `${ATTACHMENTS_DIR}/.openfolks-upload-${UPLOAD_A}-${UPLOAD_B}.partial`;
    writeFileSync(orphan, "old");

    const saved = await saveFile((async function* () {
      yield Buffer.from("new");
    })(), "retry.txt", "text/plain", { uploadId: UPLOAD_A, expectedBytes: 3 });
    expect(saved.path.endsWith(`${UPLOAD_A}.txt`)).toBe(true);
    expect(existsSync(orphan)).toBe(false);
  });
});

describe("readAttachment name lock", () => {
  beforeEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });
  afterEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });

  it("refuses traversal, dotfiles, and names the saver never writes", () => {
    expect(readAttachment("..%2F..%2Fconfig.json")).toBeNull();
    expect(readAttachment(".env")).toBeNull();
    expect(readAttachment("a/b.png")).toBeNull();
    expect(readAttachment("no-extension")).toBeNull();
    expect(readAttachment("uuid.jpeg")).toBeNull(); // saved as .jpg
  });
});

describe("shared files", () => {
  beforeEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });
  afterEach(() => {
    rmSync(ATTACHMENTS_DIR, { recursive: true, force: true });
  });

  it("allows useful document mimes but not executables, archives, or active markup", () => {
    expect(extensionForFileMime("text/plain; charset=utf-8")).toBe(".txt");
    expect(extensionForFileMime("application/pdf")).toBe(".pdf");
    expect(extensionForFileMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(".docx");
    expect(extensionForFileMime("application/zip")).toBeNull();
    expect(extensionForFileMime("application/x-msdownload")).toBeNull();
    expect(extensionForFileMime("application/octet-stream")).toBeNull();
    expect(extensionForFileMime("text/html")).toBeNull();
    expect(extensionForFileMime("image/svg+xml")).toBeNull();
  });

  it("sanitizes the display name and derives its extension from the mime", () => {
    expect(sanitizeSharedFileName("  Quarterly: report.exe  ", "application/pdf")).toBe("Quarterly_ report.pdf");
    expect(sanitizeSharedFileName("notes", "text/markdown")).toBe("notes.md");
    expect(() => sanitizeSharedFileName("../../secret.txt", "text/plain")).toThrow(/filename, not a path/);
    expect(() => sanitizeSharedFileName("..\\..\\secret.txt", "text/plain")).toThrow(/filename, not a path/);
    expect(() => sanitizeSharedFileName("..%2F..%2Fsecret.txt", "text/plain")).toThrow(/filename, not a path/);
    expect(() => sanitizeSharedFileName("notes.txt", "application/zip")).toThrow(/supported document/);
  });

  it("streams a file under a generated name with private permissions", async () => {
    async function* chunks() {
      yield Buffer.from("first ");
      yield Buffer.from("second");
    }
    const saved = await saveFile(chunks(), "Meeting notes.md", "Text/Markdown; charset=utf-8");
    expect(saved.name).toBe("Meeting notes.md");
    expect(saved.mime).toBe("text/markdown");
    expect(saved.bytes).toBe(12);
    expect(saved.path.startsWith(ATTACHMENTS_DIR)).toBe(true);
    expect(saved.path).toMatch(/[0-9a-f-]+\.md$/);
    expect(readFileSync(saved.path, "utf8")).toBe("first second");
    if (process.platform !== "win32") {
      expect(statSync(ATTACHMENTS_DIR).mode & 0o777).toBe(0o700);
      expect(statSync(saved.path).mode & 0o777).toBe(0o600);
    }
  });

  it("rejects empty and oversized streams without leaving partial files", async () => {
    await expect(saveFile((async function* () {})(), "empty.txt", "text/plain")).rejects.toThrow(/empty file/);
    expect(readdirSync(ATTACHMENTS_DIR)).toEqual([]);

    async function* tooLarge() {
      yield Buffer.from("partial");
      yield Buffer.alloc(FILE_MAX_BYTES);
    }
    await expect(saveFile(tooLarge(), "large.pdf", "application/pdf")).rejects.toMatchObject({ status: 413 });
    expect(readdirSync(ATTACHMENTS_DIR)).toEqual([]);
  });

  it("deduplicates concurrent and later file retries by upload ID", async () => {
    const makeChunks = async function* () {
      yield Buffer.from("same ");
      await Promise.resolve();
      yield Buffer.from("document");
    };
    const [first, concurrentRetry] = await Promise.all([
      saveFile(makeChunks(), "Report.pdf", "application/pdf", { uploadId: UPLOAD_A, expectedBytes: 13 }),
      saveFile(makeChunks(), "Report.pdf", "application/pdf", { uploadId: UPLOAD_A, expectedBytes: 13 }),
    ]);
    expect(concurrentRetry.path).toBe(first.path);
    expect(readFileSync(first.path, "utf8")).toBe("same document");
    expect(readdirSync(ATTACHMENTS_DIR)).toEqual([`${UPLOAD_A}.pdf`]);

    await expect(saveFile((async function* () {
      yield Buffer.from("other bytes");
    })(), "Report.pdf", "application/pdf", { uploadId: UPLOAD_A }))
      .rejects.toMatchObject({ status: 409 });
    expect(readFileSync(first.path, "utf8")).toBe("same document");
  });

  it("serializes the upload ID namespace across image and document routes", async () => {
    let started!: () => void;
    let finish!: () => void;
    const didStart = new Promise<void>((resolve) => { started = resolve; });
    const mayFinish = new Promise<void>((resolve) => { finish = resolve; });
    const document = saveFile((async function* () {
      yield Buffer.from("first");
      started();
      await mayFinish;
      yield Buffer.from("second");
    })(), "race.pdf", "application/pdf", { uploadId: UPLOAD_A, expectedBytes: 11 });

    await didStart;
    const image = saveImageUpload(Buffer.from("image"), "image/png", UPLOAD_A);
    finish();
    await expect(document).resolves.toMatchObject({ bytes: 11 });
    await expect(image).rejects.toMatchObject({ status: 409 });
    expect(readdirSync(ATTACHMENTS_DIR)).toEqual([`${UPLOAD_A}.pdf`]);
  });
});
