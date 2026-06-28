import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const cookieStore = await cookies();
  type CookieToSet = Parameters<typeof cookieStore.set>[0] extends { name: string }
    ? Parameters<typeof cookieStore.set>[0]
    : { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] };
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items: CookieToSet[]) {
        items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      }
    }
  });
  await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/admin/leads", request.url));
}
