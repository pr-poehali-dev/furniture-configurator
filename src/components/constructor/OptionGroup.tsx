import { Option } from './types';

export default function OptionGroup({
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
