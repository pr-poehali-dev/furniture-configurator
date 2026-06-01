import { useState } from 'react';
import Icon from '@/components/ui/icon';

const IMG = {
  table: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg',
  coffee: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/86871e1d-0fab-4391-9443-4bb449e9ce29.jpg',
  desk: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/fdaec9ec-80db-497f-b1c0-da50c53baa5e.jpg',
  shelf: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/35cdd135-0b5f-4b71-9fd8-d7cfe7f31e87.jpg',
  sofa: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/4b29095e-bf24-4d0f-86af-59497df8adc2.jpg',
  wardrobe: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/57fce72f-e06d-49a9-bc63-b3491789da26.jpg',
  kitchen: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/b2ca5be4-9537-47bb-a101-d1cc23821a30.jpg',
  bed: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/165ae52f-be20-4ba5-a8b0-2e4a02d80084.jpg',
};

const CATEGORIES = [
  { id: 'all', label: 'Все категории', icon: 'LayoutGrid' },
  { id: 'tables', label: 'Столы', icon: 'Table' },
  { id: 'sofas', label: 'Диваны', icon: 'Sofa' },
  { id: 'wardrobes', label: 'Шкафы', icon: 'DoorClosed' },
  { id: 'kitchens', label: 'Кухни', icon: 'CookingPot' },
  { id: 'beds', label: 'Кровати', icon: 'BedDouble' },
  { id: 'storage', label: 'Стеллажи', icon: 'Library' },
];

const FILTERS_MATERIAL = ['Все', 'Дуб', 'Орех', 'Белый лак', 'Ткань', 'Металл'];

type Product = {
  id: number;
  title: string;
  price: number;
  oldPrice?: number;
  category: string;
  style: string;
  material: string;
  img: string;
  badge?: string;
};

const products: Product[] = [
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

export default function CatalogSection() {
  const [category, setCategory] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('Все');
  const [priceMax, setPriceMax] = useState(220000);
  const [visibleCount, setVisibleCount] = useState(8);

  const filtered = products.filter((p) => {
    const byCat = category === 'all' || p.category === category;
    const byMat = materialFilter === 'Все' || p.material === materialFilter;
    const byPrice = p.price <= priceMax;
    return byCat && byMat && byPrice;
  });

  const visible = filtered.slice(0, visibleCount);

  return (
    <section id="catalog" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <span className="section-label">Готовые решения</span>
            <h2 className="section-title text-4xl lg:text-5xl mt-3">Каталог мебели</h2>
          </div>
          <p className="font-opensans text-[#888] text-sm max-w-xs">
            Более 400 моделей в наличии и под заказ. Любую можно доработать под ваши размеры в конструкторе.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCategory(c.id); setVisibleCount(8); }}
              className={`flex items-center gap-2 px-5 py-3 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition-all duration-200 ${
                category === c.id
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A] hover:text-[#A0784A]'
              }`}
            >
              <Icon name={c.icon} fallback="Box" size={15} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10 pb-8 border-b border-[#E8E0D4]">
          <div className="flex-1">
            <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-2">Материал</p>
            <div className="flex flex-wrap gap-2">
              {FILTERS_MATERIAL.map((f) => (
                <button
                  key={f}
                  onClick={() => setMaterialFilter(f)}
                  className={`px-4 py-1.5 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition-all duration-200 ${
                    materialFilter === f
                      ? 'bg-[#A0784A] text-white border-[#A0784A]'
                      : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A] hover:text-[#A0784A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-64">
            <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-2">
              Цена до: {priceMax.toLocaleString('ru')} ₽
            </p>
            <input
              type="range"
              min={18000}
              max={220000}
              step={1000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#8B4513]"
            />
          </div>
        </div>

        {/* Count */}
        <p className="font-opensans text-[#999] text-sm mb-6">
          Найдено товаров: <span className="font-montserrat font-700 text-[#1A1A1A]">{filtered.length}</span>
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Search" size={32} className="text-[#D2B48C] mx-auto mb-3" />
            <p className="font-montserrat font-700 text-[#999] uppercase tracking-widest text-sm">
              Ничего не найдено
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visible.map((p) => (
                <div key={p.id} className="group hover-lift cursor-pointer">
                  <div className="relative overflow-hidden">
                    <img
                      src={p.img}
                      alt={p.title}
                      className="w-full h-52 object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {p.badge && (
                      <div className="absolute top-3 left-3">
                        <span className={`font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-1 ${
                          p.badge === 'Скидка' ? 'bg-[#8B4513] text-white' : 'bg-white text-[#1A1A1A]'
                        }`}>
                          {p.badge}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => document.querySelector('#constructor')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-white text-[#1A1A1A] font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-2 flex items-center gap-1 hover:bg-[#1A1A1A] hover:text-white transition-colors"
                      >
                        <Icon name="Wrench" size={12} />
                        В конструктор
                      </button>
                    </div>
                  </div>
                  <div className="border border-t-0 border-[#E8E0D4] p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-montserrat text-[10px] uppercase tracking-widest text-[#A0784A]">
                        {p.style}
                      </span>
                      <span className="text-[#E8E0D4]">·</span>
                      <span className="font-montserrat text-[10px] uppercase tracking-widest text-[#999]">
                        {p.material}
                      </span>
                    </div>
                    <h3 className="font-montserrat font-700 text-[#1A1A1A] text-sm mb-2 min-h-[40px]">{p.title}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-montserrat font-900 text-[#1A1A1A] text-base">
                        {p.price.toLocaleString('ru')} ₽
                      </span>
                      {p.oldPrice && (
                        <span className="font-opensans text-[#bbb] text-xs line-through">
                          {p.oldPrice.toLocaleString('ru')} ₽
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < filtered.length && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleCount((c) => c + 8)}
                  className="artora-btn-outline inline-flex items-center gap-2"
                >
                  <Icon name="Plus" size={16} />
                  Показать ещё
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
