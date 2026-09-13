import { describe, expect, it } from "vitest";

import { pathLeaf, shortPath, workingFolderLabel } from "./short-path";

describe("shortPath", () => {
  it("shortens home and real children of home", () => {
    expect(shortPath("/Users/ann", "/Users/ann")).toBe("~");
    expect(shortPath("/Users/ann/work", "/Users/ann")).toBe("~/work");
    expect(shortPath("C:\\Users\\ann\\work", "C:\\Users\\ann")).toBe("~\\work");
  });

  it("leaves siblings that merely share a prefix alone", () => {
    expect(shortPath("/Users/annex", "/Users/ann")).toBe("/Users/annex");
  });

  it("passes paths through when home is unknown", () => {
    expect(shortPath("/Users/ann/work", undefined)).toBe("/Users/ann/work");
  });
});

describe("workingFolderLabel", () => {
  it("hides private folk workspace ids behind a short label", () => {
    const id = "14199ffa-0335-496a-9abc-1234567890ab";
    expect(workingFolderLabel(`/Users/ann/.openfolks/workspaces/${id}`, { botId: id })).toBe("Workspace");
    expect(workingFolderLabel(`C:\\Users\\ann\\.openfolks\\workspaces\\${id}`, { botId: id })).toBe("Workspace");
    expect(workingFolderLabel(id)).toBe("Workspace");
  });

  it("keeps ordinary folder names", () => {
    expect(workingFolderLabel("/Users/ann/Projects/opencrew")).toBe("opencrew");
    expect(workingFolderLabel("C:\\Users\\ann\\code\\desk")).toBe("desk");
    expect(pathLeaf("/tmp/demo/")).toBe("demo");
  });
});
