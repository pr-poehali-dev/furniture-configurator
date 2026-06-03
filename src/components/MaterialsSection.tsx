import { useState } from 'react';

const materials = [
  {
    id: 'oak',
    name: 'Массив дуба',
    tag: 'Популярный выбор',
    color: '#C8A870',
    texture: 'linear-gradient(135deg, #C8A870 0%, #A07040 40%, #C8A870 70%, #8B6030 100%)',
    life: '50+ лет',
    props: ['Твёрдость: 8/10', 'Влагостойкость: 7/10', 'Экологичность: FSC'],
    care: 'Протирать сухой тканью. Раз в год обрабатывать маслом для дерева.',
    desc: 'Европейский дуб — эталон прочности и долговечности. Яркая текстура с характерными сердцевинными лучами. Со временем приобретает благородную патину.',
  },
  {
    id: 'walnut',
    name: 'Орех американский',
    tag: 'Премиум',
    color: '#6B3A2A',
    texture: 'linear-gradient(135deg, #8B5A3A 0%, #5A3020 40%, #7A4A2A 70%, #4A2818 100%)',
    life: '40+ лет',
    props: ['Твёрдость: 9/10', 'Влагостойкость: 6/10', 'Экологичность: FSC'],
    care: 'Протирать слегка влажной тканью. Избегать прямого солнечного света.',
    desc: 'Один из самых ценных пород для мебели. Тёмно-шоколадный цвет с выраженной текстурой. Идеален для интерьеров в стиле лофт и современной классики.',
  },
  {
    id: 'white',
    name: 'Белый лак MDF',
    tag: 'Доступный',
    color: '#F0EBE0',
    texture: 'linear-gradient(135deg, #FAFAF5 0%, #E8E3D8 50%, #FAFAF5 100%)',
    life: '15+ лет',
    props: ['Твёрдость: 6/10', 'Влагостойкость: 8/10', 'Без эмиссии E1'],
    care: 'Протирать влажной тканью. Избегать абразивных средств и царапин.',
    desc: 'Матовое белоснежное покрытие на основе MDF. Идеально для скандинавского и минималистичного стиля. Лёгкое в уходе, устойчивое к влаге.',
  },
  {
    id: 'metal',
    name: 'Металл (матовый)',
    tag: 'Лофт',
    color: '#888',
    texture: 'linear-gradient(135deg, #999 0%, #666 40%, #aaa 70%, #777 100%)',
    life: '30+ лет',
    props: ['Твёрдость: 10/10', 'Влагостойкость: 9/10', 'Порошковое покрытие'],
    care: 'Протирать сухой или слегка влажной тканью. Металлической губкой не чистить.',
    desc: 'Конструкционная сталь с порошковым покрытием. Абсолютная прочность и индустриальный характер. Используется для ножек и каркасов.',
  },
];

export default function MaterialsSection() {
  const [active, setActive] = useState(materials[0].id);
  const mat = materials.find((m) => m.id === active)!;

  return (
    <section id="materials" className="py-24 lg:py-32 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <span className="section-label">Из чего делаем</span>
          <h2 className="section-title text-4xl lg:text-5xl mt-3">Материалы</h2>
        </div>

        <div className="grid lg:grid-cols-[300px,1fr] gap-0 border border-[#E8E0D4]">
          {/* Tabs */}
          <div className="border-r border-[#E8E0D4]">
            {materials.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`w-full text-left p-6 border-b border-[#E8E0D4] last:border-b-0 transition-all duration-200 group ${
                  active === m.id ? 'bg-[#1A1A1A]' : 'bg-white hover:bg-[#FAFAF8]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 flex-shrink-0"
                    style={{ background: m.texture }}
                  />
                  <div>
                    <div
                      className={`font-montserrat font-700 text-sm uppercase tracking-wide transition-colors ${
                        active === m.id ? 'text-white' : 'text-[#1A1A1A]'
                      }`}
                    >
                      {m.name}
                    </div>
                    <div
                      className={`font-montserrat text-[10px] uppercase tracking-widest mt-0.5 transition-colors ${
                        active === m.id ? 'text-[#A0784A]' : 'text-[#999]'
                      }`}
                    >
                      {m.tag}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="bg-white p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Texture swatch */}
              <div className="flex-shrink-0">
                <div
                  className="w-full lg:w-48 h-48"
                  style={{ background: mat.texture }}
                />
                <div className="mt-3">
                  <span className="font-montserrat text-[10px] uppercase tracking-widest text-[#999]">
                    Срок службы
                  </span>
                  <div className="font-montserrat font-900 text-2xl text-[#1A1A1A] mt-1">{mat.life}</div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-montserrat font-800 text-2xl text-[#1A1A1A] mb-4">{mat.name}</h3>
                <p className="font-opensans text-[#666] text-sm leading-relaxed mb-6">{mat.desc}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {mat.props.map((prop) => {
                    const [label, value] = prop.split(': ');
                    return (
                      <div key={prop} className="bg-[#FAFAF8] p-4 border border-[#E8E0D4]">
                        <div className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-1">{label}</div>
                        <div className="font-montserrat font-700 text-sm text-[#1A1A1A]">{value}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-[#E8E0D4] pt-5">
                  <p className="font-montserrat font-700 text-[11px] uppercase tracking-widest text-[#A0784A] mb-2">
                    Уход
                  </p>
                  <p className="font-opensans text-[#666] text-sm">{mat.care}</p>
                </div>

                <button
                  onClick={() => document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-6 artora-btn-primary inline-flex items-center gap-2"
                >
                  Смотреть в каталоге
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}