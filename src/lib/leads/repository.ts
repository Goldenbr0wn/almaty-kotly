import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { getDataBackend, requireServerEnv } from "@/lib/env";
import type { CreateLeadInput, Lead, LeadEvent, LeadStatus, UpdateLeadInput } from "@/lib/leads/schema";

export type LeadRepository = {
  createLead(input: CreateLeadInput, meta?: { source?: string }): Promise<Lead>;
  listLeads(): Promise<Lead[]>;
  updateLead(id: string, input: UpdateLeadInput, actorEmail: string): Promise<Lead>;
  health(): Promise<{ ok: boolean; backend: string }>;
};

let memoryLeads: Lead[] = [];
let memoryEvents: LeadEvent[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function toLead(input: CreateLeadInput, source = "web"): Lead {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    name: input.name,
    phone: input.phone,
    service: input.service,
    model: input.model || "",
    district: input.district || "",
    comment: input.comment || "",
    status: "new",
    source
  };
}

export function resetMemoryRepository(): void {
  memoryLeads = [];
  memoryEvents = [];
}

export function getMemoryEvents(): LeadEvent[] {
  return [...memoryEvents];
}

function createMemoryRepository(): LeadRepository {
  return {
    async createLead(input, meta) {
      const lead = toLead(input, meta?.source);
      memoryLeads.unshift(lead);
      memoryEvents.unshift({
        id: crypto.randomUUID(),
        leadId: lead.id,
        actorEmail: null,
        eventType: "created",
        fromStatus: null,
        toStatus: "new",
        note: "",
        createdAt: nowIso()
      });
      return lead;
    },
    async listLeads() {
      return [...memoryLeads];
    },
    async updateLead(id, input, actorEmail) {
      const lead = memoryLeads.find((item) => item.id === id);
      if (!lead) throw new Error("Lead not found");
      const fromStatus = lead.status;
      if (input.status) lead.status = input.status;
      lead.updatedAt = nowIso();
      if (input.status && input.status !== fromStatus) {
        memoryEvents.unshift({
          id: crypto.randomUUID(),
          leadId: id,
          actorEmail,
          eventType: "status_changed",
          fromStatus,
          toStatus: input.status,
          note: input.note || "",
          createdAt: nowIso()
        });
      } else if (input.note) {
        memoryEvents.unshift({
          id: crypto.randomUUID(),
          leadId: id,
          actorEmail,
          eventType: "note_added",
          fromStatus: null,
          toStatus: null,
          note: input.note,
          createdAt: nowIso()
        });
      }
      return { ...lead };
    },
    async health() {
      return { ok: true, backend: "memory" };
    }
  };
}

function createSupabaseRepository(): LeadRepository {
  const supabase = createClient(
    requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  return {
    async createLead(input, meta) {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: input.name,
          phone: input.phone,
          service: input.service,
          boiler_model: input.model || "",
          district: input.district || "",
          comment: input.comment || "",
          source: meta?.source || "web"
        })
        .select("id, created_at, updated_at, name, phone, service, boiler_model, district, comment, status, source")
        .single();
      if (error) throw error;
      await supabase.from("lead_events").insert({ lead_id: data.id, event_type: "created", to_status: "new" });
      return mapSupabaseLead(data);
    },
    async listLeads() {
      const { data, error } = await supabase
        .from("leads")
        .select("id, created_at, updated_at, name, phone, service, boiler_model, district, comment, status, source")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapSupabaseLead);
    },
    async updateLead(id, input, actorEmail) {
      const { data: current, error: currentError } = await supabase
        .from("leads")
        .select("status")
        .eq("id", id)
        .single();
      if (currentError) throw currentError;
      const patch: Record<string, string> = {};
      if (input.status) patch.status = input.status;
      const { data, error } = await supabase
        .from("leads")
        .update(patch)
        .eq("id", id)
        .select("id, created_at, updated_at, name, phone, service, boiler_model, district, comment, status, source")
        .single();
      if (error) throw error;
      await supabase.from("lead_events").insert({
        lead_id: id,
        actor_email: actorEmail,
        event_type: input.status && input.status !== current.status ? "status_changed" : "note_added",
        from_status: current.status,
        to_status: input.status || current.status,
        note: input.note || ""
      });
      return mapSupabaseLead(data);
    },
    async health() {
      const { error } = await supabase.from("leads").select("id", { count: "exact", head: true });
      return { ok: !error, backend: "supabase" };
    }
  };
}

function createPostgresRepository(): LeadRepository {
  const sql = postgres(requireServerEnv("SUPABASE_DB_URL"), {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: "require"
  });

  return {
    async createLead(input, meta) {
      const [row] = await sql`
        insert into public.leads (name, phone, service, boiler_model, district, comment, source)
        values (${input.name}, ${input.phone}, ${input.service}, ${input.model || ""}, ${input.district || ""}, ${input.comment || ""}, ${meta?.source || "web"})
        returning id, created_at, updated_at, name, phone, service, boiler_model, district, comment, status, source
      `;
      await sql`
        insert into public.lead_events (lead_id, event_type, to_status)
        values (${row.id}, 'created', 'new')
      `;
      return mapSupabaseLead(row as SupabaseLeadRow);
    },
    async listLeads() {
      const rows = await sql`
        select id, created_at, updated_at, name, phone, service, boiler_model, district, comment, status, source
        from public.leads
        order by created_at desc
      `;
      return rows.map((row) => mapSupabaseLead(row as SupabaseLeadRow));
    },
    async updateLead(id, input, actorEmail) {
      const [current] = await sql`select status from public.leads where id = ${id}`;
      if (!current) throw new Error("Lead not found");
      const nextStatus = input.status || current.status;
      const [row] = await sql`
        update public.leads
        set status = ${nextStatus}
        where id = ${id}
        returning id, created_at, updated_at, name, phone, service, boiler_model, district, comment, status, source
      `;
      await sql`
        insert into public.lead_events (lead_id, actor_email, event_type, from_status, to_status, note)
        values (
          ${id},
          ${actorEmail},
          ${input.status && input.status !== current.status ? "status_changed" : "note_added"},
          ${current.status},
          ${nextStatus},
          ${input.note || ""}
        )
      `;
      return mapSupabaseLead(row as SupabaseLeadRow);
    },
    async health() {
      const [row] = await sql`
        select exists (
          select 1
          from information_schema.tables
          where table_schema = 'public' and table_name = 'leads'
        ) as exists
      `;
      return { ok: Boolean(row?.exists), backend: "postgres" };
    }
  };
}

type SupabaseLeadRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string;
  service: string;
  boiler_model: string | null;
  district: string | null;
  comment: string | null;
  status: LeadStatus;
  source: string;
};

function mapSupabaseLead(row: SupabaseLeadRow): Lead {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    phone: row.phone,
    service: row.service as Lead["service"],
    model: row.boiler_model || "",
    district: row.district || "",
    comment: row.comment || "",
    status: row.status,
    source: row.source
  };
}

export function getLeadRepository(): LeadRepository {
  const backend = getDataBackend();
  if (backend === "supabase") return createSupabaseRepository();
  if (backend === "postgres") return createPostgresRepository();
  return createMemoryRepository();
}
