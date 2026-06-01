import Icon from '@/components/ui/icon';
import { Config, FURNITURE_TYPES } from './types';

export default function ConstructorHeader({
  tab,
  setTab,
  config,
  onFurniture,
}: {
  tab: 'build' | 'tryon';
  setTab: (t: 'build' | 'tryon') => void;
  config: Config;
  onFurniture: (id: string) => void;
}) {
  return (
    <>
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

      {tab === 'build' && (
        /* Furniture type switch */
        <div className="flex flex-wrap gap-2 mb-8">
          {FURNITURE_TYPES.map((f) => (
            <button
              key={f.id}
              onClick={() => onFurniture(f.id)}
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
      )}
    </>
  );
}
