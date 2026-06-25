const models = [
  { brand: "NAVIEN", name: "NAVIEN ACE-13K", price: 366000, power: "13 кВт", area: "до 130 м2", type: "настенный, двухконтурный", feature: "Компактный вариант для квартиры или небольшого дома", service: "Диагностика, промывка теплообменника, настройка давления газа" },
  { brand: "NAVIEN", name: "NAVIEN DELUXE S-16K", price: 356000, power: "16 кВт", area: "до 160 м2", type: "настенный, двухконтурный", feature: "Популярная серия для квартир и таунхаусов", service: "Плановое обслуживание, проверка датчиков, запуск после простоя" },
  { brand: "Очаг", name: "Очаг АОГВ-45 EN", price: 480790, power: "45 кВт", area: "до 450 м2", type: "напольный, одноконтурный", feature: "Для больших домов и коммерческих помещений", service: "Проверка тяги, автоматики и безопасности горелки" },
  { brand: "NAVIEN", name: "NAVIEN Deluxe-C13", price: 346000, power: "13 кВт", area: "до 130 м2", type: "настенный, двухконтурный", feature: "Базовая модель для отопления и горячей воды", service: "Чистка камеры, проверка вентилятора и платы управления" },
  { brand: "NAVIEN", name: "NAVIEN Deluxe-C16", price: 356000, power: "16 кВт", area: "до 160 м2", type: "настенный, двухконтурный", feature: "Частый выбор для городских квартир Алматы", service: "Сервис перед сезоном, устранение ошибок и перепадов давления" },
  { brand: "Rinnai", name: "Rinnai RBK-158KTU", price: 464000, power: "18 кВт", area: "до 180 м2", type: "настенный, двухконтурный", feature: "Надежный японский бренд для стабильной работы", service: "Проверка платы, теплообменника, насосного узла" },
  { brand: "Daewoo", name: "Daewoo DGB 100 MSC", price: 310000, power: "11.6 кВт", area: "до 110 м2", type: "настенный, двухконтурный", feature: "Доступное решение для небольших помещений", service: "Чистка, регулировка, поиск причин нестабильного розжига" },
  { brand: "Daewoo", name: "Daewoo DGB 130 MSC", price: 315000, power: "15.1 кВт", area: "до 150 м2", type: "настенный, двухконтурный", feature: "Баланс цены и мощности для квартиры", service: "Обслуживание контура ГВС, датчиков и циркуляции" },
  { brand: "Baxi", name: "Baxi ECO Four 24", price: 471470, power: "24 кВт", area: "до 240 м2", type: "настенный, двухконтурный", feature: "Распространенная модель для дома и квартиры", service: "Оригинальные настройки, чистка теплообменника, проверка ошибок" },
  { brand: "Ariston", name: "Ariston CLAS X 24 FF", price: 459520, power: "24 кВт", area: "до 240 м2", type: "настенный, двухконтурный", feature: "Универсальная модель с понятным управлением", service: "Сервис горелки, вентилятора, датчиков температуры" }
];

function formatPrice(value) {
  return new Intl.NumberFormat("ru-KZ").format(value) + " ₸";
}

function boilerSvg(model, index) {
  const colors = ["146c94", "d7472f", "1f8a58", "6a7785", "0f526f"];
  const color = colors[index % colors.length];
  const short = model.brand;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="360" height="260" viewBox="0 0 360 260" role="img">
    <rect width="360" height="260" rx="18" fill="#eef6f9"/>
    <rect x="102" y="24" width="156" height="208" rx="18" fill="#ffffff" stroke="#91a7b3" stroke-width="6"/>
    <rect x="126" y="52" width="108" height="44" rx="8" fill="#${color}"/>
    <text x="180" y="81" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#ffffff">${short}</text>
    <circle cx="150" cy="132" r="20" fill="#d7472f"/>
    <circle cx="210" cy="132" r="20" fill="#1f8a58"/>
    <rect x="134" y="170" width="92" height="22" rx="5" fill="#dfe7eb"/>
    <path d="M144 232v20M180 232v20M216 232v20" stroke="#91a7b3" stroke-width="8" stroke-linecap="round"/>
    <path d="M260 84c36 16 58 44 66 84" fill="none" stroke="#b7cad3" stroke-width="10" stroke-linecap="round"/>
    <path d="M34 190h78" stroke="#cbd9df" stroke-width="12" stroke-linecap="round"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function productCard(model, index) {
  return `
    <article class="product-card" data-brand="${model.brand}">
      <div class="product-media">
        <img src="${boilerSvg(model, index)}" alt="Изображение газового котла ${model.name}">
      </div>
      <div class="product-body">
        <div class="badges"><span class="badge">${model.brand}</span><span class="badge">${model.power}</span></div>
        <h3>${model.name}</h3>
        <p class="muted">${model.feature}</p>
        <div class="price">${formatPrice(model.price)}</div>
        <ul class="specs">
          <li><strong>Площадь:</strong> ${model.area}</li>
          <li><strong>Тип:</strong> ${model.type}</li>
          <li><strong>Сервис:</strong> ${model.service}</li>
        </ul>
        <div class="actions">
          <a class="button" href="request.html?model=${encodeURIComponent(model.name)}">Уточнить цену</a>
          <a class="button secondary" href="compare.html">Сравнить</a>
        </div>
      </div>
    </article>`;
}

function renderProducts(targetId, limit) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const items = typeof limit === "number" ? models.slice(0, limit) : models;
  target.innerHTML = items.map(productCard).join("");
}

function renderCompare() {
  const body = document.getElementById("compareRows");
  if (!body) return;
  body.innerHTML = models.map((model, index) => `
    <tr>
      <td><strong>${model.name}</strong><br><span class="muted">${model.brand}</span></td>
      <td><img src="${boilerSvg(model, index)}" alt="${model.name}" width="96"></td>
      <td>${formatPrice(model.price)}<br><span class="muted">ориентировочно</span></td>
      <td>${model.power}</td>
      <td>${model.area}</td>
      <td>${model.type}</td>
      <td>${model.service}</td>
      <td><a class="button" href="request.html?model=${encodeURIComponent(model.name)}">Заявка</a></td>
    </tr>
  `).join("");
}

function setupFilters() {
  const brand = document.getElementById("brandFilter");
  const cards = Array.from(document.querySelectorAll(".product-card"));
  if (!brand || !cards.length) return;
  brand.addEventListener("change", () => {
    cards.forEach(card => {
      const show = brand.value === "all" || card.dataset.brand === brand.value;
      card.style.display = show ? "" : "none";
    });
  });
}

function setupRequestForm() {
  const form = document.getElementById("requestForm");
  const notice = document.getElementById("formNotice");
  const modelSelect = document.getElementById("modelSelect");
  if (modelSelect) {
    modelSelect.innerHTML = `<option value="">Не выбрано</option>` + models.map(model => `<option>${model.name}</option>`).join("");
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("model");
    if (selected) modelSelect.value = selected;
  }
  if (!form || !notice) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    notice.classList.add("show");
    notice.textContent = "Заявка сохранена в макете. В production здесь будет отправка менеджеру в Алматы.";
    form.reset();
  });
}

function setActiveNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(link => {
    if (link.getAttribute("href") === current) link.classList.add("active");
  });
}

renderProducts("popularProducts", 3);
renderProducts("catalogProducts");
renderCompare();
setupFilters();
setupRequestForm();
setActiveNav();
