import { SiteShell } from "@/components/SiteShell";

export default function AdminLoginPage() {
  return (
    <SiteShell>
      <section className="page-hero"><div className="section"><p className="eyebrow">Admin</p><h1>Вход менеджера</h1><p className="lead">Доступ только для email из allowlist. В production используется Supabase magic link.</p></div></section>
      <section className="section">
        <form className="info-panel" action="/api/admin/login" method="post">
          <div className="form-grid">
            <label><span>Email</span><input name="email" type="email" required placeholder="owner@example.com" /></label>
          </div>
          <div className="actions"><button type="submit">Отправить magic link</button></div>
        </form>
      </section>
    </SiteShell>
  );
}
