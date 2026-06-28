import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { getLeadRepository } from "@/lib/leads/repository";
import { updateLeadSchema } from "@/lib/leads/schema";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const parsed = updateLeadSchema.safeParse({
    status: String(form.get("status") || ""),
    note: String(form.get("note") || "")
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid update" }, { status: 400 });
  }
  const { id } = await context.params;
  await getLeadRepository().updateLead(id, parsed.data, admin.email);
  return NextResponse.redirect(new URL("/admin/leads", request.url));
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = updateLeadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const { id } = await context.params;
  const lead = await getLeadRepository().updateLead(id, parsed.data, admin.email);
  return NextResponse.json({ ok: true, lead });
}
