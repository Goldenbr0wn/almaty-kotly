import { NextResponse } from "next/server";
import { getDataBackend, getPostgresEnvStatus, getSupabaseEnvStatus } from "@/lib/env";
import { getLeadRepository } from "@/lib/leads/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = getDataBackend();
  if (mode === "supabase") {
    const env = getSupabaseEnvStatus();
    if (!env.ready) {
      return NextResponse.json({
        ok: false,
        app: "alatau-service-backend",
        db: { ok: false, backend: "supabase", missingEnv: env.missing },
        release: process.env.APP_RELEASE_ID || "local-dev"
      }, { status: 503 });
    }
  }
  if (mode === "postgres") {
    const env = getPostgresEnvStatus();
    if (!env.ready) {
      return NextResponse.json({
        ok: false,
        app: "alatau-service-backend",
        db: { ok: false, backend: "postgres", missingEnv: env.missing },
        release: process.env.APP_RELEASE_ID || "local-dev"
      }, { status: 503 });
    }
  }
  const db = await getLeadRepository().health().catch(() => ({ ok: false, backend: process.env.DATA_BACKEND || "unknown" }));
  return NextResponse.json({
    ok: db.ok,
    app: "alatau-service-backend",
    db,
    release: process.env.APP_RELEASE_ID || "local-dev"
  }, { status: db.ok ? 200 : 503 });
}
