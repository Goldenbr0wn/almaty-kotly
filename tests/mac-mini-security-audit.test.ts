import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mac mini security audit script", () => {
  it("audits macOS firewall and remote login without mutating host state", () => {
    const script = readFileSync("scripts/mac-mini-security-audit.mjs", "utf8");

    expect(script).toContain("socketfilterfw");
    expect(script).toContain("--getglobalstate");
    expect(script).toContain("--getstealthmode");
    expect(script).toContain("lower.includes(\" off\")");
    expect(script).toContain("-getremotelogin");
    expect(script).toContain("macOS application firewall is not enabled");
    expect(script).toContain("remote login is enabled; confirm SSH is key-only");
    expect(script).not.toContain("--setglobalstate");
    expect(script).not.toContain("-setremotelogin");
    expect(script).not.toContain("systemsetup -set");
  });
});
