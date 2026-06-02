import { useRef, useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useCutout } from '@/hooks/useCutout';

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
 * «Оживляет» фото товара: предмет с удалённым фоном парит на чистом фоне
 * карточки, плавно покачивается, наклоняется по курсору/тачу (параллакс),
 * с динамической тенью под предметом.
 */
export default function PhotoTilt3D({
  src,
  alt,
  className = '',
  amplitude = 14,
  badge = true,
}: Props) {
  const { url, ready } = useCutout(src);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const target = useRef({ rx: 0, ry: 0, scale: 1 });
  const current = useRef({ rx: 0, ry: 0, scale: 1 });
  const hovering = useRef(false);
  const startTs = useRef(performance.now());

  const apply = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    if (!hovering.current) {
      const t = (performance.now() - startTs.current) / 1000;
      target.current.ry = Math.sin(t * 0.6) * amplitude;
      target.current.rx = Math.sin(t * 0.45) * (amplitude * 0.3);
      target.current.scale = 1;
    }

    const c = current.current;
    const tg = target.current;
    c.rx += (tg.rx - c.rx) * 0.08;
    c.ry += (tg.ry - c.ry) * 0.08;
    c.scale += (tg.scale - c.scale) * 0.1;

    const obj = el.querySelector('[data-obj]') as HTMLElement | null;
    const shadow = el.querySelector('[data-shadow]') as HTMLElement | null;
    if (obj) {
      const float = Math.sin((performance.now() - startTs.current) / 1000 * 1.1) * 6;
      obj.style.transform = `translateY(${float}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.scale})`;
    }
    if (shadow) {
      const off = c.ry * 1.6;
      shadow.style.transform = `translateX(calc(-50% + ${off}px)) scale(${1 - Math.abs(c.ry) / 110})`;
      shadow.style.opacity = `${0.4 - Math.abs(c.ry) / 130}`;
    }

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
    target.current.ry = px * 42;
    target.current.rx = -py * 28;
    target.current.scale = 1.08;
  };

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden bg-gradient-to-b from-[#f6f1e9] to-[#e7ddcd] ${className}`}
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
      {/* мягкий радиальный свет за предметом */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)' }} />

      {/* динамическая тень под предметом */}
      <div
        data-shadow
        className="absolute left-1/2 bottom-[10%] w-[55%] h-[7%] rounded-[50%] bg-black blur-xl"
        style={{ opacity: 0.35 }}
      />

      {/* парящий предмет (с удалённым фоном) */}
      <div
        data-obj
        className="absolute inset-[10%] m-auto will-change-transform"
        style={{ transformStyle: 'preserve-3d', transition: 'none' }}
      >
        <img
          src={url}
          alt={alt}
          loading="lazy"
          draggable={false}
          className="w-full h-full object-contain select-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.28)]"
        />
      </div>

      {!ready && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/80 backdrop-blur px-2.5 py-1 pointer-events-none">
          <Icon name="Loader" size={11} className="text-[#A0784A] animate-spin" />
          <span className="font-montserrat font-700 text-[8px] uppercase tracking-widest text-[#1A1A1A]">обработка фото</span>
        </div>
      )}

      {badge && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
          <Icon name="Rotate3d" size={13} className="text-white" />
          <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">3D · оживает</span>
        </div>
      )}

      {ready && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2 py-1 pointer-events-none">
          <Icon name="MousePointer2" size={11} className="text-[#1A1A1A]" />
          <span className="font-montserrat font-700 text-[8px] uppercase tracking-widest text-[#1A1A1A]">наведите</span>
        </div>
      )}
    </div>
  );
}
