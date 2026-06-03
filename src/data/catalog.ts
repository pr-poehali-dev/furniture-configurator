import type { Config, FurnitureType } from '@/components/constructor/types';
import { DEFAULT_CONFIG } from '@/components/constructor/types';

export const CATEGORIES = [
  { id: 'all', label: 'Все категории', icon: 'LayoutGrid' },
  { id: 'tables', label: 'Столы', icon: 'Table' },
  { id: 'chairs', label: 'Стулья', icon: 'Armchair' },
  { id: 'sofas', label: 'Диваны', icon: 'Sofa' },
];

// для админки (без «Все категории»)
export const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'all');

export const FILTERS_MATERIAL = ['Все', 'Дуб', 'Орех', 'Белый лак', 'Ткань', 'Металл'];
export const PRODUCT_MATERIALS = ['Дуб', 'Орех', 'Белый лак', 'Ткань', 'Металл'];
export const PRODUCT_STYLES = ['Скандинавский', 'Лофт', 'Минимализм', 'Классика'];
export const PRODUCT_BADGES = ['', 'Хит', 'Скидка'];

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
  isActive?: boolean;
  sortOrder?: number;
};

export function productById(list: Product[], id: number): Product | undefined {
  return list.find((p) => p.id === id);
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
