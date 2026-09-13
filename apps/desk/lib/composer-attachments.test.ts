// composeMessage with images, the image tag round-trip through
// transcript attachment splitting, and the mime gate the composer pastes through.
import { describe, expect, it } from "vitest";

import {
  appendPastedText,
  attachmentBasename,
  attachmentImageUrl,
  composeMessage,
  isImageFile,
  splitTranscriptAttachments,
  type ImageAttachment,
} from "./composer-attachments";

/** Exercises the spacing and empty-draft cases for pasted text insertion. */
function appendPastedTextTests() {
  /** Keeps an existing draft ahead of newly inserted pasted content. */
  function addsPastedContentAfterDraft() {
    expect(appendPastedText("Keep this", "Edit this too")).toBe("Keep this\n\nEdit this too");
  }

  /** Avoids duplicating a separator when the draft already ends with a newline. */
  function preservesExistingTrailingNewline() {
    expect(appendPastedText("Keep this\n", "Edit this too")).toBe("Keep this\nEdit this too");
  }

  /** Inserts pasted content directly when no draft exists yet. */
  function insertsIntoEmptyDraft() {
    expect(appendPastedText("", "Edit this too")).toBe("Edit this too");
  }

  it("adds pasted content after an existing draft", addsPastedContentAfterDraft);
  it("does not add a second separator when the draft ends with a newline", preservesExistingTrailingNewline);
  it("uses the pasted content directly for an empty draft", insertsIntoEmptyDraft);
}

describe("appendPastedText", appendPastedTextTests);

/** Builds a stable image attachment fixture for prompt and preview tests. */
function image(path: string): ImageAttachment {
  return {
    kind: "image",
    id: "i1",
    path,
    name: "shot.png",
    size: 1234,
    mime: "image/png",
  };
}

describe("composeMessage with images", () => {
  it("emits an attached-image tag carrying the server path", () => {
    const prompt = composeMessage("what is this?", [image("/home/u/.openfolks/attachments/abc.png")]);
    expect(prompt).toBe(
      'what is this?\n\n<attached-image path="/home/u/.openfolks/attachments/abc.png" />',
    );
  });

  it("escapes a hostile path the same way file paths are escaped", () => {
    const prompt = composeMessage("", [image('/x/")} onload="evil()')]);
    // every quote is entity-encoded, so the payload can never break out of
    // the attribute — the tag stays one well-formed element
    expect(prompt).toMatch(/<attached-image path="[^"]*" \/>/);
    expect(prompt).toContain("&quot;");
  });
});

describe("splitTranscriptAttachments", () => {
  it("splits tags out of a stored message and returns the paths", () => {
    const stored =
      'look at this\n\n<attached-image path="/a/b/one.png" />\n\n<attached-image path="/a/b/two.jpg" />';
    const { display, images, files } = splitTranscriptAttachments(stored);
    expect(display).toBe("look at this");
    expect(images).toEqual(["/a/b/one.png", "/a/b/two.jpg"]);
    expect(files).toEqual([]);
  });

  it("unescapes attribute entities so the path round-trips", () => {
    const stored = '<attached-image path="/a/b/&amp;x.png" />';
    const { images } = splitTranscriptAttachments(stored);
    expect(images).toEqual(["/a/b/&x.png"]);
  });

  it("hides file tags and uses their safe display names", () => {
    const stored =
      'review these\n\n<attached-file path="/tmp/one.pdf" name="Project &amp; plan.pdf" />\n\n' +
      '<attached-file name="folder\\notes&#10;final.txt" path="C:\\saved\\generated.txt" />';
    const { display, files } = splitTranscriptAttachments(stored);
    expect(display).toBe("review these");
    expect(files).toEqual([
      { path: "/tmp/one.pdf", name: "Project & plan.pdf" },
      { path: "C:\\saved\\generated.txt", name: "notes final.txt" },
    ]);
  });

  it("uses the saved basename for old file tags without a name", () => {
    const { display, files } = splitTranscriptAttachments(
      '<attached-file path="/home/me/.openfolks/attachments/report.pdf" />',
    );
    expect(display).toBe("");
    expect(files).toEqual([
      { path: "/home/me/.openfolks/attachments/report.pdf", name: "report.pdf" },
    ]);
  });

  it("does not decode unsupported or repeatedly encoded entities", () => {
    const { files } = splitTranscriptAttachments(
      '<attached-file path="/tmp/a.pdf" name="&amp;quot;draft&apos;.pdf" />',
    );
    expect(files[0]?.name).toBe("&quot;draft&apos;.pdf");
  });

  it("leaves malformed attachment tags visible", () => {
    const stored = '<attached-file name="missing-path.pdf" />';
    expect(splitTranscriptAttachments(stored)).toEqual({ display: stored, images: [], files: [] });
  });

  it("leaves inline and non-self-closing attachment examples visible", () => {
    const stored =
      'Example: <attached-file path="/tmp/inline.pdf" />\n' +
      '<attached-image path="/tmp/not-self-closing.png">';
    expect(splitTranscriptAttachments(stored)).toEqual({ display: stored, images: [], files: [] });
  });

  it("leaves plain text and other tags untouched", () => {
    const stored = '<pasted-text index="1">\nhi\n</pasted-text>';
    const { display, images, files } = splitTranscriptAttachments(stored);
    expect(display).toBe(stored);
    expect(images).toEqual([]);
    expect(files).toEqual([]);
  });
});

describe("attachmentBasename", () => {
  it("takes the final path segment on POSIX and Windows separators", () => {
    expect(attachmentBasename("/a/b/c.png")).toBe("c.png");
    expect(attachmentBasename("C:\\a\\b\\c.png")).toBe("c.png");
  });

  it("turns only generated image names into same-origin preview URLs", () => {
    expect(attachmentImageUrl("/a/b/123e4567-e89b-12d3-a456-426614174000.png")).toBe(
      "/api/attachments/123e4567-e89b-12d3-a456-426614174000.png",
    );
    expect(attachmentImageUrl("C:\\a\\b\\photo.webp")).toBe("/api/attachments/photo.webp");
    expect(attachmentImageUrl("https://attacker.example/tracker.png?cookie=1")).toBeNull();
    expect(attachmentImageUrl("/a/b/payload.svg")).toBeNull();
    expect(attachmentImageUrl("/a/b/not%2Fan-image.png")).toBeNull();
  });
});

describe("isImageFile", () => {
  it("accepts the served image mimes and rejects others", () => {
    expect(isImageFile({ type: "image/png", size: 10 })).toBe(true);
    expect(isImageFile({ type: "image/jpeg", size: 10 })).toBe(true);
    expect(isImageFile({ type: "image/webp", size: 10 })).toBe(true);
    expect(isImageFile({ type: "image/svg+xml", size: 10 })).toBe(false);
    expect(isImageFile({ type: "text/plain", size: 10 })).toBe(false);
  });
});
