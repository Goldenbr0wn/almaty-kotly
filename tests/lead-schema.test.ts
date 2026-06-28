import { describe, expect, it } from "vitest";
import { getSupabaseEnvStatus } from "@/lib/env";
import { createLeadSchema, serviceTypes, updateLeadSchema } from "@/lib/leads/schema";

describe("lead schema", () => {
  it("accepts a valid lead", () => {
    const parsed = createLeadSchema.parse({
      name: "Азат",
      phone: "+7 701 123 45 67",
      service: "Диагностика",
      model: "NAVIEN ACE-13K",
      district: "Бостандыкский",
      comment: "Ошибка на дисплее",
      consent: true
    });
    expect(parsed.phone).toContain("701");
  });

  it("rejects missing consent and invalid service", () => {
    expect(() => createLeadSchema.parse({ name: "Азат", phone: "+77011234567", service: "Другое", consent: false })).toThrow();
  });

  it("rejects overlong comments", () => {
    expect(() => createLeadSchema.parse({ name: "Азат", phone: "+77011234567", service: "Ремонт", consent: true, comment: "x".repeat(1201) })).toThrow();
  });

  it("accepts status update", () => {
    expect(updateLeadSchema.parse({ status: "scheduled", note: "Завтра" }).status).toBe("scheduled");
  });

  it("accepts final visual site service options", () => {
    expect(serviceTypes).toContain("Диагностика");
    expect(serviceTypes).toContain("Чистка");
  });

  it("reports missing supabase env names without values", () => {
    function restore(name: string, value: string | undefined) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }

    const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const oldAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const oldRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const oldAdmins = process.env.ADMIN_EMAILS;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.ADMIN_EMAILS;

    expect(getSupabaseEnvStatus()).toEqual({
      ready: false,
      missing: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS"]
    });

    restore("NEXT_PUBLIC_SUPABASE_URL", oldUrl);
    restore("NEXT_PUBLIC_SUPABASE_ANON_KEY", oldAnon);
    restore("SUPABASE_SERVICE_ROLE_KEY", oldRole);
    restore("ADMIN_EMAILS", oldAdmins);
  });
});
