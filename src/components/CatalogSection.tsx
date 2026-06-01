import { useState } from 'react';
import Icon from '@/components/ui/icon';

const FILTERS_STYLE = ['Все', 'Скандинавский', 'Лофт', 'Классика', 'Минимализм'];
const FILTERS_MATERIAL = ['Все', 'Дуб', 'Орех', 'Белый лак', 'Металл'];

const products = [
  { id: 1, title: 'Стол «Нордик»', price: 28900, style: 'Скандинавский', material: 'Дуб', img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg' },
  { id: 2, title: 'Стол «Уолнат»', price: 34500, style: 'Лофт', material: 'Орех', img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/86871e1d-0fab-4391-9443-4bb449e9ce29.jpg' },
  { id: 3, title: 'Стол «Бланш»', price: 22400, style: 'Минимализм', material: 'Белый лак', img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/fdaec9ec-80db-497f-b1c0-da50c53baa5e.jpg' },
  { id: 4, title: 'Стеллаж «Лофт»', price: 41200, style: 'Лофт', material: 'Металл', img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/35cdd135-0b5f-4b71-9fd8-d7cfe7f31e87.jpg' },
  { id: 5, title: 'Консоль «Классик»', price: 18800, style: 'Классика', material: 'Дуб', img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg' },
  { id: 6, title: 'Стол «Индастриал»', price: 38000, style: 'Лофт', material: 'Металл', img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/86871e1d-0fab-4391-9443-4bb449e9ce29.jpg' },
];

export default function CatalogSection() {
  const [styleFilter, setStyleFilter] = useState('Все');
  const [materialFilter, setMaterialFilter] = useState('Все');
  const [priceMax, setPriceMax] = useState(50000);

  const filtered = products.filter((p) => {
    const byStyle = styleFilter === 'Все' || p.style === styleFilter;
    const byMat = materialFilter === 'Все' || p.material === materialFilter;
    const byPrice = p.price <= priceMax;
    return byStyle && byMat && byPrice;
  });

  return (
    <section id="catalog" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <span className="section-label">Готовые решения</span>
          <h2 className="section-title text-4xl lg:text-5xl mt-3">Каталог</h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10 pb-8 border-b border-[#E8E0D4]">
          <div className="flex-1">
            <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-2">Стиль</p>
            <div className="flex flex-wrap gap-2">
              {FILTERS_STYLE.map((f) => (
                <button
                  key={f}
                  onClick={() => setStyleFilter(f)}
                  className={`px-4 py-1.5 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition-all duration-200 ${
                    styleFilter === f
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A] hover:text-[#A0784A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-2">Материал</p>
            <div className="flex flex-wrap gap-2">
              {FILTERS_MATERIAL.map((f) => (
                <button
                  key={f}
                  onClick={() => setMaterialFilter(f)}
                  className={`px-4 py-1.5 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition-all duration-200 ${
                    materialFilter === f
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A] hover:text-[#A0784A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-48">
            <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-2">
              Цена до: {priceMax.toLocaleString('ru')} ₽
            </p>
            <input
              type="range"
              min={15000}
              max={50000}
              step={1000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#8B4513]"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Search" size={32} className="text-[#D2B48C] mx-auto mb-3" />
            <p className="font-montserrat font-700 text-[#999] uppercase tracking-widest text-sm">
              Ничего не найдено
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <div key={p.id} className="group hover-lift cursor-pointer">
                <div className="relative overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-montserrat font-700 text-[#1A1A1A] text-sm">{p.title}</h3>
                    <span className="font-montserrat font-900 text-[#1A1A1A] text-sm">
                      {p.price.toLocaleString('ru')} ₽
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
