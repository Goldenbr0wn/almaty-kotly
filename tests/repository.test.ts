import { beforeEach, describe, expect, it } from "vitest";
import { getMemoryEvents, getLeadRepository, resetMemoryRepository } from "@/lib/leads/repository";

describe("memory lead repository", () => {
  beforeEach(() => {
    process.env.DATA_BACKEND = "memory";
    resetMemoryRepository();
  });

  it("creates one lead and one creation event", async () => {
    const repo = getLeadRepository();
    const lead = await repo.createLead({ name: "Азат", phone: "+77011234567", service: "Ремонт", model: "", district: "", comment: "", consent: true, company: "" });
    expect(lead.status).toBe("new");
    expect(await repo.listLeads()).toHaveLength(1);
    expect(getMemoryEvents()).toHaveLength(1);
  });

  it("updates status and records an event", async () => {
    const repo = getLeadRepository();
    const lead = await repo.createLead({ name: "Азат", phone: "+77011234567", service: "Ремонт", model: "", district: "", comment: "", consent: true, company: "" });
    const updated = await repo.updateLead(lead.id, { status: "scheduled", note: "На завтра" }, "owner@example.com");
    expect(updated.status).toBe("scheduled");
    expect(getMemoryEvents()[0].eventType).toBe("status_changed");
  });
});
