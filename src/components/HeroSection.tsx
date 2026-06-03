import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = heroRef.current?.querySelectorAll('[data-animate]');
    if (!items) return;
    items.forEach((el, i) => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(28px)';
      setTimeout(() => {
        (el as HTMLElement).style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'translateY(0)';
      }, 100 + i * 130);
    });
  }, []);

  const scrollToRoomAI = () => {
    document.querySelector('#room-ai')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCatalog = () => {
    document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center bg-[#FAFAF8] overflow-hidden"
    >
      {/* Geometric accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F3EDE4] clip-right hidden lg:block" />
      <div
        className="absolute top-0 right-0 w-[55%] h-full hidden lg:block"
        style={{ clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)' }}
      >
        <div className="absolute inset-0 bg-[#F0E8DC]" />
      </div>

      {/* Large background letter */}
      <div className="absolute top-1/2 -translate-y-1/2 left-[-2rem] font-montserrat font-900 text-[22vw] text-[#1A1A1A] opacity-[0.03] select-none pointer-events-none leading-none">
        A
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <div data-animate className="flex items-center gap-3">
              <div className="w-8 h-[2px] bg-[#A0784A]" />
              <span className="section-label">Интернет-магазин мебели · Artora-ai.ru</span>
            </div>

            <h1
              data-animate
              className="font-montserrat font-900 text-[#1A1A1A] leading-[0.95] text-balance"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}
            >
              Мебель,
              <br />
              <em className="font-cormorant not-italic" style={{ color: '#8B4513' }}>
                которую видно
              </em>
              <br />
              в 3D и в вашей комнате
            </h1>

            <p
              data-animate
              className="font-opensans text-[#666] text-base lg:text-lg leading-relaxed max-w-md"
            >
              Крутите товар в 3D, примеряйте к интерьеру и заказывайте онлайн.
              ИИ-продавец Артур подберёт мебель под ваш запрос и бюджет.
            </p>

            <div data-animate className="flex flex-col sm:flex-row gap-4 mt-2">
              <button onClick={scrollToCatalog} className="artora-btn-primary flex items-center justify-center gap-3">
                <Icon name="Grid3x3" size={16} />
                Открыть каталог
              </button>
              <button onClick={scrollToRoomAI} className="artora-btn-outline flex items-center justify-center gap-3">
                <Icon name="Sparkles" size={16} />
                Подбор по фото
              </button>
            </div>

            {/* Stats */}
            <div data-animate className="flex gap-8 pt-6 border-t border-[#E8E0D4]">
              {[
                { num: '2 400+', label: 'реализованных проектов' },
                { num: '5 лет', label: 'гарантия на изделия' },
                { num: '14 дней', label: 'средний срок изготовления' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="font-montserrat font-900 text-2xl text-[#1A1A1A]">{s.num}</span>
                  <span className="font-opensans text-xs text-[#999] mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Hero image */}
          <div data-animate className="relative hidden lg:block">
            <div className="relative">
              <img
                src="https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/385d599c-9784-4c7d-910a-e11d258dc978.jpg"
                alt="Дизайнерский стол Artora-ai"
                className="w-full h-[520px] object-cover"
                loading="eager"
              />
              {/* Floating tag */}
              <div className="absolute -bottom-6 -left-8 bg-[#1A1A1A] text-white p-5 shadow-2xl">
                <div className="font-montserrat font-900 text-2xl text-white">от 28 900 ₽</div>
                <div className="font-opensans text-xs text-[#A0784A] mt-1 uppercase tracking-widest">Обеденный стол «Дуб»</div>
              </div>
              {/* Vertical label */}
              <div className="absolute top-8 -right-4 flex flex-col items-center gap-2">
                <div className="w-[1px] h-16 bg-[#A0784A]" />
                <span
                  className="font-montserrat font-700 text-xs tracking-[0.3em] text-[#A0784A] uppercase"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  Premium
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <span className="font-montserrat text-[10px] uppercase tracking-[0.3em] text-[#999]">Scroll</span>
        <div className="w-[1px] h-8 bg-[#999] relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full bg-[#1A1A1A]"
            style={{
              height: '50%',
              animation: 'scrollLine 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </section>
  );
}