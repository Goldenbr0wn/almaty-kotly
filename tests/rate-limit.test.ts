import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("rate limit", () => {
  beforeEach(() => resetRateLimit());

  it("allows requests under the limit", () => {
    expect(checkRateLimit("ip", 2, 1000)).toBe(true);
    expect(checkRateLimit("ip", 2, 1000)).toBe(true);
  });

  it("blocks after the limit", () => {
    expect(checkRateLimit("ip", 1, 1000)).toBe(true);
    expect(checkRateLimit("ip", 1, 1000)).toBe(false);
  });
});
