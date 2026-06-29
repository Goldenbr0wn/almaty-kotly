import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("secret scan command", () => {
  it("is present and configured with concrete token detectors", () => {
    expect(existsSync("scripts/secret-scan.mjs")).toBe(true);
    const source = readFileSync("scripts/secret-scan.mjs", "utf8");

    expect(source).toContain("private-key");
    expect(source).toContain("github-token");
    expect(source).toContain("telegram-token");
    expect(source).toContain("long-secret-assignment");
    expect(source).toContain("--others");
    expect(source).toContain("--exclude-standard");
    expect(source).toContain("forbidden secret-like path is present in the workspace");
  });
});
