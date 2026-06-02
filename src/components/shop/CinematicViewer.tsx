import { useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type Props = { src: string; alt: string; className?: string };

/**
 * Кинематографичный просмотр студийного кадра: предмет плавно «дышит»,
 * по нему скользит блик, под ним движется мягкая тень. Реагирует на курсор
 * лёгким параллаксом. «Объём» создаётся светом и движением — условно, но красиво.
 */
export default function CinematicViewer({ src, alt, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const t0 = useRef(performance.now());

  const loop = useCallback(() => {
    const t = (performance.now() - t0.current) / 1000;
    const breathe = Math.sin(t * 0.7);
    const sway = Math.sin(t * 0.5);

    const mx = mouse.current.x;
    const my = mouse.current.y;

    if (imgRef.current) {
      const rx = my * 5 + breathe * 0.6;
      const ry = mx * 7 + sway * 1.4;
      imgRef.current.style.transform =
        `perspective(1100px) rotateX(${-rx}deg) rotateY(${ry}deg) translateY(${breathe * 4}px) scale(1.02)`;
    }
    // блик скользит по предмету
    if (glowRef.current) {
      const gx = 50 + (mx * 30) + Math.sin(t * 0.4) * 14;
      const gy = 32 + (my * 18) + Math.cos(t * 0.5) * 8;
      glowRef.current.style.background =
        `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)`;
    }
    // мягкая боковая подсветка/тень формы
    if (shadeRef.current) {
      const sx = 50 - mx * 28 - sway * 10;
      shadeRef.current.style.background =
        `radial-gradient(ellipse at ${sx}% 60%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.18) 100%)`;
    }
    // тень под предметом ездит вместе с покачиванием
    if (shadowRef.current) {
      shadowRef.current.style.transform =
        `translateX(calc(-50% + ${(mx * 26) + sway * 14}px)) scaleX(${1 - Math.abs(breathe) * 0.06})`;
      shadowRef.current.style.opacity = `${0.32 - Math.abs(breathe) * 0.05}`;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  const onMove = (e: React.MouseEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mouse.current = {
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    };
  };
  const onLeave = () => { mouse.current = { x: 0, y: 0 }; };

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden bg-gradient-to-b from-[#f6efe4] via-[#efe6d6] to-[#e2d6c2] ${className}`}
      style={{ perspective: '1100px' }}
    >
      {/* мягкая тень под предметом */}
      <div
        ref={shadowRef}
        className="absolute left-1/2 bottom-[10%] w-[52%] h-[7%] rounded-[50%] bg-black blur-2xl will-change-transform"
        style={{ opacity: 0.3 }}
      />

      <div className="absolute inset-0 flex items-center justify-center p-[10%]">
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-full max-h-full object-contain will-change-transform drop-shadow-[0_24px_36px_rgba(0,0,0,0.28)]"
        />
      </div>

      {/* объёмное затенение формы */}
      <div ref={shadeRef} className="absolute inset-0 pointer-events-none mix-blend-multiply" />
      {/* скользящий блик */}
      <div ref={glowRef} className="absolute inset-0 pointer-events-none mix-blend-soft-light" />

      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
        <Icon name="Sparkles" size={13} className="text-white" />
        <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">студийный кадр · ИИ</span>
      </div>
    </div>
  );
}
