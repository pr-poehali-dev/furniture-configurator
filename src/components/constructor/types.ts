export type FurnitureType = 'table' | 'shelf' | 'nightstand';

export type Config = {
  furniture: FurnitureType;
  material: string; // oak | walnut | white
  size: string;
  thickness: string;
  legsStyle: string; // classic | cone | metal
  legsHeight: string;
  hardware: string;
};

export type Option = { id: string; label: string; price: number; color?: string; sub?: string };

export const MATERIALS: Option[] = [
  { id: 'oak', label: 'Дуб', price: 0, color: '#c89b62' },
  { id: 'walnut', label: 'Орех', price: 3000, color: '#6e4326' },
  { id: 'white', label: 'Белый лак', price: 1500, color: '#f4f0e8' },
];

export const SIZES: Option[] = [
  { id: 's', label: '80×60', sub: 'компакт', price: 0 },
  { id: 'm', label: '120×75', sub: 'стандарт', price: 4000 },
  { id: 'l', label: '160×90', sub: 'большой', price: 8000 },
];

export const THICKNESS: Option[] = [
  { id: 't2', label: '2 см', price: 0 },
  { id: 't3', label: '3 см', price: 2500 },
];

export const LEGS_STYLE: Option[] = [
  { id: 'classic', label: 'Классические', price: 0 },
  { id: 'cone', label: 'Конические', price: 1800 },
  { id: 'metal', label: 'Металлические', price: 3200 },
];

export const LEGS_HEIGHT: Option[] = [
  { id: 'h70', label: '70 см', price: 0 },
  { id: 'h75', label: '75 см', price: 0 },
  { id: 'h80', label: '80 см', price: 500 },
];

export const HARDWARE: Option[] = [
  { id: 'none', label: 'Без ручек', price: 0 },
  { id: 'h1', label: 'Латунь', price: 2200 },
  { id: 'h2', label: 'Матовое железо', price: 1800 },
  { id: 'h3', label: 'Дерево', price: 1200 },
];

export const FURNITURE_TYPES: { id: FurnitureType; label: string; icon: string; base: number }[] = [
  { id: 'table', label: 'Стол', icon: 'Table', base: 18900 },
  { id: 'shelf', label: 'Стеллаж', icon: 'Library', base: 24500 },
  { id: 'nightstand', label: 'Тумба', icon: 'Archive', base: 12900 },
];

export const DEFAULT_CONFIG: Config = {
  furniture: 'table',
  material: 'oak',
  size: 'm',
  thickness: 't2',
  legsStyle: 'cone',
  legsHeight: 'h75',
  hardware: 'h1',
};

export function calcPrice(config: Config): number {
  const base = FURNITURE_TYPES.find((f) => f.id === config.furniture)?.base ?? 0;
  const add = (arr: Option[], id: string) => arr.find((o) => o.id === id)?.price ?? 0;
  return (
    base +
    add(MATERIALS, config.material) +
    add(SIZES, config.size) +
    add(THICKNESS, config.thickness) +
    add(LEGS_STYLE, config.legsStyle) +
    add(LEGS_HEIGHT, config.legsHeight) +
    add(HARDWARE, config.hardware)
  );
}

export const INSTALLMENT_MONTHS = 12;

export function calcMonthly(price: number): number {
  return Math.ceil(price / INSTALLMENT_MONTHS / 10) * 10;
}

export const GALLERY: Record<FurnitureType, string[]> = {
  table: [
    'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/21a838e7-7ffe-4044-a0f1-ec27e00b3861.jpg',
    'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg',
    'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/86871e1d-0fab-4391-9443-4bb449e9ce29.jpg',
  ],
  shelf: [
    'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/8d22ebee-4212-4f25-ac54-72a25c955029.jpg',
    'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/35cdd135-0b5f-4b71-9fd8-d7cfe7f31e87.jpg',
  ],
  nightstand: [
    'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/8223f83d-b144-4fe6-aae3-b68959b8f7d1.jpg',
    'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/fdaec9ec-80db-497f-b1c0-da50c53baa5e.jpg',
  ],
};