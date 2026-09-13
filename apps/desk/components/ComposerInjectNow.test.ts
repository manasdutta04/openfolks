import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ComposerInjectNow, composerCanInjectNow } from "./ComposerInjectNow";

describe("composerCanInjectNow", () => {
  it("offers inject only while a turn is live and a send is waiting", () => {
    expect(composerCanInjectNow(true, false, 1)).toBe(true);
    expect(composerCanInjectNow(true, false, 2)).toBe(true);
  });

  it("keeps the square stop when nothing is queued", () => {
    expect(composerCanInjectNow(true, false, 0)).toBe(false);
  });

  it("does not offer inject on an idle or locked composer", () => {
    expect(composerCanInjectNow(false, false, 1)).toBe(false);
    expect(composerCanInjectNow(true, true, 1)).toBe(false);
  });
});

describe("ComposerInjectNow", () => {
  it("labels the green send control inject now", () => {
    const markup = renderToStaticMarkup(createElement(ComposerInjectNow, { onInject: () => undefined }));
    expect(markup).toContain("inject now");
    expect(markup).toContain("Inject queued message now");
    expect(markup).toContain("bg-success");
  });
});
