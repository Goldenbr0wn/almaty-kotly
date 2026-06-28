export type BoilerModel = {
  brand: string;
  name: string;
  price: number;
  power: string;
  area: string;
  type: string;
  image: string;
  imageSource: string;
  feature: string;
  service: string;
};

export const boilerModels: BoilerModel[] = [
  { brand: "NAVIEN", name: "NAVIEN ACE-13K", price: 366000, power: "13 кВт", area: "до 130 м2", type: "настенный, двухконтурный", image: "/assets/boilers/navien-ace-13k.jpg", imageSource: "interteplo.kz", feature: "Компактный вариант для квартиры или небольшого дома", service: "Диагностика, промывка теплообменника, настройка давления газа" },
  { brand: "NAVIEN", name: "NAVIEN DELUXE S-16K", price: 356000, power: "16 кВт", area: "до 160 м2", type: "настенный, двухконтурный", image: "/assets/boilers/navien-deluxe-s-16k.jpg", imageSource: "teplotehnika.kz", feature: "Популярная серия для квартир и таунхаусов", service: "Плановое обслуживание, проверка датчиков, запуск после простоя" },
  { brand: "Очаг", name: "Очаг АОГВ-45 EN", price: 480790, power: "45 кВт", area: "до 450 м2", type: "напольный, одноконтурный", image: "/assets/boilers/ochag-aogv-45-en.jpg", imageSource: "technodom.kz", feature: "Для больших домов и коммерческих помещений", service: "Проверка тяги, автоматики и безопасности горелки" },
  { brand: "NAVIEN", name: "NAVIEN Deluxe-C13", price: 346000, power: "13 кВт", area: "до 130 м2", type: "настенный, двухконтурный", image: "/assets/boilers/navien-deluxe-c13.jpg", imageSource: "teplotehnika.kz", feature: "Базовая модель для отопления и горячей воды", service: "Чистка камеры, проверка вентилятора и платы управления" },
  { brand: "NAVIEN", name: "NAVIEN Deluxe-C16", price: 356000, power: "16 кВт", area: "до 160 м2", type: "настенный, двухконтурный", image: "/assets/boilers/navien-deluxe-c16.jpg", imageSource: "technodom.kz", feature: "Частый выбор для городских квартир Алматы", service: "Сервис перед сезоном, устранение ошибок и перепадов давления" },
  { brand: "Rinnai", name: "Rinnai RBK-158KTU", price: 464000, power: "18 кВт", area: "до 180 м2", type: "настенный, двухконтурный", image: "/assets/boilers/rinnai-rbk-158ktu.jpg", imageSource: "koreastar.kz", feature: "Надежный японский бренд для стабильной работы", service: "Проверка платы, теплообменника, насосного узла" },
  { brand: "Daewoo", name: "Daewoo DGB 100 MSC", price: 310000, power: "11.6 кВт", area: "до 110 м2", type: "настенный, двухконтурный", image: "/assets/boilers/daewoo-dgb-100-msc.jpg", imageSource: "region-comfort.ru", feature: "Доступное решение для небольших помещений", service: "Чистка, регулировка, поиск причин нестабильного розжига" },
  { brand: "Daewoo", name: "Daewoo DGB 130 MSC", price: 315000, power: "15.1 кВт", area: "до 150 м2", type: "настенный, двухконтурный", image: "/assets/boilers/daewoo-dgb-130-msc.jpg", imageSource: "region-comfort.ru", feature: "Баланс цены и мощности для квартиры", service: "Обслуживание контура ГВС, датчиков и циркуляции" },
  { brand: "Baxi", name: "Baxi ECO Four 24", price: 471470, power: "24 кВт", area: "до 240 м2", type: "настенный, двухконтурный", image: "/assets/boilers/baxi-eco-four-24.png", imageSource: "baxi.com", feature: "Распространенная модель для дома и квартиры", service: "Оригинальные настройки, чистка теплообменника, проверка ошибок" },
  { brand: "Ariston", name: "Ariston CLAS X 24 FF", price: 459520, power: "24 кВт", area: "до 240 м2", type: "настенный, двухконтурный", image: "/assets/boilers/ariston-clas-x-24-ff.jpg", imageSource: "stroyka.uz", feature: "Универсальная модель с понятным управлением", service: "Сервис горелки, вентилятора, датчиков температуры" }
];

export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("ru-KZ").format(value)} ₸`;
}
