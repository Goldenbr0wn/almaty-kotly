import Link from "next/link";
import { formatPrice, type BoilerModel } from "@/data/boilers";

export function ProductCard({ model }: { model: BoilerModel }) {
  return (
    <article className="product-card" data-brand={model.brand}>
      <div className="product-media">
        <img src={model.image} alt={`Фронтальное фото газового котла ${model.name}`} />
        <span className="image-source">Фото: {model.imageSource}</span>
      </div>
      <div className="product-body">
        <div className="badges"><span className="badge">{model.brand}</span><span className="badge">{model.power}</span></div>
        <h3>{model.name}</h3>
        <p className="muted">{model.feature}</p>
        <div className="price">{formatPrice(model.price)}</div>
        <ul className="specs">
          <li><strong>Площадь:</strong> {model.area}</li>
          <li><strong>Тип:</strong> {model.type}</li>
          <li><strong>Сервис:</strong> {model.service}</li>
        </ul>
        <div className="actions">
          <Link className="button" href={`/request?model=${encodeURIComponent(model.name)}`}>Уточнить цену</Link>
          <Link className="button secondary" href="/compare">Сравнить</Link>
        </div>
      </div>
    </article>
  );
}
