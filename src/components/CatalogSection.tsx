import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useCart } from '@/context/CartContext';
import PhotoTilt3D from '@/components/shop/PhotoTilt3D';
import {
  CATEGORIES,
  FILTERS_MATERIAL,
  products,
  type Product,
} from '@/data/catalog';

function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const [show3d, setShow3d] = useState(false);

  return (
    <div className="group hover-lift flex flex-col">
      <div className="relative overflow-hidden h-52">
        {show3d ? (
          <PhotoTilt3D src={p.img} alt={p.title} className="w-full h-full" amplitude={10} />
        ) : (
          <Link to={`/product/${p.id}`}>
            <img
              src={p.img}
              alt={p.title}
              className="w-full h-52 object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </Link>
        )}

        {p.badge && !show3d && (
          <div className="absolute top-3 left-3">
            <span className={`font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-1 ${
              p.badge === 'Скидка' ? 'bg-[#8B4513] text-white' : 'bg-white text-[#1A1A1A]'
            }`}>
              {p.badge}
            </span>
          </div>
        )}

        {p.eco && !show3d && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 font-montserrat font-700 text-[10px] uppercase tracking-widest px-2.5 py-1 bg-[#4CAF50] text-white">
              <Icon name="Leaf" size={11} />
              Эко
            </span>
          </div>
        )}

        <button
          onClick={() => setShow3d((v) => !v)}
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-[#1A1A1A] font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-2 flex items-center gap-1 hover:bg-[#1A1A1A] hover:text-white transition-colors"
        >
          <Icon name={show3d ? 'Image' : 'Rotate3d'} size={12} />
          {show3d ? 'Фото' : '3D'}
        </button>
      </div>

      <div className="border border-t-0 border-[#E8E0D4] p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-montserrat text-[10px] uppercase tracking-widest text-[#A0784A]">{p.style}</span>
          <span className="text-[#E8E0D4]">·</span>
          <span className="font-montserrat text-[10px] uppercase tracking-widest text-[#999]">{p.material}</span>
        </div>
        <Link to={`/product/${p.id}`}>
          <h3 className="font-montserrat font-700 text-[#1A1A1A] text-sm mb-2 min-h-[40px] hover:text-[#8B4513] transition-colors">{p.title}</h3>
        </Link>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-montserrat font-900 text-[#1A1A1A] text-base">{p.price.toLocaleString('ru')} ₽</span>
          {p.oldPrice && (
            <span className="font-opensans text-[#bbb] text-xs line-through">{p.oldPrice.toLocaleString('ru')} ₽</span>
          )}
        </div>
        <button
          onClick={() => add({ id: p.id, title: p.title, price: p.price, img: p.img })}
          className="mt-auto w-full bg-[#1A1A1A] hover:bg-[#8B4513] text-white font-montserrat font-700 text-[11px] uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-colors"
        >
          <Icon name="ShoppingBag" size={14} />
          В корзину
        </button>
      </div>
    </div>
  );
}

export default function CatalogSection() {
  const [category, setCategory] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('Все');
  const [priceMax, setPriceMax] = useState(220000);
  const [ecoOnly, setEcoOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const filtered = products.filter((p) => {
    const byCat = category === 'all' || p.category === category;
    const byMat = materialFilter === 'Все' || p.material === materialFilter;
    const byPrice = p.price <= priceMax;
    const byEco = !ecoOnly || p.eco;
    return byCat && byMat && byPrice && byEco;
  });

  const visible = filtered.slice(0, visibleCount);

  return (
    <section id="catalog" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <span className="section-label">Каталог магазина</span>
            <h2 className="section-title text-4xl lg:text-5xl mt-3">Купить мебель</h2>
          </div>
          <p className="font-opensans text-[#888] text-sm max-w-xs">
            Каждый товар можно покрутить в 3D, примерить к интерьеру и заказать онлайн с доставкой и сборкой.
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
          <div className="flex items-end">
            <button
              onClick={() => { setEcoOnly((v) => !v); setVisibleCount(8); }}
              className={`flex items-center gap-2 px-4 py-2 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition-all duration-200 ${
                ecoOnly
                  ? 'bg-[#4CAF50] text-white border-[#4CAF50]'
                  : 'border-[#E8E0D4] text-[#666] hover:border-[#4CAF50] hover:text-[#4CAF50]'
              }`}
            >
              <Icon name="Leaf" size={14} />
              Только эко
            </button>
          </div>
        </div>

        <p className="font-opensans text-[#999] text-sm mb-6">
          Найдено товаров: <span className="font-montserrat font-700 text-[#1A1A1A]">{filtered.length}</span>
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Search" size={32} className="text-[#D2B48C] mx-auto mb-3" />
            <p className="font-montserrat font-700 text-[#999] uppercase tracking-widest text-sm">Ничего не найдено</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visible.map((p) => (
                <ProductCard key={p.id} p={p} />
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