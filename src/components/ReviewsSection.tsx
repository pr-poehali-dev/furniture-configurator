import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

const reviews = [
  {
    name: 'Анна Л., Москва',
    role: 'Обеденный стол из дуба',
    text: 'Собрала стол в конструкторе за вечер, через 2 недели уже стоял на кухне. Качество массива превзошло ожидания — каждый стык идеальный.',
    photo: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/04b13891-fde9-44e3-aa41-e590a06051b1.jpg',
    rating: 5,
  },
  {
    name: 'Дмитрий К., СПб',
    role: 'Стеллаж из ореха',
    text: 'Хотел нестандартный размер под нишу — сделали точно по миллиметрам. Примерка на фото комнаты реально помогла не ошибиться.',
    photo: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/65cb63ea-2cc6-4d3f-bffd-57f1217bac31.jpg',
    rating: 5,
  },
  {
    name: 'Елена М., Казань',
    role: 'Прикроватная тумба',
    text: 'Белый лак выглядит дорого и стильно. Доставили, собрали, увезли упаковку. Сервис на высоте, рекомендую!',
    photo: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/c8f1a9e3-7290-4c34-925a-0b805db1a820.jpg',
    rating: 5,
  },
];

const stats = [
  { value: 2400, suffix: '+', label: 'проектов реализовано' },
  { value: 98, suffix: '%', label: 'клиентов рекомендуют' },
  { value: 15, suffix: ' лет', label: 'на рынке мебели' },
  { value: 14, suffix: ' дней', label: 'средний срок заказа' },
];

function Counter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setVal(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return (
    <span className="font-montserrat font-900 text-4xl lg:text-5xl text-[#D2B48C]">
      {val.toLocaleString('ru')}{suffix}
    </span>
  );
}

export default function ReviewsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="reviews" ref={ref} className="py-24 lg:py-32 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <span className="section-label text-[#A0784A]">Отзывы клиентов</span>
          <h2 className="font-montserrat font-900 text-white text-4xl lg:text-5xl mt-3 leading-tight">
            Нам доверяют свои интерьеры
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#333] mb-16 border border-[#333]">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#1A1A1A] p-8 text-center">
              <Counter target={s.value} suffix={s.suffix} active={active} />
              <p className="font-opensans text-white/50 text-xs mt-2 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="bg-[#242424] flex flex-col overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={r.photo}
                  alt={`Проект клиента — ${r.role}`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Icon key={i} name="Star" size={14} className="text-[#D2B48C] fill-[#D2B48C]" />
                  ))}
                </div>
                <p className="font-opensans text-white/70 text-sm leading-relaxed flex-1">«{r.text}»</p>
                <div className="mt-4 pt-4 border-t border-[#333]">
                  <p className="font-montserrat font-700 text-white text-sm">{r.name}</p>
                  <p className="font-opensans text-[#A0784A] text-xs mt-0.5">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}