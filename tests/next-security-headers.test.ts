import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Next.js security headers", () => {
  it("sets a conservative Permissions-Policy header for every route", () => {
    const config = readFileSync("next.config.mjs", "utf8");

    expect(config).toContain("async headers()");
    expect(config).toContain("source: \"/:path*\"");
    expect(config).toContain("Permissions-Policy");
    expect(config).toContain("camera=(), microphone=(), geolocation=(), payment=()");
  });
});
