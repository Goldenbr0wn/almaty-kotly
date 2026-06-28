import { NextResponse } from "next/server";
import { getRuntimeSystemStatus } from "@/lib/system/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getRuntimeSystemStatus();

  return NextResponse.json({
    ok: status.ok,
    app: "alatau-service-backend",
    status,
    release: process.env.APP_RELEASE_ID || "local-dev"
  }, { status: status.ok ? 200 : 503 });
}
