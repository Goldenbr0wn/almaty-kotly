import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { boilerModels, formatPrice } from "@/data/boilers";

export default function ComparePage() {
  return (
    <SiteShell>
      <section className="page-hero"><div className="section"><p className="eyebrow">Сравнение</p><h1>Сравнить котлы</h1><p className="lead">Цена, мощность, площадь и сервисные работы в одной таблице.</p></div></section>
      <section className="section">
        <table className="compare-table">
          <thead><tr><th>Модель</th><th>Фото</th><th>Цена</th><th>Мощность</th><th>Площадь</th><th>Тип</th><th>Сервис</th><th></th></tr></thead>
          <tbody>
            {boilerModels.map((model) => (
              <tr key={model.name}>
                <td><strong>{model.name}</strong><br /><span className="muted">{model.brand}</span></td>
                <td><img className="compare-thumb" src={model.image} alt={model.name} /></td>
                <td>{formatPrice(model.price)}<br /><span className="muted">ориентировочно</span></td>
                <td>{model.power}</td><td>{model.area}</td><td>{model.type}</td><td>{model.service}</td>
                <td><Link className="button" href={`/request?model=${encodeURIComponent(model.name)}`}>Заявка</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </SiteShell>
  );
}
