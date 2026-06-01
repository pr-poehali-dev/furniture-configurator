import { lazy, Suspense } from 'react';
import Icon from '@/components/ui/icon';
import {
  Config,
  MATERIALS,
  SIZES,
  THICKNESS,
  LEGS_STYLE,
  LEGS_HEIGHT,
  HARDWARE,
  FURNITURE_TYPES,
  GALLERY,
  Option,
} from './types';

const Scene3D = lazy(() => import('./Scene3D'));

export default function ConstructorViewer({
  config,
  warm,
  setWarm,
  exporting,
  exportImage,
  captureRef,
  galleryIdx,
  setGalleryIdx,
  price,
  reset,
  submitted,
  showForm,
  setShowForm,
  lead,
  setLead,
  sending,
  submitLead,
}: {
  config: Config;
  warm: boolean;
  setWarm: (w: boolean) => void;
  exporting: boolean;
  exportImage: () => void;
  captureRef: React.MutableRefObject<(() => string) | null>;
  galleryIdx: number;
  setGalleryIdx: (i: number) => void;
  price: number;
  reset: () => void;
  submitted: boolean;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  lead: { name: string; phone: string };
  setLead: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  sending: boolean;
  submitLead: () => void;
}) {
  const labelOf = (arr: Option[], id: string) => arr.find((o) => o.id === id)?.label ?? '';
  const gallery = GALLERY[config.furniture];

  return (
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
  );
}
