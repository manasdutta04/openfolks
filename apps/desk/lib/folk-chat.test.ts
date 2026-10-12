import { describe, expect, it } from "vitest";
import { groupAcceptsUserMessages } from "./folk-chat";

describe("groupAcceptsUserMessages", () => {
  it("refuses folk-to-folk channels", () => {
    expect(groupAcceptsUserMessages({ dm: true })).toBe(false);
  });

  it("accepts team rooms", () => {
    expect(groupAcceptsUserMessages({})).toBe(true);
    expect(groupAcceptsUserMessages({ dm: false })).toBe(true);
  });
});
