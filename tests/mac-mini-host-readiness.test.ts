import { describe, expect, it } from "vitest";
import { evaluateMacMiniHostReadiness } from "@/lib/system/mac-mini-host-readiness";

describe("mac mini host readiness", () => {
  it("blocks cutover when DNS still points away from the Mac mini and HTTPS ports are closed", () => {
    const report = evaluateMacMiniHostReadiness({
      hostname: "Mac-mini-Azat.local",
      os: "macOS 26.5.1",
      localIp: "192.168.8.12",
      publicIp: "85.117.106.31",
      envFilePath: "/Users/azat/.codex/secrets/alatau-supabase.env",
      envFileExists: false,
      caddyInstalled: false,
      launchdLabel: "com.alatau-service.web",
      launchdLoaded: false,
      systemSleepDisabled: false,
      expectedLocalIp: "192.168.8.12",
      dnsARecords: ["76.76.21.21"],
      expectedDnsARecords: ["85.117.106.31"],
      ports: [
        { port: 80, listening: false },
        { port: 443, listening: false },
        { port: 5173, listening: false }
      ],
      currentRuntimeBackend: "memory"
    });

    expect(report.ok).toBe(false);
    expect(report.blockers).toContain("domain DNS A record does not point to the Mac mini public endpoint");
    expect(report.blockers).toContain("runtime env file is missing at /Users/azat/.codex/secrets/alatau-supabase.env");
    expect(report.blockers).toContain("Caddy is not installed or not in PATH");
    expect(report.blockers).toContain("launchd service com.alatau-service.web is not loaded");
    expect(report.blockers).toContain("system sleep is not disabled for server runtime");
    expect(report.blockers).toContain("port 80 is not listening locally");
    expect(report.blockers).toContain("port 443 is not listening locally");
    expect(report.blockers).toContain("current production runtime is memory-backed, not live Supabase/Postgres");
    expect(report.nextActions).toContain("install a filled copy of ops/alatau-supabase.env.template at /Users/azat/.codex/secrets/alatau-supabase.env with mode 0600");
    expect(report.nextActions).toContain("run npm run mac-mini:caddy:dry-run, then after approval install Caddy with bash ops/caddy-install.sh --execute");
    expect(report.nextActions).toContain("after Caddy is installed, run npm run mac-mini:caddy-service:dry-run, then after approval install the Caddyfile and restart Caddy with ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute");
    expect(report.nextActions).toContain("keep DNS on Vercel until local 80/443 and router forwarding pass, then update the Porkbun A record to the Mac mini public endpoint");
  });

  it("passes when host, DNS, proxy ports, and live database mode are aligned", () => {
    const report = evaluateMacMiniHostReadiness({
      hostname: "Mac-mini-Azat.local",
      os: "macOS 26.5.1",
      localIp: "192.168.8.12",
      publicIp: "85.117.106.31",
      envFilePath: "/Users/azat/.codex/secrets/alatau-supabase.env",
      envFileExists: true,
      caddyInstalled: true,
      launchdLabel: "com.alatau-service.web",
      launchdLoaded: true,
      systemSleepDisabled: true,
      expectedLocalIp: "192.168.8.12",
      dnsARecords: ["85.117.106.31"],
      expectedDnsARecords: ["85.117.106.31"],
      ports: [
        { port: 80, listening: true },
        { port: 443, listening: true },
        { port: 5173, listening: true }
      ],
      currentRuntimeBackend: "supabase"
    });

    expect(report.ok).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.nextActions).toEqual([]);
  });
});
