import { SiteShell } from "@/components/SiteShell";
import { requireAdminSession } from "@/lib/admin/auth";
import { getLeadRepository } from "@/lib/leads/repository";
import { leadStatuses, type LeadStatus } from "@/lib/leads/schema";

export const dynamic = "force-dynamic";

const statusLabels: Record<LeadStatus, string> = {
  new: "Новые",
  contacted: "Связались",
  scheduled: "Запланировано",
  done: "Готово",
  archived: "Архив"
};

export default async function AdminLeadsPage() {
  const admin = await requireAdminSession();
  const leads = await getLeadRepository().listLeads();

  return (
    <SiteShell>
      <section className="page-hero"><div className="section"><p className="eyebrow">Admin</p><h1>Заявки</h1><p className="lead">Kanban для обработки заявок. Вход: {admin.email}</p></div></section>
      <section className="section">
        <div className="admin-toolbar"><h2>Очередь заявок</h2><span className="badge">{leads.length} всего</span></div>
        <div className="kanban">
          {leadStatuses.map((status) => (
            <div className="kanban-column" key={status}>
              <h3>{statusLabels[status]}</h3>
              {leads.filter((lead) => lead.status === status).map((lead) => (
                <article className="lead-card" key={lead.id}>
                  <strong>{lead.name}</strong>
                  <p className="muted">{lead.phone}<br />{lead.service} · {lead.model || "модель не указана"}</p>
                  <p>{lead.comment || lead.district || "Без комментария"}</p>
                  <form action={`/api/admin/leads/${lead.id}`} method="post">
                    <select name="status" defaultValue={lead.status}>{leadStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
                    <textarea name="note" rows={2} placeholder="Заметка" />
                    <button type="submit">Сохранить</button>
                  </form>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
