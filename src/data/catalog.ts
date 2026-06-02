import type { Config, FurnitureType } from '@/components/constructor/types';
import { DEFAULT_CONFIG } from '@/components/constructor/types';

export const IMG = {
  table: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg',
  coffee: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/86871e1d-0fab-4391-9443-4bb449e9ce29.jpg',
  desk: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/fdaec9ec-80db-497f-b1c0-da50c53baa5e.jpg',
  shelf: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/35cdd135-0b5f-4b71-9fd8-d7cfe7f31e87.jpg',
  sofa: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/4b29095e-bf24-4d0f-86af-59497df8adc2.jpg',
  wardrobe: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/57fce72f-e06d-49a9-bc63-b3491789da26.jpg',
  kitchen: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/b2ca5be4-9537-47bb-a101-d1cc23821a30.jpg',
  bed: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/165ae52f-be20-4ba5-a8b0-2e4a02d80084.jpg',
};

export const CATEGORIES = [
  { id: 'all', label: 'Все категории', icon: 'LayoutGrid' },
  { id: 'tables', label: 'Столы', icon: 'Table' },
  { id: 'sofas', label: 'Диваны', icon: 'Sofa' },
  { id: 'wardrobes', label: 'Шкафы', icon: 'DoorClosed' },
  { id: 'kitchens', label: 'Кухни', icon: 'CookingPot' },
  { id: 'beds', label: 'Кровати', icon: 'BedDouble' },
  { id: 'storage', label: 'Стеллажи', icon: 'Library' },
];

export const FILTERS_MATERIAL = ['Все', 'Дуб', 'Орех', 'Белый лак', 'Ткань', 'Металл'];

const MAT_TO_CFG: Record<string, string> = {
  'Дуб': 'oak',
  'Орех': 'walnut',
  'Белый лак': 'white',
  'Ткань': 'oak',
  'Металл': 'oak',
};

// какую 3D-модель показывать для категории
const CATEGORY_MODEL: Record<string, FurnitureType> = {
  tables: 'table',
  sofas: 'nightstand',
  wardrobes: 'shelf',
  kitchens: 'shelf',
  beds: 'nightstand',
  storage: 'shelf',
};

export type Product = {
  id: number;
  title: string;
  price: number;
  oldPrice?: number;
  category: string;
  style: string;
  material: string;
  img: string;
  badge?: string;
  desc: string;
};

const raw: Omit<Product, 'desc'>[] = [
  { id: 1, title: 'Обеденный стол «Нордик»', price: 28900, category: 'tables', style: 'Скандинавский', material: 'Дуб', img: IMG.table, badge: 'Хит' },
  { id: 2, title: 'Кофейный столик «Уолнат»', price: 18500, oldPrice: 22000, category: 'tables', style: 'Лофт', material: 'Орех', img: IMG.coffee, badge: 'Скидка' },
  { id: 3, title: 'Письменный стол «Бланш»', price: 22400, category: 'tables', style: 'Минимализм', material: 'Белый лак', img: IMG.desk },
  { id: 4, title: 'Барный стол «Индастриал»', price: 38000, category: 'tables', style: 'Лофт', material: 'Металл', img: IMG.coffee },

  { id: 5, title: 'Диван «Осло» 3-местный', price: 64900, category: 'sofas', style: 'Скандинавский', material: 'Ткань', img: IMG.sofa, badge: 'Хит' },
  { id: 6, title: 'Диван «Берген» угловой', price: 89500, oldPrice: 98000, category: 'sofas', style: 'Минимализм', material: 'Ткань', img: IMG.sofa, badge: 'Скидка' },
  { id: 7, title: 'Кресло «Стокгольм»', price: 32400, category: 'sofas', style: 'Скандинавский', material: 'Ткань', img: IMG.sofa },

  { id: 8, title: 'Шкаф-купе «Модерн»', price: 54200, category: 'wardrobes', style: 'Минимализм', material: 'Дуб', img: IMG.wardrobe, badge: 'Хит' },
  { id: 9, title: 'Гардероб «Лофт»', price: 47800, category: 'wardrobes', style: 'Лофт', material: 'Орех', img: IMG.wardrobe },
  { id: 10, title: 'Комод «Сканди»', price: 26500, category: 'wardrobes', style: 'Скандинавский', material: 'Белый лак', img: IMG.wardrobe },

  { id: 11, title: 'Кухня «Альпина» прямая', price: 128000, category: 'kitchens', style: 'Минимализм', material: 'Белый лак', img: IMG.kitchen, badge: 'Хит' },
  { id: 12, title: 'Кухня «Терра» угловая', price: 184500, oldPrice: 210000, category: 'kitchens', style: 'Классика', material: 'Орех', img: IMG.kitchen, badge: 'Скидка' },

  { id: 13, title: 'Кровать «Хюгге» 160×200', price: 48900, category: 'beds', style: 'Скандинавский', material: 'Ткань', img: IMG.bed, badge: 'Хит' },
  { id: 14, title: 'Кровать «Лофт» 180×200', price: 56400, category: 'beds', style: 'Лофт', material: 'Дуб', img: IMG.bed },

  { id: 15, title: 'Стеллаж «Лофт»', price: 41200, category: 'storage', style: 'Лофт', material: 'Металл', img: IMG.shelf, badge: 'Хит' },
  { id: 16, title: 'Книжный шкаф «Классик»', price: 34800, category: 'storage', style: 'Классика', material: 'Дуб', img: IMG.shelf },
];

const catLabel: Record<string, string> = {
  tables: 'Стол', sofas: 'Мягкая мебель', wardrobes: 'Шкаф',
  kitchens: 'Кухонный гарнитур', beds: 'Кровать', storage: 'Стеллаж',
};

export const products: Product[] = raw.map((p) => ({
  ...p,
  desc: `${catLabel[p.category] || 'Изделие'} «${p.title.replace(/^[^«]*«|».*$/g, '')}» в стиле ${p.style.toLowerCase()}. Изготовлен из материала «${p.material}» с покрытием премиум-класса. Можно покрутить в 3D, примерить к интерьеру и заказать онлайн с доставкой и сборкой.`,
}));

export function productById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

// 3D-конфигурация для просмотра товара
export function productConfig(p: Product): Config {
  return {
    ...DEFAULT_CONFIG,
    furniture: CATEGORY_MODEL[p.category] ?? 'table',
    material: MAT_TO_CFG[p.material] ?? 'oak',
    size: p.category === 'kitchens' || p.category === 'sofas' ? 'l' : 'm',
  };
}
