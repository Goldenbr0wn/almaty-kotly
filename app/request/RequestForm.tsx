"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { boilerModels } from "@/data/boilers";
import { serviceTypes } from "@/lib/leads/schema";

type Notice = { kind: "ok" | "error"; text: string } | null;

export function RequestForm() {
  const params = useSearchParams();
  const selectedModel = useMemo(() => params.get("model") || "", [params]);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.consent = form.consent.checked ? "true" : "false";
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось отправить заявку");
      form.reset();
      setNotice({ kind: "ok", text: "Заявка принята. Менеджер свяжется с вами после обработки обращения." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Ошибка отправки" });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="info-panel wide-panel" onSubmit={onSubmit}>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden="true" />
      <div className="form-grid">
        <label><span>Имя</span><input name="name" required placeholder="Например, Азат" /></label>
        <label><span>Телефон</span><input name="phone" required placeholder="+7 ___ ___ __ __" /></label>
        <label><span>Тип услуги</span><select name="service" defaultValue="Ремонт">{serviceTypes.map((service) => <option key={service}>{service}</option>)}</select></label>
        <label><span>Модель котла</span><select name="model" defaultValue={selectedModel}><option value="">Не выбрано</option>{boilerModels.map((model) => <option key={model.name}>{model.name}</option>)}</select></label>
        <label className="full"><span>Район / адрес</span><input name="district" placeholder="Например, Бостандыкский район" /></label>
        <label className="full"><span>Комментарий</span><textarea name="comment" rows={5} placeholder="Ошибка на дисплее, нет горячей воды, шумит насос..." /></label>
        <label className="full"><span><input name="consent" type="checkbox" required /> Согласен на обработку заявки и обратный звонок</span></label>
      </div>
      <div className="actions"><button type="submit" disabled={pending}>{pending ? "Отправляем..." : "Отправить заявку"}</button></div>
      {notice ? <div className={`notice ${notice.kind === "error" ? "error" : ""}`}>{notice.text}</div> : null}
    </form>
  );
}
