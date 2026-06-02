import { useRef, useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** базовая амплитуда авто-поворота в градусах */
  amplitude?: number;
  /** показывать подпись «3D» */
  badge?: boolean;
};

/**
 * «Оживляет» фото товара: реальное изображение на 3D-плоскости,
 * с плавным авто-покачиванием, параллакс-наклоном по курсору/тачу,
 * динамическим бликом и мягкой контактной тенью.
 */
export default function PhotoTilt3D({
  src,
  alt,
  className = '',
  amplitude = 14,
  badge = true,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  // целевые и текущие углы
  const target = useRef({ rx: 0, ry: 0, scale: 1 });
  const current = useRef({ rx: 0, ry: 0, scale: 1 });
  const hovering = useRef(false);
  const startTs = useRef(performance.now());
  const [glare, setGlare] = useState({ x: 50, y: 0, o: 0 });

  const apply = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    // авто-покачивание, когда нет взаимодействия
    if (!hovering.current) {
      const t = (performance.now() - startTs.current) / 1000;
      target.current.ry = Math.sin(t * 0.6) * amplitude;
      target.current.rx = Math.sin(t * 0.45) * (amplitude * 0.35);
      target.current.scale = 1;
    }

    // плавная интерполяция
    const c = current.current;
    const tg = target.current;
    c.rx += (tg.rx - c.rx) * 0.08;
    c.ry += (tg.ry - c.ry) * 0.08;
    c.scale += (tg.scale - c.scale) * 0.1;

    const plate = el.querySelector('[data-plate]') as HTMLElement | null;
    const shadow = el.querySelector('[data-shadow]') as HTMLElement | null;
    if (plate) {
      plate.style.transform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.scale})`;
    }
    if (shadow) {
      const off = c.ry * 1.4;
      shadow.style.transform = `translateX(${off}px) scale(${1 - Math.abs(c.ry) / 120})`;
      shadow.style.opacity = `${0.4 - Math.abs(c.ry) / 120}`;
    }

    setGlare({
      x: 50 + c.ry * 2.4,
      y: 30 - c.rx * 2.4,
      o: Math.min(0.5, (Math.abs(c.ry) + Math.abs(c.rx)) / 40),
    });

    rafRef.current = requestAnimationFrame(apply);
  }, [amplitude]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(rafRef.current);
  }, [apply]);

  const move = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (clientX - r.left) / r.width - 0.5;
    const py = (clientY - r.top) / r.height - 0.5;
    target.current.ry = px * 38;
    target.current.rx = -py * 26;
    target.current.scale = 1.06;
  };

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden bg-gradient-to-b from-[#f3ede4] to-[#e6ddcf] ${className}`}
      style={{ perspective: '1100px' }}
      onMouseEnter={() => { hovering.current = true; }}
      onMouseMove={(e) => move(e.clientX, e.clientY)}
      onMouseLeave={() => {
        hovering.current = false;
        startTs.current = performance.now();
        target.current.scale = 1;
      }}
      onTouchStart={() => { hovering.current = true; }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) move(t.clientX, t.clientY);
      }}
      onTouchEnd={() => {
        hovering.current = false;
        startTs.current = performance.now();
        target.current.scale = 1;
      }}
    >
      {/* мягкая контактная тень */}
      <div
        data-shadow
        className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-[64%] h-[10%] rounded-[50%] bg-black blur-xl"
        style={{ opacity: 0.35 }}
      />

      {/* 3D-плашка с фото */}
      <div
        data-plate
        className="absolute inset-0 m-auto will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'none',
        }}
      >
        <div className="absolute inset-[8%] rounded-lg overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            draggable={false}
            className="w-full h-full object-cover select-none"
          />
          {/* динамический блик */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-soft-light"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.9), rgba(255,255,255,0) 55%)`,
              opacity: glare.o,
            }}
          />
          {/* лёгкая виньетка для объёма */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.18)' }}
          />
        </div>
      </div>

      {badge && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
          <Icon name="Rotate3d" size={13} className="text-white" />
          <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">3D · оживает</span>
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2 py-1 pointer-events-none">
        <Icon name="MousePointer2" size={11} className="text-[#1A1A1A]" />
        <span className="font-montserrat font-700 text-[8px] uppercase tracking-widest text-[#1A1A1A]">наведите</span>
      </div>
    </div>
  );
}
