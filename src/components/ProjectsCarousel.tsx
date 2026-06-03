import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

const projects = [
  {
    id: 1,
    title: 'Обеденный стол «Дуб»',
    price: 'от 28 900 ₽',
    tag: 'Скандинавский',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg',
  },
  {
    id: 2,
    title: 'Кофейный столик «Орех»',
    price: 'от 18 500 ₽',
    tag: 'Лофт',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/86871e1d-0fab-4391-9443-4bb449e9ce29.jpg',
  },
  {
    id: 3,
    title: 'Письменный стол «Белый лак»',
    price: 'от 22 400 ₽',
    tag: 'Минимализм',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/fdaec9ec-80db-497f-b1c0-da50c53baa5e.jpg',
  },
  {
    id: 4,
    title: 'Стеллаж «Тёмный орех»',
    price: 'от 34 200 ₽',
    tag: 'Лофт',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/35cdd135-0b5f-4b71-9fd8-d7cfe7f31e87.jpg',
  },
  {
    id: 5,
    title: 'Диван «Осло»',
    price: 'от 64 900 ₽',
    tag: 'Скандинавский',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/4b29095e-bf24-4d0f-86af-59497df8adc2.jpg',
  },
  {
    id: 6,
    title: 'Шкаф-купе «Модерн»',
    price: 'от 54 200 ₽',
    tag: 'Минимализм',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/57fce72f-e06d-49a9-bc63-b3491789da26.jpg',
  },
  {
    id: 7,
    title: 'Кухня «Альпина»',
    price: 'от 128 000 ₽',
    tag: 'Классика',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/b2ca5be4-9537-47bb-a101-d1cc23821a30.jpg',
  },
  {
    id: 8,
    title: 'Кровать «Хюгге»',
    price: 'от 48 900 ₽',
    tag: 'Лофт',
    img: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/165ae52f-be20-4ba5-a8b0-2e4a02d80084.jpg',
  },
];

export default function ProjectsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const prev = () => goTo((current - 1 + projects.length) % projects.length);
  const next = () => goTo((current + 1) % projects.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current]);

  const visible = [
    projects[current],
    projects[(current + 1) % projects.length],
    projects[(current + 2) % projects.length],
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="section-label">Реализованные проекты</span>
            <h2 className="section-title text-4xl lg:text-5xl mt-3">
              Готовые работы
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="w-12 h-12 border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all duration-200 group"
              aria-label="Предыдущий"
            >
              <Icon name="ArrowLeft" size={18} />
            </button>
            <button
              onClick={next}
              className="w-12 h-12 border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all duration-200 group"
              aria-label="Следующий"
            >
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="group overflow-hidden cursor-pointer hover-lift"
              style={{
                opacity: isAnimating ? 0.7 : 1,
                transition: 'opacity 0.4s ease',
              }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-64 lg:h-80 object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white font-montserrat font-700 text-[10px] uppercase tracking-widest px-3 py-1 text-[#1A1A1A]">
                    {p.tag}
                  </span>
                </div>
                <div className="absolute inset-0 bg-[#1A1A1A] opacity-0 group-hover:opacity-20 transition-opacity duration-400" />
              </div>
              <div className="bg-white p-5 border border-t-0 border-[#E8E0D4] flex items-center justify-between">
                <div>
                  <h3 className="font-montserrat font-700 text-[#1A1A1A] text-sm">{p.title}</h3>
                  <p className="font-opensans text-[#A0784A] font-600 text-sm mt-0.5">{p.price}</p>
                </div>
                <button
                  onClick={() => document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-9 h-9 flex items-center justify-center bg-[#1A1A1A] text-white hover:bg-[#8B4513] transition-colors duration-200"
                  aria-label="Смотреть в каталоге"
                >
                  <Icon name="ArrowRight" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 ${
                i === current ? 'w-8 h-2 bg-[#1A1A1A]' : 'w-2 h-2 bg-[#D2B48C]'
              }`}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}