"use client";

import { useEffect } from "react";

type LeadPayload = {
  name: string;
  phone: string;
  service: string;
  model: string;
  district: string;
  comment: string;
  consent: boolean;
  company: string;
};

function readValue(form: HTMLFormElement, name: keyof LeadPayload): string {
  const field = form.elements.namedItem(name);
  if (!field || field instanceof RadioNodeList) return "";
  if ("value" in field) return String(field.value || "");
  return "";
}

function setRequestNote(form: HTMLFormElement, text: string, isError = false) {
  const note = form.querySelector<HTMLElement>(".request-note");
  if (!note) return;
  note.textContent = text;
  note.classList.toggle("is-error", isError);
}

function scrollToSection(id: string, behavior: ScrollBehavior = "smooth") {
  const section = document.getElementById(id);
  if (!section) return false;
  section.scrollIntoView({ behavior, block: "start" });
  return true;
}

function initDetailTabs() {
  document.querySelectorAll<HTMLElement>(".detail-tabs").forEach((group) => {
    const items = Array.from(group.querySelectorAll<HTMLElement>("button, span"));
    if (!items.length) return;
    const hasActive = items.some((item) => item.classList.contains("is-active"));
    items.forEach((item, index) => {
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.classList.toggle("is-active", !hasActive && index === 0);
    });
  });
}

function selectDetailTab(target: EventTarget | null) {
  const element = target instanceof Element ? target.closest<HTMLElement>(".detail-tabs button, .detail-tabs span") : null;
  if (!element) return false;
  const group = element.closest(".detail-tabs");
  group?.querySelectorAll<HTMLElement>("button, span").forEach((item) => {
    item.classList.toggle("is-active", item === element);
  });
  return true;
}

export function FinalSiteBridge() {
  useEffect(() => {
    document.body.classList.add("shot-site");
    const initialHash = window.location.hash;

    function syncFinalSiteInteractions() {
      initDetailTabs();
    }

    function scrollInitialHash() {
      if (initialHash && window.location.hash === initialHash) {
        scrollToSection(initialHash.slice(1), "auto");
      }
    }

    async function onSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form?.classList.contains("request-form")) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      setRequestNote(form, "Отправляем заявку...");

      const payload: LeadPayload = {
        name: readValue(form, "name"),
        phone: readValue(form, "phone"),
        service: readValue(form, "service"),
        model: readValue(form, "model"),
        district: readValue(form, "district"),
        comment: "",
        consent: true,
        company: ""
      };

      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Не удалось отправить заявку");
        form.reset();
        setRequestNote(form, "Заявка принята. Менеджер свяжется с вами после обработки обращения.");
      } catch (error) {
        setRequestNote(form, error instanceof Error ? error.message : "Ошибка отправки заявки", true);
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (selectDetailTab(target)) {
        event.preventDefault();
        return;
      }

      const button = target.closest<HTMLButtonElement>("button");
      if (!button) return;
      const label = button.textContent?.replace(/\s+/g, " ").trim() || "";

      if (button.getAttribute("aria-label") === "Добавить в избранное") {
        event.preventDefault();
        const nextPressed = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(nextPressed));
        button.classList.toggle("is-active", nextPressed);
        return;
      }

      if (label === "Подобрать") {
        event.preventDefault();
        window.history.replaceState(null, "", "#request");
        scrollToSection("request");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (selectDetailTab(event.target)) event.preventDefault();
    }

    function onHashChange() {
      if (window.location.hash) scrollToSection(window.location.hash.slice(1), "auto");
    }

    const observer = new MutationObserver(syncFinalSiteInteractions);
    observer.observe(document.body, { childList: true, subtree: true });
    [0, 80, 240, 500, 900].forEach((delay) => {
      window.setTimeout(() => {
        syncFinalSiteInteractions();
        scrollInitialHash();
      }, delay);
    });

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      observer.disconnect();
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("hashchange", onHashChange);
      document.body.classList.remove("shot-site");
    };
  }, []);

  return (
    <nav
      aria-label="Backend navigation"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 1000,
        display: "flex",
        gap: 8,
        padding: 8,
        borderRadius: 12,
        background: "rgba(16, 24, 23, .88)",
        boxShadow: "0 14px 38px rgba(0,0,0,.22)",
        backdropFilter: "blur(12px)"
      }}
    >
      {[
        ["/crm", "CRM"],
        ["/admin/leads", "Admin"],
        ["/profile", "Profile"]
      ].map(([href, label]) => (
        <a
          key={href}
          href={href}
          style={{
            color: "#fff",
            textDecoration: "none",
            font: "700 13px Arial, sans-serif",
            padding: "9px 10px",
            borderRadius: 8,
            background: "rgba(255,255,255,.1)"
          }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
