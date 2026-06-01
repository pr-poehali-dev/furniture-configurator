import { Config, MATERIALS, SIZES, THICKNESS, LEGS_STYLE, LEGS_HEIGHT, HARDWARE } from './types';
import OptionGroup from './OptionGroup';

export default function ConfigPanel({
  config,
  set,
}: {
  config: Config;
  set: (key: keyof Config) => (val: string) => void;
}) {
  return (
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
  );
}
