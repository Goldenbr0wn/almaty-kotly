import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { requireAdminSession } from "@/lib/admin/auth";
import { getDataBackend } from "@/lib/env";
import { getLeadRepository } from "@/lib/leads/repository";
import { leadStatuses, type LeadStatus } from "@/lib/leads/schema";

export const dynamic = "force-dynamic";

const labels: Record<LeadStatus, string> = {
  new: "Новые",
  contacted: "Связались",
  scheduled: "Запланировано",
  done: "Готово",
  archived: "Архив"
};

export default async function CrmPage() {
  const admin = await requireAdminSession();
  const leads = await getLeadRepository().listLeads();
  const totals = leadStatuses.map((status) => ({
    status,
    label: labels[status],
    count: leads.filter((lead) => lead.status === status).length
  }));

  return (
    <SiteShell>
      <section className="page-hero">
        <div className="section">
          <p className="eyebrow">CRM</p>
          <h1>Центр заявок</h1>
          <p className="lead">Операторская панель для заявок с финального сайта. Вход: {admin.email}. Data backend: {getDataBackend()}.</p>
          <div className="actions">
            <Link className="button" href="/admin/leads">Открыть Kanban</Link>
            <Link className="button secondary" href="/profile">Профиль</Link>
            <Link className="button secondary" href="/admin/system">System</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="grid four">
          {totals.map((item) => (
            <article className="card" key={item.status}>
              <span className="card-icon">{item.count}</span>
              <h3>{item.label}</h3>
              <p className="muted">Заявки в статусе {item.label.toLowerCase()}.</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
