import { ProductCard } from "@/components/ProductCard";
import { SiteShell } from "@/components/SiteShell";
import { boilerModels } from "@/data/boilers";

export default function CatalogPage() {
  return (
    <SiteShell>
      <section className="page-hero"><div className="section"><p className="eyebrow">Каталог</p><h1>Газовые котлы для Алматы</h1><p className="lead">Ходовые модели для ремонта, обслуживания, сравнения и подбора мощности.</p></div></section>
      <section className="section">
        <div className="product-grid">
          {boilerModels.map((model) => <ProductCard key={model.name} model={model} />)}
        </div>
      </section>
    </SiteShell>
  );
}
