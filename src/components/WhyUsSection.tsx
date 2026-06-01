import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

const reasons = [
  {
    icon: 'Leaf',
    title: 'Экоматериалы',
    desc: 'Сертифицированная древесина из устойчивых лесов FSC. Покрытия без формальдегида.',
    num: '01',
  },
  {
    icon: 'ShieldCheck',
    title: 'Гарантия 5 лет',
    desc: 'Конструктивная гарантия на каждое изделие. Бесплатный ремонт при производственном дефекте.',
    num: '02',
  },
  {
    icon: 'Truck',
    title: 'Доставка по РФ',
    desc: 'Доставляем во все регионы России. Подъём, сборка и установка включены в стоимость.',
    num: '03',
  },
  {
    icon: 'SlidersHorizontal',
    title: 'Под ваш размер',
    desc: 'Производим мебель точно под ваш интерьер: любые нестандартные размеры и конфигурации.',
    num: '04',
  },
];

export default function WhyUsSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = ref.current?.querySelectorAll('[data-card]');
            cards?.forEach((card, i) => {
              setTimeout(() => {
                (card as HTMLElement).style.opacity = '1';
                (card as HTMLElement).style.transform = 'translateY(0)';
              }, i * 120);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div>
            <span className="section-label">Наши преимущества</span>
            <h2 className="section-title text-4xl lg:text-5xl mt-3">
              Почему выбирают
              <br />
              <em className="font-cormorant not-italic text-[#8B4513]">ARTORA</em>
            </h2>
          </div>
          <p className="font-opensans text-[#888] max-w-sm text-sm leading-relaxed">
            Мы производим мебель с 2009 года. За это время реализовали более 2 400 проектов
            по всей России — от студий до загородных домов.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#E8E0D4]">
          {reasons.map((r) => (
            <div
              key={r.num}
              data-card
              className="p-8 border-r border-b border-[#E8E0D4] last:border-r-0 group hover:bg-[#1A1A1A] transition-all duration-400 cursor-default"
              style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease, background 0.4s ease' }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 flex items-center justify-center border border-[#E8E0D4] group-hover:border-[#A0784A] transition-colors duration-400">
                  <Icon name={r.icon} fallback="Circle" size={22} className="text-[#A0784A]" />
                </div>
                <span className="font-montserrat font-900 text-3xl text-[#F0E8DC] group-hover:text-[#333] transition-colors duration-400">
                  {r.num}
                </span>
              </div>
              <h3 className="font-montserrat font-700 text-[#1A1A1A] group-hover:text-white text-base mb-2 uppercase tracking-wide transition-colors duration-400">
                {r.title}
              </h3>
              <p className="font-opensans text-[#888] group-hover:text-[#ccc] text-sm leading-relaxed transition-colors duration-400">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}