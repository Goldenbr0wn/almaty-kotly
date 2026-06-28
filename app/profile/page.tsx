import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { requireAdminSession } from "@/lib/admin/auth";
import { getDataBackend } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const admin = await requireAdminSession();

  return (
    <SiteShell>
      <section className="page-hero">
        <div className="section">
          <p className="eyebrow">Профиль</p>
          <h1>Рабочий профиль</h1>
          <p className="lead">Аккаунт менеджера для CRM и админки сайта котлов.</p>
        </div>
      </section>
      <section className="section grid three">
        <article className="info-panel">
          <h2>{admin.email}</h2>
          <ul className="check-list">
            <li>Session source: {admin.source}</li>
            <li>Data backend: {getDataBackend()}</li>
            <li>Role: admin allowlist</li>
          </ul>
          <div className="actions">
            <Link className="button" href="/crm">CRM</Link>
            <Link className="button secondary" href="/admin/leads">Admin Kanban</Link>
            <Link className="button secondary" href="/admin/system">System</Link>
          </div>
        </article>
        <aside className="info-panel">
          <h3>Supabase</h3>
          <p className="muted">В production профиль должен работать через Supabase Auth. Локальный memory mode показывает границу, но не заменяет живой проект.</p>
        </aside>
      </section>
    </SiteShell>
  );
}
