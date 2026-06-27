import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  CircleGauge,
  ClipboardCheck,
  Clock,
  Flame,
  Gauge,
  Headphones,
  Heart,
  Home,
  MapPin,
  PackageCheck,
  Phone,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import almatyMap from "../assets/almaty-map.svg";
import boilerFrontCleanImage from "../assets/generated/boiler-front-clean.svg";
import heroBoilerCleanImage from "../assets/generated/hero-boiler-clean.png";
import logoImage from "../assets/logo-almaty-kotly.svg";
import aristonImage from "../assets/boilers/ariston-clas-x-24-ff.jpg";
import baxiImage from "../assets/boilers/baxi-eco-four-24.png";
import daewooImage from "../assets/boilers/daewoo-dgb-130-msc.jpg";
import navienAceImage from "../assets/boilers/navien-ace-13k.jpg";
import navienImage from "../assets/boilers/navien-deluxe-c16.jpg";
import navienSImage from "../assets/boilers/navien-deluxe-s-16k.jpg";
import rinnaiImage from "../assets/boilers/rinnai-rbk-158ktu.jpg";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const leadSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(7, "Введите телефон"),
  service: z.string().min(1, "Выберите услугу"),
  model: z.string().min(1, "Выберите модель"),
  district: z.string().min(1, "Выберите район"),
});

type LeadValues = z.infer<typeof leadSchema>;

const navItems = [
  { id: "home", title: "Главная" },
  { id: "catalog", title: "Каталог" },
  { id: "compare", title: "Сравнение" },
  { id: "delivery", title: "Доставка и гарантия" },
  { id: "request", title: "Заявка" },
];

const products = [
  { brand: "Navien", model: "Ace 13K", price: "от 242 000 ₸", power: "13 кВт", area: "до 130 м²", efficiency: "90,5%", image: navienAceImage },
  { brand: "Navien", model: "Deluxe S 16K", price: "от 329 000 ₸", power: "16 кВт", area: "до 160 м²", efficiency: "91,7%", image: navienSImage },
  { brand: "Rinnai", model: "RBK-158KTU", price: "от 338 000 ₸", power: "18 кВт", area: "до 180 м²", efficiency: "91,0%", image: rinnaiImage },
  { brand: "Baxi", model: "ECO Four 24 F", price: "от 359 000 ₸", power: "24 кВт", area: "до 240 м²", efficiency: "93,1%", image: baxiImage },
  { brand: "Daewoo", model: "DGB 130 MSC", price: "от 289 000 ₸", power: "15,1 кВт", area: "до 150 м²", efficiency: "93,1%", image: daewooImage },
];

const compareProducts = [
  { brand: "Navien", model: "Deluxe C16", power: "16 кВт", area: "до 160 м²", efficiency: "91,2%", image: navienImage, country: "Южная Корея" },
  { brand: "Rinnai", model: "RBK-158KTU", power: "15,8 кВт", area: "до 150 м²", efficiency: "92%", image: rinnaiImage, country: "Япония" },
  { brand: "Baxi", model: "ECO Four 24 F", power: "24 кВт", area: "до 240 м²", efficiency: "93,1%", image: baxiImage, country: "Италия" },
  { brand: "Ariston", model: "CLAS X 24 FF", power: "24 кВт", area: "до 240 м²", efficiency: "93%", image: aristonImage, country: "Италия" },
];

const services = [
  {
    icon: Gauge,
    title: "Диагностика",
    text: "Проверка работы котла, поиск причины ошибки, осмотр узлов и автоматики.",
    bullets: ["Отдельно от 5 000 ₸", "При ремонте часто бесплатно", "Выезд обычно 30-40 мин"],
    meta: "от 5 000 ₸",
  },
  {
    icon: Sparkles,
    title: "Чистка и ТО",
    text: "Чистка теплообменника, горелки, фильтров, проверка тяги и давления.",
    bullets: ["Теплообменник и горелка", "Фильтры и форсунки", "Регулировка после чистки"],
    meta: "от 6 000-8 000 ₸",
  },
  {
    icon: Wrench,
    title: "Ремонт",
    text: "Замена неисправных деталей, настройка автоматики и проверка после ремонта.",
    bullets: ["Плата, насос, клапан газа", "Смета до начала работ", "Гарантия по выполненной работе"],
    meta: "по смете",
  },
  {
    icon: CircleGauge,
    title: "Пусконаладка",
    text: "Подключение к системе, настройка параметров, контроль запуска и безопасности.",
    bullets: ["Первый запуск котла", "Настройка автоматики", "Проверка стабильной работы"],
    meta: "от 5 000 ₸",
  },
];

function WhatsAppLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="whatsapp-logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="15.2" fill="#25D366" />
      <path
        fill="#FFFFFF"
        transform="translate(5 5) scale(1.38)"
        d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93a7.898 7.898 0 0 0-2.327-5.607ZM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592Zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.474.205.843.326 1.13.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232Z"
      />
    </svg>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="ALMATY KOTLY">
        <img src={logoImage} alt="ALMATY KOTLY" />
      </a>
      <nav className="site-nav" aria-label="Основная навигация">
        {navItems.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.title}
          </a>
        ))}
      </nav>
      <a className="header-whatsapp" href="https://wa.me/77015553808">
        <WhatsAppLogo />
        <span>Написать в WhatsApp</span>
      </a>
      <a className="header-phone" href="tel:+77015553808">
        <Phone size={24} />
        <span>
          +7 701 555 38 08
          <small>г. Алматы, выезд по городу</small>
        </span>
      </a>
    </header>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={`page-section ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

function IconBadge({ icon: IconComponent }: { icon: Icon }) {
  return (
    <span className="icon-badge">
      <IconComponent size={28} strokeWidth={2.1} />
    </span>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: Icon;
  title: string;
  text: string;
}) {
  const IconComponent = icon;
  return (
    <article className="trust-card">
      <IconComponent size={34} strokeWidth={2} />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function ProductMiniCard({ product }: { product: (typeof products)[number] }) {
  return (
    <article className="product-mini-card">
      <h3>{product.brand}</h3>
      <strong>{product.model}</strong>
      <div className="product-photo-frame">
        <img src={boilerFrontCleanImage} alt={`${product.brand} ${product.model}, вид спереди`} />
      </div>
      <dl>
        <div>
          <Flame size={16} />
          <span>{product.power}</span>
        </div>
        <div>
          <Home size={16} />
          <span>{product.area}</span>
        </div>
        <div>
          <Gauge size={16} />
          <span>{product.efficiency}</span>
        </div>
      </dl>
      <p>{product.price}</p>
      <button type="button">
        Уточнить цену
        <ArrowRight size={17} />
      </button>
    </article>
  );
}

function ServiceCard({ service }: { service: (typeof services)[number] }) {
  const IconComponent = service.icon;
  return (
    <article className="service-card">
      <IconBadge icon={IconComponent} />
      <h3>{service.title}</h3>
      <p>{service.text}</p>
      <ul>
        {service.bullets.map((bullet) => (
          <li key={bullet}>
            <CheckCircle2 size={16} />
            {bullet}
          </li>
        ))}
      </ul>
      <span>
        <Clock size={17} />
        {service.meta}
      </span>
    </article>
  );
}

function RequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit } = useForm<LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", phone: "", service: "", model: "", district: "" },
  });

  return (
    <form className="request-form" onSubmit={handleSubmit(() => setSubmitted(true))}>
      <label>
        Ваше имя
        <span>
          <UserRound size={19} />
          <input {...register("name")} placeholder="Введите имя" autoComplete="name" />
        </span>
      </label>
      <label>
        Телефон
        <span>
          <Phone size={19} />
          <input {...register("phone")} placeholder="+7 (700) 123-45-67" autoComplete="tel" />
        </span>
      </label>
      <label>
        Тип услуги
        <span>
          <Wrench size={19} />
          <select {...register("service")}>
            <option value="">Выберите услугу</option>
            <option>Диагностика</option>
            <option>Чистка</option>
            <option>Ремонт</option>
            <option>Пусконаладка</option>
          </select>
        </span>
      </label>
      <label>
        Модель котла
        <span>
          <Flame size={19} />
          <select {...register("model")}>
            <option value="">Выберите модель</option>
            <option>Navien Deluxe C16</option>
            <option>Rinnai RBK-158KTU</option>
            <option>Baxi ECO Four 24 F</option>
            <option>Daewoo DGB 130 MSC</option>
          </select>
        </span>
      </label>
      <label className="request-form-wide">
        Район Алматы
        <span>
          <MapPin size={19} />
          <select {...register("district")}>
            <option value="">Выберите район</option>
            <option>Алмалинский</option>
            <option>Ауэзовский</option>
            <option>Бостандыкский</option>
            <option>Медеуский</option>
            <option>Турксибский</option>
            <option>Жетысуский</option>
          </select>
        </span>
      </label>
      <button className="request-form-wide" type="submit">
        <Send size={20} />
        Отправить заявку
      </button>
      <p className="request-note">
        <ShieldCheck size={17} />
        {submitted ? "Заявка сохранена в демо-режиме" : "Перезвоним в течение 15 минут"}
      </p>
    </form>
  );
}

export default function App() {
  return (
    <div className="site-shell">
      <Header />
      <main>
        <Section id="home" className="hero-section">
          <div className="hero-content-card">
            <span className="eyebrow">
              <ShieldCheck size={17} />
              Сервис с гарантией в Алматы
            </span>
            <h1>Котлы под контролем</h1>
            <i />
            <p>Ремонт, обслуживание и выезд мастера по Алматы</p>
            <div className="hero-actions">
              <a className="primary-action" href="#request">
                <CalendarCheck size={22} />
                Оставить заявку
                <small>Перезвоним в течение 15 минут</small>
              </a>
              <a className="text-action" href="#catalog">
                Смотреть каталог
                <ArrowRight size={21} />
              </a>
            </div>
          </div>

          <div className="hero-boiler">
            <img src={heroBoilerCleanImage} alt="Настенный газовый котел Navien" />
          </div>

          <div className="hero-trust-stack">
            <TrustCard icon={ShieldCheck} title="Гарантия 12 месяцев" text="На работы и запчасти" />
            <TrustCard icon={Truck} title="Выезд по городу" text="Быстрый выезд от 1 часа" />
            <TrustCard icon={Settings} title="Оригинальные запчасти" text="Только сертифицированные комплектующие" />
          </div>
        </Section>

        <Section id="catalog" className="catalog-section dark-section">
          <div className="section-heading">
            <h2>Газовые котлы и сервис в Алматы</h2>
            <p>Ориентиры по открытым сервисам Алматы: выезд обычно <b>30-40 минут</b>, гарантия на работы до <b>12 месяцев</b></p>
          </div>

          <div className="catalog-grid">
            <article className="featured-product">
              <span className="sales-hit">
                <Award size={15} />
                Хит продаж
              </span>
              <div>
                <h3>Navien Deluxe C16</h3>
                <p>Настенный газовый котел двухконтурный</p>
                <ul>
                  <li>
                    <Flame size={20} />
                    <span>16 кВт<small>Мощность</small></span>
                  </li>
                  <li>
                    <Home size={20} />
                    <span>до 160 м²<small>Площадь отопления</small></span>
                  </li>
                  <li>
                    <Gauge size={20} />
                    <span>91,5%<small>КПД</small></span>
                  </li>
                  <li>
                    <ShieldCheck size={20} />
                    <span>12 месяцев<small>Гарантия</small></span>
                  </li>
                </ul>
              </div>
              <img src={boilerFrontCleanImage} alt="Navien Deluxe C16" />
              <footer>
                <span>Цена<strong>от 312 000 ₸</strong></span>
                <button type="button">
                  Уточнить цену
                  <ArrowRight size={19} />
                </button>
              </footer>
            </article>

            <div className="product-strip">
              {products.map((product) => (
                <ProductMiniCard key={`${product.brand}-${product.model}`} product={product} />
              ))}
            </div>

            <div className="service-strip">
              {services.map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </div>
          </div>

          <div className="catalog-proof-row">
            <TrustCard icon={ShieldCheck} title="Гарантия до 12 месяцев" text="На котлы и работы" />
            <TrustCard icon={Wrench} title="Оригинальные запчасти" text="Только сертифицированные" />
            <TrustCard icon={UserRound} title="Опытные мастера" text="Более 10 лет опыта" />
            <TrustCard icon={Clock} title="Быстрый выезд" text="От 1 часа по Алматы" />
          </div>
        </Section>

        <Section id="compare" className="compare-section">
          <article className="product-stage-card">
            <h2>Надежное тепло для вашего дома</h2>
            <i />
            <div className="stage-product-frame">
              <img src={heroBoilerCleanImage} alt="Navien Deluxe C16 на стене" />
            </div>
            <div className="stage-benefits">
              <TrustCard icon={ShieldCheck} title="Официальное оборудование" text="Оригинальная поставка" />
              <TrustCard icon={Wrench} title="Сертифицированный монтаж" text="Работа по стандартам" />
              <TrustCard icon={Headphones} title="Сервис в Алматы" text="Выезд по городу" />
            </div>
          </article>

          <article className="product-detail-card">
            <div className="detail-topline">
              <span>Настенный газовый котел</span>
              <button type="button" aria-label="Добавить в избранное">
                <Heart size={23} />
              </button>
            </div>
            <h2>Navien Deluxe C16</h2>
            <div className="detail-tags">
              <span><Flame size={16} />Двухконтурный</span>
              <span>Южная Корея</span>
            </div>
            <p>Надежный и экономичный котел для отопления и ГВС. Оптимален для квартир и домов до 160 м².</p>
            <dl className="spec-list">
              <div><dt><Flame size={20} />Мощность</dt><dd>16 кВт</dd></div>
              <div><dt><Home size={20} />Площадь отопления</dt><dd>до 160 м²</dd></div>
              <div><dt><Gauge size={20} />КПД</dt><dd>91,2%</dd></div>
              <div><dt><Settings size={20} />Сервис</dt><dd>Алматы и область</dd></div>
            </dl>
            <div className="detail-tabs">
              <button type="button">Обзор</button>
              <span>Характеристики</span>
              <span>Комплектация</span>
              <span>Отзывы</span>
            </div>
            <ul className="detail-checks">
              {["Закрытая камера сгорания", "Модуляция пламени 10-100%", "Встроенный циркуляционный насос", "Защита от замерзания и перегрева", "Низкий уровень шума"].map((item) => (
                <li key={item}><CheckCircle2 size={18} />{item}</li>
              ))}
            </ul>
            <footer>
              <span><strong>659 900 ₸</strong>В наличии в Алматы</span>
              <button type="button">
                <ShoppingBag size={19} />
                Подобрать
              </button>
              <small><ShieldCheck size={16} />Гарантия 12 месяцев</small>
            </footer>
          </article>

          <aside className="compare-panel">
            <h2>Сравнение 4 моделей</h2>
            <p>Выберите до 4 моделей для сравнения</p>
            {compareProducts.map((product) => (
              <article key={`${product.brand}-${product.model}`}>
                <CheckCircle2 size={22} />
                <img src={product.image} alt={`${product.brand} ${product.model}`} />
                <div>
                  <h3>{product.brand}<br />{product.model}</h3>
                  <ul>
                    <li><Flame size={15} />{product.power}</li>
                    <li><Home size={15} />{product.area}</li>
                    <li><Gauge size={15} />{product.efficiency}</li>
                    <li><MapPin size={15} />Алматы</li>
                  </ul>
                </div>
                <span>{product.country}</span>
              </article>
            ))}
          </aside>
        </Section>

        <Section id="delivery" className="delivery-section dark-section">
          <img className="delivery-map" src={almatyMap} alt="Карта Алматы по районам" />
          <div className="delivery-copy">
            <span className="eyebrow dark-eyebrow">
              <ShieldCheck size={17} />
              Сервис с гарантией в Алматы
            </span>
            <h2>Доставка и гарантия<br />в Алматы</h2>
            <p>Выезд по городу, монтаж и официальный сервис</p>
            <div className="delivery-proof">
              <TrustCard icon={ShieldCheck} title="Официальная гарантия" text="12 месяцев" />
              <TrustCard icon={Settings} title="Оригинальные запчасти" text="Только комплектующие" />
              <TrustCard icon={UserRound} title="Первый запуск" text="Специалистом" />
            </div>
          </div>
          <div className="delivery-process">
            <article>
              <span>1</span>
              <h3>Подбор</h3>
              <ul>
                <li><CheckCircle2 size={16} />Подберем котел под дом</li>
                <li><CheckCircle2 size={16} />Консультация эксперта</li>
                <li><CheckCircle2 size={16} />Честные рекомендации</li>
              </ul>
              <ClipboardCheck size={58} />
            </article>
            <article>
              <span>2</span>
              <h3>Выезд по городу</h3>
              <ul>
                <li><CheckCircle2 size={16} />Быстрый выезд от 1 часа</li>
                <li><CheckCircle2 size={16} />Диагностика на месте</li>
                <li><CheckCircle2 size={16} />Расчет стоимости</li>
              </ul>
              <MapPin size={58} />
            </article>
            <article>
              <span>3</span>
              <h3>Монтаж и гарантия</h3>
              <ul>
                <li><CheckCircle2 size={16} />Монтаж по стандартам</li>
                <li><CheckCircle2 size={16} />Первый запуск</li>
                <li><CheckCircle2 size={16} />Гарантия 12 месяцев</li>
              </ul>
              <Wrench size={58} />
            </article>
            <a className="delivery-cta" href="#request">
              <Headphones size={48} />
              <span>Уточнить выезд<small>Ответим в WhatsApp или по телефону</small></span>
              <ArrowRight size={34} />
            </a>
          </div>
        </Section>

        <Section id="request" className="request-section">
          <div className="request-heading">
            <span />
            <h2>Запланируйте<br />сервис до холодов</h2>
            <p>Профессиональное обслуживание газовых котлов в Алматы</p>
          </div>
          <article className="request-card">
            <RequestForm />
          </article>
          <div className="request-boiler-card">
            <img src={boilerFrontCleanImage} alt="Котел Navien Deluxe C16" />
            <TrustCard icon={ShieldCheck} title="Гарантия 12 месяцев" text="На работы и оригинальные запчасти" />
          </div>
          <div className="request-service-row">
            {services.map((service) => (
              <ServiceCard key={service.title} service={service} />
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
