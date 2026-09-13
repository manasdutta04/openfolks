import { describe, expect, it } from "vitest";
import {
  beginBrowserPanelOperation,
  browserPanelOperationPending,
} from "./browser-panel-operation";

describe("browser panel operation handoff", () => {
  it("keeps a folk locked until every overlapping operation finishes", () => {
    const finishFirst = beginBrowserPanelOperation("folk-a");
    const finishSecond = beginBrowserPanelOperation("folk-a");

    expect(browserPanelOperationPending("folk-a")).toBe(true);
    expect(browserPanelOperationPending("folk-b")).toBe(false);
    finishFirst();
    expect(browserPanelOperationPending("folk-a")).toBe(true);
    finishSecond();
    expect(browserPanelOperationPending("folk-a")).toBe(false);
  });

  it("makes operation cleanup idempotent", () => {
    const finish = beginBrowserPanelOperation("folk-a");
    finish();
    finish();
    expect(browserPanelOperationPending("folk-a")).toBe(false);
  });
});
