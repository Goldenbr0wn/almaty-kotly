import { z } from "zod";

export const leadStatuses = ["new", "contacted", "scheduled", "done", "archived"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const serviceTypes = ["Диагностика", "Чистка", "Ремонт", "Обслуживание", "Подбор котла", "Пусконаладка"] as const;
export type ServiceType = (typeof serviceTypes)[number];

export const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?[0-9\s()_-]{10,24}$/, "Некорректный телефон"),
  service: z.enum(serviceTypes),
  model: z.string().trim().max(120).optional().default(""),
  district: z.string().trim().max(160).optional().default(""),
  comment: z.string().trim().max(1200).optional().default(""),
  consent: z.coerce.boolean().refine((value) => value === true, "Нужно согласие на обработку заявки"),
  company: z.string().trim().max(0).optional().default("")
});

export const updateLeadSchema = z.object({
  status: z.enum(leadStatuses).optional(),
  note: z.string().trim().max(1000).optional().default("")
}).refine((value) => value.status || value.note, "Нет изменений");

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  service: ServiceType;
  model: string;
  district: string;
  comment: string;
  status: LeadStatus;
  source: string;
};

export type LeadEvent = {
  id: string;
  leadId: string;
  actorEmail: string | null;
  eventType: "created" | "status_changed" | "note_added";
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus | null;
  note: string;
  createdAt: string;
};
