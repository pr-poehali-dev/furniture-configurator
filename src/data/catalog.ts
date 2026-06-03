import type { Config, FurnitureType } from '@/components/constructor/types';
import { DEFAULT_CONFIG } from '@/components/constructor/types';

export const IMG = {
  table: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg',
  coffee: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/86871e1d-0fab-4391-9443-4bb449e9ce29.jpg',
  desk: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/fdaec9ec-80db-497f-b1c0-da50c53baa5e.jpg',
  sofa: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/4b29095e-bf24-4d0f-86af-59497df8adc2.jpg',
  chairOak: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/8c2681ff-ba28-476f-bfef-f481e1763b6f.jpg',
  chairLoft: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/8ecfe4f0-0e8e-4cd2-ab1e-97859cfda4f2.jpg',
};

export const CATEGORIES = [
  { id: 'all', label: 'Все категории', icon: 'LayoutGrid' },
  { id: 'tables', label: 'Столы', icon: 'Table' },
  { id: 'chairs', label: 'Стулья', icon: 'Armchair' },
  { id: 'sofas', label: 'Диваны', icon: 'Sofa' },
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
  chairs: 'nightstand',
  sofas: 'nightstand',
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
  eco?: boolean;
  desc: string;
};

const raw: Omit<Product, 'desc'>[] = [
  // Столы
  { id: 1, title: 'Обеденный стол «Нордик»', price: 28900, category: 'tables', style: 'Скандинавский', material: 'Дуб', img: IMG.table, badge: 'Хит', eco: true },
  { id: 2, title: 'Кофейный столик «Уолнат»', price: 18500, oldPrice: 22000, category: 'tables', style: 'Лофт', material: 'Орех', img: IMG.coffee, badge: 'Скидка', eco: true },
  { id: 3, title: 'Письменный стол «Бланш»', price: 22400, category: 'tables', style: 'Минимализм', material: 'Белый лак', img: IMG.desk },
  { id: 4, title: 'Барный стол «Индастриал»', price: 38000, category: 'tables', style: 'Лофт', material: 'Металл', img: IMG.coffee },

  // Стулья
  { id: 5, title: 'Стул «Сканди» дубовый', price: 8900, category: 'chairs', style: 'Скандинавский', material: 'Дуб', img: IMG.chairOak, badge: 'Хит', eco: true },
  { id: 6, title: 'Стул «Уолнат» с тканью', price: 10500, oldPrice: 12500, category: 'chairs', style: 'Скандинавский', material: 'Ткань', img: IMG.chairOak, badge: 'Скидка', eco: true },
  { id: 7, title: 'Стул «Лофт» металл-орех', price: 9800, category: 'chairs', style: 'Лофт', material: 'Металл', img: IMG.chairLoft },
  { id: 8, title: 'Барный стул «Индастриал»', price: 11200, category: 'chairs', style: 'Лофт', material: 'Орех', img: IMG.chairLoft, eco: true },

  // Диваны
  { id: 9, title: 'Диван «Осло» 3-местный', price: 64900, category: 'sofas', style: 'Скандинавский', material: 'Ткань', img: IMG.sofa, badge: 'Хит', eco: true },
  { id: 10, title: 'Диван «Берген» угловой', price: 89500, oldPrice: 98000, category: 'sofas', style: 'Минимализм', material: 'Ткань', img: IMG.sofa, badge: 'Скидка' },
  { id: 11, title: 'Кресло «Стокгольм»', price: 32400, category: 'sofas', style: 'Скандинавский', material: 'Ткань', img: IMG.sofa, eco: true },
];

const catLabel: Record<string, string> = {
  tables: 'Стол', chairs: 'Стул', sofas: 'Мягкая мебель',
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
    size: p.category === 'sofas' ? 'l' : 'm',
  };
}