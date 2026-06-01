import { useState, lazy, Suspense, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';
import {
  Config,
  DEFAULT_CONFIG,
  calcPrice,
  MATERIALS,
  SIZES,
  THICKNESS,
  LEGS_STYLE,
  LEGS_HEIGHT,
  HARDWARE,
  FURNITURE_TYPES,
  GALLERY,
  Option,
  FurnitureType,
} from './constructor/types';
import SketchTool from './constructor/SketchTool';
import RoomTryOn from './constructor/RoomTryOn';

const Scene3D = lazy(() => import('./constructor/Scene3D'));

const VALID = {
  furniture: ['table', 'shelf', 'nightstand'],
  material: ['oak', 'walnut', 'white'],
  size: ['s', 'm', 'l'],
  thickness: ['t2', 't3'],
  legsStyle: ['classic', 'cone', 'metal'],
  legsHeight: ['h70', 'h75', 'h80'],
  hardware: ['none', 'h1', 'h2', 'h3'],
} as const;

function OptionGroup({
  title,
  options,
  value,
  onChange,
  swatch,
}: {
  title: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  swatch?: boolean;
}) {
  return (
    <div className="mb-6">
      <p className="font-montserrat font-700 text-[11px] uppercase tracking-widest text-[#999] mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} className={`option-card ${value === o.id ? 'selected' : ''}`}>
            {swatch && o.color && (
              <div className="w-6 h-6 mx-auto mb-2 border border-[#555] rounded-sm" style={{ backgroundColor: o.color }} />
            )}
            <div className="font-montserrat font-700 text-xs">{o.label}</div>
            {o.sub && <div className={`text-[9px] mt-0.5 ${value === o.id ? 'text-[#D2B48C]' : 'text-[#999]'}`}>{o.sub}</div>}
            {o.price > 0 && (
              <div className={`text-[10px] mt-0.5 ${value === o.id ? 'text-[#D2B48C]' : 'text-[#A0784A]'}`}>
                +{o.price.toLocaleString('ru')} ₽
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ConstructorSection() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [submitted, setSubmitted] = useState(false);
  const [warm, setWarm] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState({ name: '', phone: '' });
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<'build' | 'tryon'>('build');
  const captureRef = useRef<(() => string) | null>(null);

  const price = calcPrice(config);
  const set = (key: keyof Config) => (val: string) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    if (key === 'furniture') setGalleryIdx(0);
  };

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    setSubmitted(false);
    setShowForm(false);
    setLead({ name: '', phone: '' });
    setGalleryIdx(0);
  };

  const submitLead = async () => {
    if (!lead.name.trim() || !lead.phone.trim() || sending) return;
    setSending(true);
    try {
      await fetch(BACKEND.leads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'constructor',
          name: lead.name,
          phone: lead.phone,
          config,
          price,
        }),
      });
      setSubmitted(true);
      setShowForm(false);
    } catch {
      setSubmitted(true);
      setShowForm(false);
    } finally {
      setSending(false);
    }
  };

  const applyFromSketch = (partial: Partial<Config>) => {
    setConfig((prev) => {
      const next = { ...prev };
      (Object.keys(VALID) as (keyof typeof VALID)[]).forEach((key) => {
        const val = partial[key];
        if (val && (VALID[key] as readonly string[]).includes(val)) {
          if (key === 'furniture') next.furniture = val as FurnitureType;
          else (next[key] as string) = val;
        }
      });
      return next;
    });
    setGalleryIdx(0);
    document.querySelector('#constructor-3d')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const labelOf = (arr: Option[], id: string) => arr.find((o) => o.id === id)?.label ?? '';
  const gallery = GALLERY[config.furniture];

  const exportImage = async () => {
    if (!captureRef.current || exporting) return;
    setExporting(true);
    try {
      const shot = captureRef.current();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = shot;
      });

      const W = 1280;
      const H = 960;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // background
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(0, 0, W, H);

      // render area for 3D shot (keep aspect, contain)
      const padTop = 96;
      const areaH = 660;
      const ratio = img.width / img.height;
      let dw = W - 120;
      let dh = dw / ratio;
      if (dh > areaH) {
        dh = areaH;
        dw = dh * ratio;
      }
      const dx = (W - dw) / 2;
      ctx.drawImage(img, dx, padTop + (areaH - dh) / 2, dw, dh);

      // header
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px Montserrat, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('ARTORA', 60, 44);
      ctx.fillStyle = '#A0784A';
      ctx.font = '700 16px Montserrat, sans-serif';
      ctx.fillText('МЕБЕЛЬ НА ЗАКАЗ · ВАША КОНФИГУРАЦИЯ', 60, 92);

      // bottom spec bar
      const barY = padTop + areaH + 24;
      ctx.fillStyle = '#242424';
      ctx.fillRect(60, barY, W - 120, 140);

      const specs = [
        ['Предмет', FURNITURE_TYPES.find((f) => f.id === config.furniture)?.label ?? ''],
        ['Материал', labelOf(MATERIALS, config.material)],
        ['Размер', `${labelOf(SIZES, config.size)} см`],
        ['Толщина', labelOf(THICKNESS, config.thickness)],
        ['Ножки', labelOf(LEGS_STYLE, config.legsStyle)],
        ['Фурнитура', labelOf(HARDWARE, config.hardware)],
      ];
      const colW = (W - 160) / 3;
      specs.forEach((s, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const sx = 90 + col * colW;
        const sy = barY + 28 + row * 52;
        ctx.fillStyle = '#777';
        ctx.font = '700 13px Montserrat, sans-serif';
        ctx.fillText(s[0].toUpperCase(), sx, sy);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 20px "Open Sans", sans-serif';
        ctx.fillText(s[1], sx, sy + 18);
      });

      // price (right side of header)
      const priceStr = `${price.toLocaleString('ru')} ₽`;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#D2B48C';
      ctx.font = '900 40px Montserrat, sans-serif';
      ctx.fillText(priceStr, W - 60, 50);
      ctx.fillStyle = '#777';
      ctx.font = '700 13px Montserrat, sans-serif';
      ctx.fillText('ИТОГОВАЯ СТОИМОСТЬ', W - 60, 96);
      ctx.textAlign = 'left';

      const link = document.createElement('a');
      link.download = `artora-${config.furniture}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      /* ignore */
    } finally {
      setExporting(false);
    }
  };

  return (
    <section id="constructor" className="py-24 lg:py-32 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-8">
          <span className="section-label text-[#A0784A]">Подбор мебели · 3D</span>
          <h2 className="font-montserrat font-900 text-white text-4xl lg:text-5xl mt-3 leading-tight">
            {tab === 'build' ? 'Собери свою мебель' : 'Примерь мебель в помещении'}
          </h2>
          <p className="font-opensans text-white/50 text-sm mt-3 max-w-xl">
            {tab === 'build'
              ? 'Выбирай предмет, размеры, цвет и фактуру — крути 3D-модель мышкой, цена считается мгновенно.'
              : 'Загрузи фото комнаты, офиса или другого помещения — собранная мебель встанет в кадр в реальном масштабе.'}
          </p>
        </div>

        {/* Two main blocks switch */}
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {([
            { id: 'build', icon: 'SlidersHorizontal', title: 'Конструктор мебели', desc: 'Геометрия, цвет, фактура и фурнитура' },
            { id: 'tryon', icon: 'Layers', title: 'Примерка в помещении', desc: 'Подбор мебели на фото вашей комнаты или офиса' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-left p-5 border transition-all duration-200 flex items-start gap-4 ${
                tab === t.id
                  ? 'bg-white border-white'
                  : 'border-white/15 hover:border-[#A0784A]'
              }`}
            >
              <div className={`w-11 h-11 flex items-center justify-center flex-shrink-0 ${tab === t.id ? 'bg-[#A0784A] text-white' : 'bg-white/10 text-[#A0784A]'}`}>
                <Icon name={t.icon} size={20} />
              </div>
              <div>
                <p className={`font-montserrat font-700 text-sm uppercase tracking-widest ${tab === t.id ? 'text-[#1A1A1A]' : 'text-white'}`}>
                  {t.title}
                </p>
                <p className={`font-opensans text-xs mt-1 ${tab === t.id ? 'text-[#666]' : 'text-white/45'}`}>
                  {t.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {tab === 'tryon' ? (
          <RoomTryOn config={config} warm={warm} />
        ) : (
        <>
        {/* Furniture type switch */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FURNITURE_TYPES.map((f) => (
            <button
              key={f.id}
              onClick={() => set('furniture')(f.id)}
              className={`flex items-center gap-2 px-5 py-3 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition-all duration-200 ${
                config.furniture === f.id
                  ? 'bg-white text-[#1A1A1A] border-white'
                  : 'border-white/20 text-white/60 hover:border-[#A0784A] hover:text-[#A0784A]'
              }`}
            >
              <Icon name={f.icon} fallback="Box" size={15} />
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[360px,1fr] gap-8 items-start">
          {/* LEFT — Options */}
          <div className="bg-[#242424] p-6 lg:p-8">
            <div className="mb-4 pb-4 border-b border-[#333]">
              <p className="font-montserrat font-700 text-white text-sm uppercase tracking-widest">Материал и корпус</p>
            </div>
            <OptionGroup title="Материал" options={MATERIALS} value={config.material} onChange={set('material')} swatch />
            <OptionGroup title="Размер (см)" options={SIZES} value={config.size} onChange={set('size')} />
            <OptionGroup title="Толщина" options={THICKNESS} value={config.thickness} onChange={set('thickness')} />

            <div className="mb-4 pb-4 border-b border-[#333] mt-6">
              <p className="font-montserrat font-700 text-white text-sm uppercase tracking-widest">
                {config.furniture === 'shelf' ? 'Каркас' : 'Ножки'}
              </p>
            </div>
            <OptionGroup title="Стиль" options={LEGS_STYLE} value={config.legsStyle} onChange={set('legsStyle')} />
            <OptionGroup title="Высота" options={LEGS_HEIGHT} value={config.legsHeight} onChange={set('legsHeight')} />

            <div className="mb-4 pb-4 border-b border-[#333] mt-6">
              <p className="font-montserrat font-700 text-white text-sm uppercase tracking-widest">Фурнитура</p>
            </div>
            <OptionGroup title="Ручки" options={HARDWARE} value={config.hardware} onChange={set('hardware')} />
          </div>

          {/* RIGHT — 3D + gallery + summary */}
          <div className="flex flex-col gap-6">
            {/* 3D Visualizer */}
            <div id="constructor-3d" className="bg-[#242424] relative overflow-hidden" style={{ height: 420 }}>
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="bg-[#1A1A1A] text-[#A0784A] font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-1">
                  3D · крутите мышью
                </span>
              </div>

              {/* Lighting toggle */}
              <div className="absolute top-4 right-4 z-10 flex gap-1">
                <button
                  onClick={() => setWarm(false)}
                  className={`p-2 transition ${!warm ? 'bg-white text-[#1A1A1A]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="Дневной свет"
                >
                  <Icon name="Sun" size={14} />
                </button>
                <button
                  onClick={() => setWarm(true)}
                  className={`p-2 transition ${warm ? 'bg-white text-[#1A1A1A]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="Тёплый свет"
                >
                  <Icon name="Lamp" size={14} />
                </button>
                <button
                  onClick={exportImage}
                  disabled={exporting}
                  className="p-2 transition bg-[#A0784A] text-white hover:bg-[#8B4513] disabled:opacity-50"
                  title="Скачать визуализацию"
                >
                  <Icon name={exporting ? 'Loader' : 'Download'} size={14} className={exporting ? 'animate-spin' : ''} />
                </button>
              </div>

              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Icon name="Loader" size={28} className="text-[#A0784A] animate-spin" />
                    <span className="font-montserrat text-[10px] uppercase tracking-widest text-white/50">
                      Загрузка 3D-сцены
                    </span>
                  </div>
                }
              >
                <Scene3D config={config} warm={warm} onReady={(fn) => (captureRef.current = fn)} />
              </Suspense>

              <div className="absolute bottom-4 left-4 text-white/50 font-montserrat text-[10px] uppercase tracking-wider pointer-events-none">
                {labelOf(MATERIALS, config.material)} · {labelOf(SIZES, config.size)} см
              </div>
            </div>

            {/* Photo gallery */}
            <div className="bg-[#242424] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-montserrat font-700 text-white/70 text-[10px] uppercase tracking-widest">
                  Фото готовых изделий
                </span>
                <div className="flex gap-1">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIdx(i)}
                      className={`transition-all duration-300 ${i === galleryIdx ? 'w-6 h-1.5 bg-[#A0784A]' : 'w-1.5 h-1.5 bg-white/20'}`}
                      aria-label={`Фото ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setGalleryIdx(i)}
                    className={`relative overflow-hidden aspect-[4/3] ${i === galleryIdx ? 'ring-2 ring-[#A0784A]' : 'opacity-70 hover:opacity-100'} transition`}
                  >
                    <img src={src} alt={`Вариант ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#242424] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-montserrat font-700 text-white text-sm uppercase tracking-widest">
                  Итог конфигурации
                </span>
                <button
                  onClick={reset}
                  className="font-montserrat text-[10px] uppercase tracking-widest text-[#888] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Icon name="RotateCcw" size={12} />
                  Сбросить
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  { label: 'Предмет', val: FURNITURE_TYPES.find((f) => f.id === config.furniture)?.label ?? '' },
                  { label: 'Материал', val: `${labelOf(MATERIALS, config.material)}, ${labelOf(SIZES, config.size)} см, ${labelOf(THICKNESS, config.thickness)}` },
                  { label: config.furniture === 'shelf' ? 'Каркас' : 'Ножки', val: `${labelOf(LEGS_STYLE, config.legsStyle)}, ${labelOf(LEGS_HEIGHT, config.legsHeight)}` },
                  { label: 'Фурнитура', val: labelOf(HARDWARE, config.hardware) },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4">
                    <span className="font-opensans text-[#888] text-xs">{row.label}</span>
                    <span className="font-opensans text-[#ccc] text-xs text-right">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-4 border-t border-[#333] mb-6">
                <span className="font-montserrat font-700 text-white text-sm uppercase tracking-wider">Стоимость</span>
                <span className="font-montserrat font-900 text-2xl text-[#D2B48C]">{price.toLocaleString('ru')} ₽</span>
              </div>

              {submitted ? (
                <div className="bg-[#2A3A2A] border border-[#4A6A4A] p-4 text-center">
                  <Icon name="CheckCircle" size={24} className="text-green-400 mx-auto mb-2" />
                  <p className="font-montserrat font-700 text-white text-sm">Заявка отправлена!</p>
                  <p className="font-opensans text-[#888] text-xs mt-1">Мы свяжемся с вами в течение 30 минут</p>
                </div>
              ) : showForm ? (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <input
                    value={lead.name}
                    onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))}
                    placeholder="Ваше имя"
                    className="bg-white/5 border border-[#333] text-white px-4 py-3 font-opensans text-sm focus:outline-none focus:border-[#A0784A] transition placeholder:text-white/30"
                  />
                  <input
                    value={lead.phone}
                    onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))}
                    placeholder="Телефон"
                    type="tel"
                    className="bg-white/5 border border-[#333] text-white px-4 py-3 font-opensans text-sm focus:outline-none focus:border-[#A0784A] transition placeholder:text-white/30"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={submitLead}
                      disabled={!lead.name.trim() || !lead.phone.trim() || sending}
                      className="flex-1 bg-[#A0784A] hover:bg-[#8B4513] disabled:opacity-40 disabled:cursor-not-allowed text-white font-montserrat font-700 uppercase tracking-widest text-xs py-4 transition flex items-center justify-center gap-2"
                    >
                      {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                      {sending ? 'Отправка...' : 'Отправить'}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-4 bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center"
                      aria-label="Отмена"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                  <p className="font-opensans text-white/30 text-[11px] text-center">
                    Конфигурация и цена будут приложены к заявке автоматически
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex-1 bg-[#A0784A] hover:bg-[#8B4513] text-white font-montserrat font-700 uppercase tracking-widest text-xs py-4 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Icon name="Send" size={14} />
                    Отправить на расчёт
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-montserrat font-700 uppercase tracking-widest text-xs py-4 transition-colors duration-200 flex items-center justify-center gap-2">
                    <Icon name="Bookmark" size={14} />
                    Сохранить
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sketch → 3D helper */}
        <div className="mt-8">
          <SketchTool onApply={applyFromSketch} />
        </div>
        </>
        )}
      </div>
    </section>
  );
}