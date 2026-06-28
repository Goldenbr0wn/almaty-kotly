import Link from "next/link";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <span>Алматы и пригород: диагностика, ремонт, обслуживание</span>
          <span>+7 700 000 00 00 · ежедневно 09:00-21:00</span>
        </div>
      </div>
      <header className="site-header">
        <nav className="nav">
          <Link className="brand" href="/"><span className="brand-mark">К</span><span>КотелСервис Алматы</span></Link>
          <div className="nav-links">
            <Link href="/">Главная</Link>
            <Link href="/catalog">Каталог</Link>
            <Link href="/compare">Сравнение</Link>
            <Link href="/delivery-warranty">Доставка и гарантия</Link>
            <Link href="/request">Заявка</Link>
            <Link href="/admin/leads">Админ</Link>
            <Link href="/admin/system">System</Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="footer-inner">
          <div><h3>КотелСервис Алматы</h3><p>Backend v1: заявки, Supabase-контракт и админка.</p></div>
          <div><strong>Домен</strong><p>alatau-service.com · Mac mini target после отдельного cutover approval.</p></div>
          <div><strong>CTA</strong><p><Link href="/request">Оставить заявку</Link></p></div>
        </div>
      </footer>
    </>
  );
}
