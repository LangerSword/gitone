import { describe, expect, it } from "vitest";
import { GET } from "../app/api/health/route";

describe("/health", () => {
  it("returns a small stable JSON status", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true });
  });
});
