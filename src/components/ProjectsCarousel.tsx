import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useProducts } from '@/context/ProductsContext';
import { useCart } from '@/context/CartContext';

export default function ProjectsCarousel() {
  const { products } = useProducts();
  const { add } = useCart();
  // Бестселлеры — хиты из каталога; если хитов мало, берём первые товары
  const hits = products.filter((p) => p.badge === 'Хит');
  const bestsellers = (hits.length >= 3 ? hits : products).slice(0, 8);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const len = bestsellers.length;

  const goTo = (idx: number) => {
    if (isAnimating || len === 0) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const prev = () => goTo((current - 1 + len) % len);
  const next = () => goTo((current + 1) % len);

  useEffect(() => {
    if (len <= 3) return;
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % len), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [len]);

  if (len === 0) return null;

  const visible = [
    bestsellers[current % len],
    bestsellers[(current + 1) % len],
    bestsellers[(current + 2) % len],
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="section-label">Хиты продаж</span>
            <h2 className="section-title text-4xl lg:text-5xl mt-3">Бестселлеры месяца</h2>
          </div>
          {len > 3 && (
            <div className="flex gap-2">
              <button
                onClick={prev}
                className="w-12 h-12 border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all duration-200"
                aria-label="Предыдущий"
              >
                <Icon name="ArrowLeft" size={18} />
              </button>
              <button
                onClick={next}
                className="w-12 h-12 border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all duration-200"
                aria-label="Следующий"
              >
                <Icon name="ArrowRight" size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="group flex flex-col overflow-hidden hover-lift"
              style={{ opacity: isAnimating ? 0.7 : 1, transition: 'opacity 0.4s ease' }}
            >
              <Link to={`/product/${p.id}`} className="relative overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-64 lg:h-72 object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  <span className="bg-white font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-1 text-[#1A1A1A]">{p.style}</span>
                  {p.eco && (
                    <span className="flex items-center gap-1 bg-[#4CAF50] font-montserrat font-700 text-[10px] uppercase tracking-widest px-2.5 py-1 text-white">
                      <Icon name="Leaf" size={11} /> Эко
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-[#1A1A1A] opacity-0 group-hover:opacity-20 transition-opacity duration-400" />
              </Link>
              <div className="bg-white p-5 border border-t-0 border-[#E8E0D4] flex flex-col flex-1">
                <Link to={`/product/${p.id}`}>
                  <h3 className="font-montserrat font-700 text-[#1A1A1A] text-sm hover:text-[#8B4513] transition-colors">{p.title}</h3>
                </Link>
                <div className="flex items-baseline gap-2 mt-1.5 mb-4">
                  <span className="font-montserrat font-900 text-[#1A1A1A] text-base">{p.price.toLocaleString('ru')} ₽</span>
                  {p.oldPrice && <span className="font-opensans text-[#bbb] text-xs line-through">{p.oldPrice.toLocaleString('ru')} ₽</span>}
                </div>
                <button
                  onClick={() => add({ id: p.id, title: p.title, price: p.price, img: p.img })}
                  className="mt-auto w-full bg-[#1A1A1A] hover:bg-[#8B4513] text-white font-montserrat font-700 text-[11px] uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <Icon name="ShoppingBag" size={14} /> В корзину
                </button>
              </div>
            </div>
          ))}
        </div>

        {len > 3 && (
          <div className="flex justify-center gap-2 mt-8">
            {bestsellers.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 ${i === current ? 'w-8 h-2 bg-[#1A1A1A]' : 'w-2 h-2 bg-[#D2B48C]'}`}
                aria-label={`Слайд ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}