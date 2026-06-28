import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    app: "alatau-service-backend",
    releaseId: process.env.APP_RELEASE_ID || "local-dev",
    sha: process.env.APP_RELEASE_SHA || "unknown",
    builtAt: process.env.APP_BUILT_AT || "runtime"
  });
}
