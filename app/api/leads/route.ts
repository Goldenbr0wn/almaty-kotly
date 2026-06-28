import { NextResponse, type NextRequest } from "next/server";
import { createLeadSchema } from "@/lib/leads/schema";
import { getLeadRepository } from "@/lib/leads/repository";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyLeadCreated } from "@/lib/notifications/telegram";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(`lead:${ip}`)) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте позже." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Некорректная заявка" }, { status: 400 });
  }

  if (parsed.data.company) {
    return NextResponse.json({ error: "Некорректная заявка" }, { status: 400 });
  }

  const lead = await getLeadRepository().createLead(parsed.data, { source: "alatau-service.com" });
  await notifyLeadCreated(lead);
  return NextResponse.json({ ok: true, leadId: lead.id, status: lead.status }, { status: 201 });
}
