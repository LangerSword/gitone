import { describe, expect, it } from "vitest";
import { flagUrl } from "../lib/flagUrl";

describe("flagUrl", () => {
  it("stays same-origin relative so DOM and SSR markup match", () => {
    expect(flagUrl("us", 80)).toBe("/api/flag/w80/us.png");
    expect(flagUrl("gb-eng", 40)).toBe("/api/flag/w40/gb-eng.png");
    expect(flagUrl("xxx")).toBeNull();
  });
});
