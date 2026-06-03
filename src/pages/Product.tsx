import { useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Navbar from '@/components/Navbar';
import FooterSection from '@/components/FooterSection';
import AIChatWidget from '@/components/AIChatWidget';
import ProductView3D from '@/components/shop/ProductView3D';
import { useCart } from '@/context/CartContext';
import { productById, productConfig } from '@/data/catalog';
import { useProducts } from '@/context/ProductsContext';
import { calcMonthly } from '@/components/constructor/types';

const RoomTryOn = lazy(() => import('@/components/constructor/RoomTryOn'));

export default function Product() {
  const { id } = useParams();
  const { products, loading } = useProducts();
  const product = productById(products, Number(id));
  const { add } = useCart();
  const [tab, setTab] = useState<'view' | 'tryon'>('view');

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 pt-40 pb-40 text-center">
          <Icon name="Loader" size={36} className="text-[#A0784A] mx-auto animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 pt-40 pb-40 text-center">
          <Icon name="PackageX" size={40} className="text-[#D2B48C] mx-auto mb-4" />
          <h1 className="font-montserrat font-700 text-[#1A1A1A] text-2xl">Товар не найден</h1>
          <Link to="/#catalog" className="inline-block mt-6 artora-btn-primary">В каталог</Link>
        </div>
      </div>
    );
  }

  const cfg = productConfig(product);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 lg:pt-32 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 font-montserrat text-[11px] uppercase tracking-widest text-[#999] mb-8">
          <Link to="/" className="hover:text-[#8B4513]">Главная</Link>
          <Icon name="ChevronRight" size={13} />
          <Link to="/#catalog" className="hover:text-[#8B4513]">Каталог</Link>
          <Icon name="ChevronRight" size={13} />
          <span className="text-[#1A1A1A]">{product.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* LEFT — 3D / try-on */}
          <div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTab('view')}
                className={`flex items-center gap-2 px-4 py-2.5 font-montserrat font-700 text-[10px] uppercase tracking-widest border transition ${
                  tab === 'view' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A]'
                }`}
              >
                <Icon name="Rotate3d" size={13} /> 3D-обзор
              </button>
              <button
                onClick={() => setTab('tryon')}
                className={`flex items-center gap-2 px-4 py-2.5 font-montserrat font-700 text-[10px] uppercase tracking-widest border transition ${
                  tab === 'tryon' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A]'
                }`}
              >
                <Icon name="Layers" size={13} /> Примерить в комнату
              </button>
            </div>

            {tab === 'view' ? (
              <ProductView3D src={product.img} alt={product.title} className="w-full aspect-square" />
            ) : (
              <Suspense fallback={<div className="aspect-square bg-[#242424] flex items-center justify-center"><Icon name="Loader" size={28} className="text-[#A0784A] animate-spin" /></div>}>
                <RoomTryOn config={cfg} warm={false} />
              </Suspense>
            )}
          </div>

          {/* RIGHT — info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-montserrat text-[10px] uppercase tracking-widest text-[#A0784A]">{product.style}</span>
              <span className="text-[#E8E0D4]">·</span>
              <span className="font-montserrat text-[10px] uppercase tracking-widest text-[#999]">{product.material}</span>
              {product.badge && (
                <span className={`ml-2 font-montserrat font-700 text-[9px] uppercase tracking-widest px-2 py-0.5 ${product.badge === 'Скидка' ? 'bg-[#8B4513] text-white' : 'bg-[#F0E8DC] text-[#1A1A1A]'}`}>{product.badge}</span>
              )}
              {product.eco && (
                <span className="flex items-center gap-1 font-montserrat font-700 text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#4CAF50] text-white">
                  <Icon name="Leaf" size={10} /> Эко
                </span>
              )}
            </div>

            <h1 className="font-montserrat font-900 text-[#1A1A1A] text-3xl lg:text-4xl leading-tight">{product.title}</h1>

            <div className="flex items-baseline gap-3 mt-5">
              <span className="font-montserrat font-900 text-[#1A1A1A] text-3xl">{product.price.toLocaleString('ru')} ₽</span>
              {product.oldPrice && <span className="font-opensans text-[#bbb] text-lg line-through">{product.oldPrice.toLocaleString('ru')} ₽</span>}
            </div>
            <p className="font-opensans text-[#A0784A] text-sm mt-1">
              или от {calcMonthly(product.price).toLocaleString('ru')} ₽/мес в рассрочку
            </p>

            <p className="font-opensans text-[#666] text-sm leading-relaxed mt-6">{product.desc}</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { icon: 'Truck', t: 'Доставка по РФ' },
                { icon: 'ShieldCheck', t: 'Гарантия 5 лет' },
                { icon: 'Wrench', t: 'Сборка включена' },
                { icon: 'RotateCcw', t: 'Возврат 14 дней' },
              ].map((b) => (
                <div key={b.t} className="flex items-center gap-2 border border-[#E8E0D4] px-3 py-2.5">
                  <Icon name={b.icon} size={16} className="text-[#A0784A]" />
                  <span className="font-opensans text-[#555] text-xs">{b.t}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => add({ id: product.id, title: product.title, price: product.price, img: product.img })}
                className="flex-1 artora-btn-primary flex items-center justify-center gap-2"
              >
                <Icon name="ShoppingBag" size={16} /> В корзину
              </button>
              <Link to="/#room-ai" className="artora-btn-outline flex items-center justify-center gap-2 px-5">
                <Icon name="Sparkles" size={16} /> Подбор по фото
              </Link>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-montserrat font-700 text-[#1A1A1A] text-xl uppercase tracking-wide mb-6">Похожие товары</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((r) => (
                <Link key={r.id} to={`/product/${r.id}`} className="group hover-lift">
                  <div className="overflow-hidden">
                    <img src={r.img} alt={r.title} loading="lazy" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="border border-t-0 border-[#E8E0D4] p-4">
                    <h3 className="font-montserrat font-700 text-[#1A1A1A] text-xs mb-1.5 min-h-[32px]">{r.title}</h3>
                    <span className="font-montserrat font-900 text-[#1A1A1A] text-sm">{r.price.toLocaleString('ru')} ₽</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <FooterSection />
      <AIChatWidget />
    </div>
  );
}