import { useState } from 'react';
import Icon from '@/components/ui/icon';

const TABLETOP_OPTIONS = [
  { id: 'oak', label: 'Дуб', price: 0, color: '#C8A870' },
  { id: 'walnut', label: 'Орех', price: 3000, color: '#6B3A2A' },
  { id: 'white', label: 'Белый лак', price: 1500, color: '#F5F0E8' },
];

const SIZE_OPTIONS = [
  { id: 's', label: '80×60', sub: 'компакт', price: 0 },
  { id: 'm', label: '120×75', sub: 'стандарт', price: 4000 },
  { id: 'l', label: '160×90', sub: 'большой', price: 8000 },
];

const THICKNESS_OPTIONS = [
  { id: 't2', label: '2 см', price: 0 },
  { id: 't3', label: '3 см', price: 2500 },
];

const LEGS_STYLE = [
  { id: 'classic', label: 'Классические', price: 0, icon: '▮' },
  { id: 'cone', label: 'Конические', price: 1800, icon: '▼' },
  { id: 'metal', label: 'Металлические', price: 3200, icon: '⬡' },
];

const LEGS_HEIGHT = [
  { id: 'h70', label: '70 см', price: 0 },
  { id: 'h75', label: '75 см', price: 0 },
  { id: 'h80', label: '80 см', price: 500 },
];

const HARDWARE = [
  { id: 'none', label: 'Без ручек', price: 0 },
  { id: 'h1', label: 'Латунь', price: 2200 },
  { id: 'h2', label: 'Матовое железо', price: 1800 },
  { id: 'h3', label: 'Дерево', price: 1200 },
];

const BASE_PRICE = 18900;

type Config = {
  tabletop: string;
  size: string;
  thickness: string;
  legsStyle: string;
  legsHeight: string;
  hardware: string;
};

const DEFAULT_CONFIG: Config = {
  tabletop: 'oak',
  size: 's',
  thickness: 't2',
  legsStyle: 'classic',
  legsHeight: 'h70',
  hardware: 'none',
};

function calcPrice(config: Config): number {
  const tp = TABLETOP_OPTIONS.find((o) => o.id === config.tabletop)?.price ?? 0;
  const sz = SIZE_OPTIONS.find((o) => o.id === config.size)?.price ?? 0;
  const th = THICKNESS_OPTIONS.find((o) => o.id === config.thickness)?.price ?? 0;
  const ls = LEGS_STYLE.find((o) => o.id === config.legsStyle)?.price ?? 0;
  const lh = LEGS_HEIGHT.find((o) => o.id === config.legsHeight)?.price ?? 0;
  const hw = HARDWARE.find((o) => o.id === config.hardware)?.price ?? 0;
  return BASE_PRICE + tp + sz + th + ls + lh + hw;
}

function OptionGroup<T extends { id: string; label: string; price: number }>({
  title,
  options,
  value,
  onChange,
  extra,
}: {
  title: string;
  options: T[];
  value: string;
  onChange: (id: string) => void;
  extra?: (o: T) => React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="font-montserrat font-700 text-[11px] uppercase tracking-widest text-[#999] mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`option-card ${value === o.id ? 'selected' : ''}`}
          >
            {extra?.(o)}
            <div className="font-montserrat font-700 text-xs">{o.label}</div>
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
  const [rotation, setRotation] = useState(0);

  const price = calcPrice(config);
  const selectedTabletop = TABLETOP_OPTIONS.find((o) => o.id === config.tabletop)!;
  const selectedSize = SIZE_OPTIONS.find((o) => o.id === config.size)!;
  const selectedLegs = LEGS_STYLE.find((o) => o.id === config.legsStyle)!;

  const set = (key: keyof Config) => (val: string) =>
    setConfig((prev) => ({ ...prev, [key]: val }));

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    setSubmitted(false);
  };

  const handleSubmit = () => setSubmitted(true);

  return (
    <section id="constructor" className="py-24 lg:py-32 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <span className="section-label text-[#A0784A]">Интерактивный конструктор</span>
          <h2 className="font-montserrat font-900 text-white text-4xl lg:text-5xl mt-3 leading-tight">
            Собери свою мебель
          </h2>
        </div>

        <div className="grid lg:grid-cols-[380px,1fr] gap-8 items-start">
          {/* LEFT — Options panel */}
          <div className="bg-[#242424] p-6 lg:p-8">
            <div className="mb-4 pb-4 border-b border-[#333]">
              <p className="font-montserrat font-700 text-white text-sm uppercase tracking-widest mb-1">
                Столешница
              </p>
            </div>

            <OptionGroup
              title="Материал"
              options={TABLETOP_OPTIONS}
              value={config.tabletop}
              onChange={set('tabletop')}
              extra={(o) => (
                <div
                  className="w-6 h-6 mx-auto mb-2 border border-[#555]"
                  style={{ backgroundColor: o.color }}
                />
              )}
            />
            <OptionGroup title="Размер (см)" options={SIZE_OPTIONS} value={config.size} onChange={set('size')} />
            <OptionGroup title="Толщина" options={THICKNESS_OPTIONS} value={config.thickness} onChange={set('thickness')} />

            <div className="mb-4 pb-4 border-b border-[#333] mt-6">
              <p className="font-montserrat font-700 text-white text-sm uppercase tracking-widest mb-1">
                Ножки
              </p>
            </div>

            <OptionGroup title="Стиль" options={LEGS_STYLE} value={config.legsStyle} onChange={set('legsStyle')} />
            <OptionGroup title="Высота" options={LEGS_HEIGHT} value={config.legsHeight} onChange={set('legsHeight')} />

            <div className="mb-4 pb-4 border-b border-[#333] mt-6">
              <p className="font-montserrat font-700 text-white text-sm uppercase tracking-widest mb-1">
                Фурнитура
              </p>
            </div>
            <OptionGroup title="Ручки" options={HARDWARE} value={config.hardware} onChange={set('hardware')} />
          </div>

          {/* RIGHT — Visualizer + Summary */}
          <div className="flex flex-col gap-6">
            {/* 3D Visualizer */}
            <div className="bg-[#242424] relative overflow-hidden" style={{ minHeight: 340 }}>
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-[#1A1A1A] text-[#A0784A] font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-1">
                  Визуализация
                </span>
              </div>

              {/* Lighting toggle */}
              <div className="absolute top-4 right-4 z-10 flex gap-1">
                <button className="bg-white/10 hover:bg-white/20 transition p-2" title="Дневной свет">
                  <Icon name="Sun" size={14} className="text-white" />
                </button>
                <button className="bg-white/10 hover:bg-white/20 transition p-2" title="Тёплый свет">
                  <Icon name="Lamp" size={14} className="text-white" />
                </button>
              </div>

              {/* Rotate control */}
              <div className="absolute bottom-4 right-4 z-10 flex gap-1">
                <button
                  onClick={() => setRotation((r) => r - 45)}
                  className="bg-white/10 hover:bg-white/20 transition p-2"
                  title="Повернуть влево"
                >
                  <Icon name="RotateCcw" size={14} className="text-white" />
                </button>
                <button
                  onClick={() => setRotation((r) => r + 45)}
                  className="bg-white/10 hover:bg-white/20 transition p-2"
                  title="Повернуть вправо"
                >
                  <Icon name="RotateCw" size={14} className="text-white" />
                </button>
              </div>

              {/* Table SVG visualization */}
              <div className="flex items-center justify-center h-full py-16" style={{ minHeight: 340 }}>
                <div
                  style={{
                    transform: `perspective(800px) rotateY(${rotation}deg)`,
                    transition: 'transform 0.6s ease',
                  }}
                >
                  {/* Isometric-style table */}
                  <svg
                    viewBox="0 0 320 220"
                    width="320"
                    height="220"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Shadow */}
                    <ellipse cx="160" cy="210" rx="100" ry="8" fill="rgba(0,0,0,0.3)" />

                    {/* Tabletop top face */}
                    <polygon
                      points="60,80 260,80 290,50 90,50"
                      fill={selectedTabletop.color}
                      stroke="#00000022"
                      strokeWidth="1"
                    />
                    {/* Tabletop front face */}
                    <polygon
                      points="60,80 260,80 260,96 60,96"
                      fill={selectedTabletop.color === '#F5F0E8' ? '#DDD8CC' : selectedTabletop.color === '#C8A870' ? '#A07040' : '#4A2418'}
                      stroke="#00000022"
                      strokeWidth="1"
                    />
                    {/* Tabletop right face */}
                    <polygon
                      points="260,80 290,50 290,66 260,96"
                      fill={selectedTabletop.color === '#F5F0E8' ? '#EAE5DA' : selectedTabletop.color === '#C8A870' ? '#B08850' : '#5A2E1E'}
                      stroke="#00000022"
                      strokeWidth="1"
                    />

                    {/* Legs */}
                    {[
                      { x1: 80, y1: 96, x2: selectedLegs.id === 'cone' ? 88 : 80, y2: 190 },
                      { x1: 240, y1: 96, x2: selectedLegs.id === 'cone' ? 232 : 240, y2: 190 },
                      { x1: 270, y1: 66, x2: selectedLegs.id === 'cone' ? 262 : 270, y2: 160 },
                      { x1: 110, y1: 66, x2: selectedLegs.id === 'cone' ? 118 : 110, y2: 160 },
                    ].map((leg, i) => (
                      <line
                        key={i}
                        x1={leg.x1}
                        y1={leg.y1}
                        x2={leg.x2}
                        y2={leg.y2}
                        stroke={selectedLegs.id === 'metal' ? '#888' : '#7A5035'}
                        strokeWidth={selectedLegs.id === 'cone' ? '10' : selectedLegs.id === 'metal' ? '5' : '8'}
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Dimensions overlay */}
              <div className="absolute bottom-4 left-4 text-white/60 font-montserrat text-[10px] uppercase tracking-wider">
                {selectedSize.label} см · толщина {config.thickness === 't2' ? '2' : '3'} см
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
                  { label: 'Столешница', val: `${selectedTabletop.label}, ${selectedSize.label} см, ${config.thickness === 't2' ? '2' : '3'} см` },
                  { label: 'Ножки', val: `${selectedLegs.label}, ${LEGS_HEIGHT.find((h) => h.id === config.legsHeight)?.label}` },
                  { label: 'Фурнитура', val: HARDWARE.find((h) => h.id === config.hardware)?.label ?? '' },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4">
                    <span className="font-opensans text-[#888] text-xs">{row.label}</span>
                    <span className="font-opensans text-[#ccc] text-xs text-right">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-4 border-t border-[#333] mb-6">
                <span className="font-montserrat font-700 text-white text-sm uppercase tracking-wider">Стоимость</span>
                <span className="font-montserrat font-900 text-2xl text-[#D2B48C]">
                  {price.toLocaleString('ru')} ₽
                </span>
              </div>

              {submitted ? (
                <div className="bg-[#2A3A2A] border border-[#4A6A4A] p-4 text-center">
                  <Icon name="CheckCircle" size={24} className="text-green-400 mx-auto mb-2" />
                  <p className="font-montserrat font-700 text-white text-sm">Заявка отправлена!</p>
                  <p className="font-opensans text-[#888] text-xs mt-1">Мы свяжемся с вами в течение 30 минут</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSubmit}
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
      </div>
    </section>
  );
}
