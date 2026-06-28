import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { requireAdminSession } from "@/lib/admin/auth";
import { getRuntimeSystemStatus } from "@/lib/system/status";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const admin = await requireAdminSession();
  const status = await getRuntimeSystemStatus();

  return (
    <SiteShell>
      <section className="page-hero">
        <div className="section">
          <p className="eyebrow">System</p>
          <h1>Supabase readiness</h1>
          <p className="lead">Runtime status for localhost:5173. Вход: {admin.email}.</p>
        </div>
      </section>
      <section className="section grid three">
        <article className="info-panel">
          <h2>Data backend: {status.backend}</h2>
          <ul className="check-list">
            <li>Active store ready: {status.activeStore.ready ? "yes" : "no"}</li>
            <li>Active store missing env names: {status.activeStore.missing.length ? status.activeStore.missing.join(", ") : "none"}</li>
            <li>Database health: {status.database.ok ? "ok" : "failed"} ({status.database.backend})</li>
            <li>Admin auth ready: {status.adminAuth.ready ? "yes" : "no"} ({status.adminAuth.mode}, admins: {status.adminAuth.adminCount})</li>
            <li>Admin auth missing env names: {status.adminAuth.missing.length ? status.adminAuth.missing.join(", ") : "none"}</li>
            <li>Supabase Postgres ready: {status.postgres.ready ? "yes" : "no"}</li>
            <li>Postgres missing env names: {status.postgres.missing.length ? status.postgres.missing.join(", ") : "none"}</li>
            <li>Supabase REST/Auth ready: {status.supabase.ready ? "yes" : "no"}</li>
            <li>REST/Auth missing env names: {status.supabase.missing.length ? status.supabase.missing.join(", ") : "none"}</li>
          </ul>
          <div className="actions">
            <Link className="button" href="/api/health">Health JSON</Link>
            <Link className="button secondary" href="/api/system/status">System JSON</Link>
            <Link className="button secondary" href="/crm">CRM</Link>
          </div>
        </article>
        <aside className="info-panel">
          <h3>Cutover commands</h3>
          <pre className="command-block">{status.commands.migrate}</pre>
          <pre className="command-block">DATA_BACKEND=postgres PORT=5173 npm run preview:supabase -- --env-file /path/to/alatau-supabase.env</pre>
          <pre className="command-block">{status.commands.preflight}</pre>
          <pre className="command-block">{status.commands.cutover}</pre>
        </aside>
      </section>
    </SiteShell>
  );
}
