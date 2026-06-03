import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';
import { type Product } from '@/data/catalog';
import { useProducts } from '@/context/ProductsContext';
import { useCart } from '@/context/CartContext';

type RoomResult = {
  roomType?: string;
  style?: string;
  palette?: string[];
  paletteNames?: string;
  area?: string;
  materials?: string[];
  categories?: string[];
  comment?: string;
};

function pickProducts(r: RoomResult, list: Product[]): Product[] {
  const cats = r.categories || [];
  const mats = r.materials || [];
  const style = r.style;

  const score = (p: Product) => {
    let s = 0;
    if (cats.includes(p.category)) s += 3;
    if (style && p.style === style) s += 2;
    if (mats.includes(p.material)) s += 2;
    if (p.eco) s += 1;
    if (p.badge === 'Хит') s += 0.5;
    return s;
  };

  return [...list]
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.p);
}

export default function RoomAISection() {
  const { products } = useProducts();
  const { add } = useCart();
  const [img, setImg] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoomResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImg(dataUrl);
      setResult(null);
      setError('');
      analyze(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async (dataUrl: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(BACKEND.roomAnalyze, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (data.result) setResult(data.result);
      else setError('Не удалось распознать комнату. Попробуйте другое фото.');
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImg('');
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const recommended = result ? pickProducts(result, products) : [];

  return (
    <section id="room-ai" className="py-24 lg:py-32 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <span className="section-label">ИИ-подбор интерьера</span>
          <h2 className="section-title text-4xl lg:text-5xl mt-3">Подберём мебель по фото комнаты</h2>
          <p className="font-opensans text-[#888] text-sm max-w-xl mx-auto mt-4">
            Загрузите фото вашей комнаты — ИИ-дизайнер определит стиль, палитру и площадь,
            а затем подберёт мебель, которая идеально впишется.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* LEFT — upload / preview */}
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            {!img ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] border-2 border-dashed border-[#D2B48C] bg-white flex flex-col items-center justify-center gap-3 hover:border-[#A0784A] hover:bg-[#FBF7F0] transition group"
              >
                <div className="w-16 h-16 rounded-full bg-[#F0E8DC] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="ImagePlus" size={28} className="text-[#A0784A]" />
                </div>
                <span className="font-montserrat font-700 text-[12px] uppercase tracking-widest text-[#1A1A1A]">Загрузить фото комнаты</span>
                <span className="font-opensans text-[#999] text-xs">JPG или PNG · до 10 МБ</span>
              </button>
            ) : (
              <div className="relative">
                <img src={img} alt="Комната" className="w-full aspect-[4/3] object-cover border border-[#E8E0D4]" />
                {loading && (
                  <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Icon name="Sparkles" size={30} className="text-white animate-pulse" />
                    <p className="font-montserrat font-700 text-[11px] uppercase tracking-widest text-white">ИИ-дизайнер изучает комнату</p>
                  </div>
                )}
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur w-9 h-9 flex items-center justify-center hover:bg-white transition"
                >
                  <Icon name="X" size={16} className="text-[#1A1A1A]" />
                </button>
              </div>
            )}
            {error && (
              <p className="mt-3 font-opensans text-sm text-[#C0392B] flex items-center gap-2">
                <Icon name="TriangleAlert" size={15} /> {error}
              </p>
            )}
          </div>

          {/* RIGHT — result */}
          <div>
            {!result && !loading && (
              <div className="border border-[#E8E0D4] bg-white p-8 h-full flex flex-col justify-center gap-4">
                {[
                  { icon: 'Palette', t: 'Определим стиль и цветовую гамму' },
                  { icon: 'Ruler', t: 'Оценим площадь и пропорции' },
                  { icon: 'Sofa', t: 'Подберём мебель из каталога' },
                ].map((b) => (
                  <div key={b.t} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F0E8DC] flex items-center justify-center shrink-0">
                      <Icon name={b.icon} size={18} className="text-[#A0784A]" />
                    </div>
                    <span className="font-opensans text-[#555] text-sm">{b.t}</span>
                  </div>
                ))}
              </div>
            )}

            {result && (
              <div className="border border-[#E8E0D4] bg-white p-7 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  {result.roomType && (
                    <span className="font-montserrat font-700 text-[#1A1A1A] text-lg capitalize">{result.roomType}</span>
                  )}
                  {result.style && (
                    <span className="font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-1 bg-[#1A1A1A] text-white">{result.style}</span>
                  )}
                </div>

                {result.palette && result.palette.length > 0 && (
                  <div>
                    <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-2">Палитра{result.paletteNames ? ` · ${result.paletteNames}` : ''}</p>
                    <div className="flex gap-2">
                      {result.palette.slice(0, 5).map((c, i) => (
                        <div key={i} className="w-10 h-10 border border-[#E8E0D4]" style={{ background: c }} title={c} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {result.area && (
                    <div className="flex items-center gap-2">
                      <Icon name="Ruler" size={15} className="text-[#A0784A]" />
                      <span className="font-opensans text-[#555] text-sm">{result.area}</span>
                    </div>
                  )}
                  {result.materials && result.materials.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Icon name="Layers" size={15} className="text-[#A0784A]" />
                      <span className="font-opensans text-[#555] text-sm">{result.materials.join(', ')}</span>
                    </div>
                  )}
                </div>

                {result.comment && (
                  <p className="font-opensans text-[#666] text-sm leading-relaxed border-l-2 border-[#A0784A] pl-4 italic">{result.comment}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recommended products */}
        {recommended.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-2 mb-6">
              <Icon name="Sparkles" size={18} className="text-[#A0784A]" />
              <h3 className="font-montserrat font-700 text-[#1A1A1A] text-lg uppercase tracking-wide">Подобрали для вашей комнаты</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {recommended.map((p) => (
                <div key={p.id} className="group hover-lift flex flex-col">
                  <Link to={`/product/${p.id}`} className="relative overflow-hidden">
                    <img src={p.img} alt={p.title} loading="lazy" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-700" />
                    {p.eco && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 font-montserrat font-700 text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#4CAF50] text-white">
                        <Icon name="Leaf" size={10} /> Эко
                      </span>
                    )}
                  </Link>
                  <div className="border border-t-0 border-[#E8E0D4] p-4 flex flex-col flex-1">
                    <h4 className="font-montserrat font-700 text-[#1A1A1A] text-xs mb-1.5 min-h-[32px]">{p.title}</h4>
                    <span className="font-montserrat font-900 text-[#1A1A1A] text-sm mb-3">{p.price.toLocaleString('ru')} ₽</span>
                    <button
                      onClick={() => add({ id: p.id, title: p.title, price: p.price, img: p.img })}
                      className="mt-auto w-full bg-[#1A1A1A] hover:bg-[#8B4513] text-white font-montserrat font-700 text-[10px] uppercase tracking-widest py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Icon name="ShoppingBag" size={13} /> В корзину
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}