import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export default function DeliveryWarrantyPage() {
  return (
    <SiteShell>
      <section className="page-hero"><div className="section"><p className="eyebrow">Доставка и гарантия</p><h1>Выезд, монтаж и гарантия</h1><p className="lead">Сценарий для Алматы: уточнение модели, район, время мастера, акт работ и гарантия на сервис.</p></div></section>
      <section className="section grid three">
        <article className="info-panel"><h2>Как проходит работа</h2><ul className="check-list"><li>Менеджер уточняет симптомы и модель.</li><li>Мастер согласует окно приезда.</li><li>После диагностики фиксируется смета.</li><li>Результат и детали заносятся в заявку.</li></ul><Link className="button" href="/request">Оставить заявку</Link></article>
        <aside className="info-panel"><h3>Районы</h3><p className="muted">Бостандыкский, Алмалинский, Медеуский, Ауэзовский, Наурызбайский и ближайший пригород.</p></aside>
      </section>
    </SiteShell>
  );
}
