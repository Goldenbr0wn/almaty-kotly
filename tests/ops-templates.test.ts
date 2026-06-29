import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ops templates", () => {
  it("keeps Caddy pointed at the local app and redirects www to apex", () => {
    const caddyfile = readFileSync("ops/Caddyfile.example", "utf8");

    expect(caddyfile).toContain("www.alatau-service.com");
    expect(caddyfile).toContain("redir https://alatau-service.com{uri} permanent");
    expect(caddyfile).toContain("alatau-service.com {");
    expect(caddyfile).toContain("reverse_proxy 127.0.0.1:5173");
    expect(caddyfile).toContain("X-Content-Type-Options nosniff");
  });

  it("keeps launchd pointed at standalone server and external env file", () => {
    const plist = readFileSync("ops/alatau-service.launchd.plist.example", "utf8");

    expect(plist).toContain("com.alatau-service.web");
    expect(plist).toContain("source /Users/azat/.codex/secrets/alatau-supabase.env");
    expect(plist).toContain("node /Users/azat/Services/alatau-service/current/server.js");
    expect(plist).toContain("<key>HOSTNAME</key><string>127.0.0.1</string>");
    expect(plist).toContain("/Users/azat/Services/alatau-service/logs/web.out.log");
  });
});
