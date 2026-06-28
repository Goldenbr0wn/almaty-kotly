import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getAdminEmails, getDataBackend, requireServerEnv } from "@/lib/env";

export type AdminSession = {
  email: string;
  source: "supabase" | "local-dev";
};

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (getDataBackend() === "memory" && process.env.LOCAL_ADMIN_EMAIL && isAdminEmail(process.env.LOCAL_ADMIN_EMAIL)) {
    return { email: process.env.LOCAL_ADMIN_EMAIL, source: "local-dev" };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const cookieStore = await cookies();
  type CookieToSet = Parameters<typeof cookieStore.set>[0] extends { name: string }
    ? Parameters<typeof cookieStore.set>[0]
    : { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] };
  const supabase = createServerClient(
    requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items: CookieToSet[]) {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email || null;
  if (!email || !isAdminEmail(email)) return null;
  return { email, source: "supabase" };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
