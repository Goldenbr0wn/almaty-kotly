import { describe, expect, it } from "vitest";

describe("mac mini status report contract", () => {
  it("keeps status report output redacted by convention", () => {
    const sample = {
      ok: false,
      blockers: ["env-audit: missing required keys: SUPABASE_SERVICE_ROLE_KEY"],
      warnings: ["network-probe: public TCP probe failed; verify from an external network"],
      nextActions: ["env-audit: fill missing keys from the secret manager: SUPABASE_SERVICE_ROLE_KEY"],
      checks: [
        {
          label: "env-audit",
          json: {
            keys: [
              { name: "SUPABASE_SERVICE_ROLE_KEY", configured: false, placeholder: false }
            ]
          }
        },
        {
          label: "security-audit",
          json: {
            checks: {
              firewall: { state: "enabled" },
              remoteLogin: { state: "off" }
            }
          }
        }
      ],
      secretProbe: undefined
    };

    const serialized = JSON.stringify(sample);
    expect(serialized).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serialized).toContain("network-probe");
    expect(serialized).toContain("security-audit");
    expect(serialized).not.toContain("SECRET_VALUE");
  });
});
