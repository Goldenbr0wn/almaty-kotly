import { Suspense } from "react";
import { SiteShell } from "@/components/SiteShell";
import { RequestForm } from "./RequestForm";

export default function RequestPage() {
  return (
    <SiteShell>
      <section className="page-hero"><div className="section"><p className="eyebrow">Заявка</p><h1>Оставьте заявку на ремонт или обслуживание</h1><p className="lead">Укажите район, модель котла и симптом. Backend сохранит обращение и подготовит его для админки.</p></div></section>
      <section className="section">
        <div className="grid three">
          <Suspense fallback={<div className="info-panel">Загрузка формы...</div>}><RequestForm /></Suspense>
          <aside className="info-panel"><h3>После заявки</h3><ul className="check-list"><li>Менеджер уточняет модель и район</li><li>Мастер согласует время выезда</li><li>После диагностики озвучивается стоимость</li><li>Работы и детали фиксируются в заказе</li></ul></aside>
        </div>
      </section>
    </SiteShell>
  );
}
