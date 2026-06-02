import { useRef, useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useCutout } from '@/hooks/useCutout';

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Продвинутый просмотрщик товара: предмет с удалённым фоном всегда целиком
 * в кадре. Управление: перетаскивание — вращение, колесо/кнопки — зум,
 * двойной клик — сброс. Авто-вращение, инерция, мягкая тень и отражение.
 */
export default function ProductViewer3D({ src, alt, className = '' }: Props) {
  const { url, ready } = useCutout(src);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const target = useRef({ rx: -4, ry: 0, zoom: 1 });
  const current = useRef({ rx: -4, ry: 0, zoom: 1 });
  const dragging = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const startTs = useRef(performance.now());

  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  useEffect(() => { autoRef.current = auto; }, [auto]);

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  const apply = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    // авто-вращение, когда не тащим и включено
    if (!dragging.current && autoRef.current) {
      target.current.ry += 0.18;
    }
    // инерция после отпускания
    if (!dragging.current && (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01)) {
      target.current.ry += velocity.current.x;
      target.current.rx = clamp(target.current.rx - velocity.current.y, -32, 32);
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;
    }

    const c = current.current;
    const tg = target.current;
    c.rx += (tg.rx - c.rx) * 0.12;
    c.ry += (tg.ry - c.ry) * 0.12;
    c.zoom += (tg.zoom - c.zoom) * 0.12;

    const float = autoRef.current && !dragging.current
      ? Math.sin((performance.now() - startTs.current) / 1000 * 1.0) * 3
      : 0;

    const obj = el.querySelector('[data-obj]') as HTMLElement | null;
    const refl = el.querySelector('[data-refl]') as HTMLElement | null;
    const shadow = el.querySelector('[data-shadow]') as HTMLElement | null;
    const core = el.querySelector('[data-core]') as HTMLElement | null;

    if (obj) {
      obj.style.transform = `translateY(${float}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.zoom})`;
    }
    if (refl) {
      refl.style.transform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.zoom}) scaleY(-1)`;
      refl.style.opacity = `${Math.max(0, 0.18 - Math.abs(c.rx) / 240)}`;
    }
    if (shadow) {
      const off = c.ry % 360;
      const skew = Math.sin((off * Math.PI) / 180) * 16;
      shadow.style.transform = `translateX(calc(-50% + ${skew}px)) scaleX(${c.zoom})`;
    }
    if (core) {
      const off = c.ry % 360;
      const skew = Math.sin((off * Math.PI) / 180) * 12;
      core.style.transform = `translateX(calc(-50% + ${skew}px)) scaleX(${c.zoom * 0.9})`;
    }

    rafRef.current = requestAnimationFrame(apply);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(rafRef.current);
  }, [apply]);

  const onDown = (x: number, y: number) => {
    dragging.current = true;
    lastPt.current = { x, y };
    velocity.current = { x: 0, y: 0 };
    setAuto(false);
  };
  const onMove = (x: number, y: number) => {
    if (!dragging.current) return;
    const dx = x - lastPt.current.x;
    const dy = y - lastPt.current.y;
    target.current.ry += dx * 0.4;
    target.current.rx = clamp(target.current.rx - dy * 0.3, -32, 32);
    velocity.current = { x: dx * 0.4, y: dy * 0.3 };
    lastPt.current = { x, y };
  };
  const onUp = () => { dragging.current = false; };

  const zoom = (delta: number) => {
    target.current.zoom = clamp(target.current.zoom + delta, 0.7, 2.2);
  };
  const reset = () => {
    target.current = { rx: -4, ry: 0, zoom: 1 };
    velocity.current = { x: 0, y: 0 };
    startTs.current = performance.now();
  };

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden select-none bg-gradient-to-b from-[#f7f2ea] via-[#f0e8da] to-[#e4d9c7] cursor-grab active:cursor-grabbing ${className}`}
      style={{ perspective: '1300px', touchAction: 'none' }}
      onMouseDown={(e) => onDown(e.clientX, e.clientY)}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onDoubleClick={reset}
      onWheel={(e) => { zoom(-e.deltaY * 0.001); }}
      onTouchStart={(e) => { const t = e.touches[0]; if (t) onDown(t.clientX, t.clientY); }}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }}
      onTouchEnd={onUp}
    >
      {/* свет за предметом */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.7), rgba(255,255,255,0) 62%)' }} />

      {/* отражение */}
      <div
        data-refl
        className="absolute left-[15%] right-[15%] pointer-events-none will-change-transform"
        style={{
          top: '58%', height: '40%',
          transformStyle: 'preserve-3d', transformOrigin: 'top center',
          opacity: 0.16,
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 60%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 60%)',
        }}
      >
        <img src={url} alt="" aria-hidden draggable={false} className="w-full h-full object-contain object-top" />
      </div>

      {/* тень */}
      <div data-shadow className="absolute left-1/2 bottom-[8%] w-[52%] h-[7%] rounded-[50%] bg-black blur-2xl will-change-transform" style={{ opacity: 0.3 }} />
      <div data-core className="absolute left-1/2 bottom-[9%] w-[30%] h-[3.5%] rounded-[50%] bg-black blur-md will-change-transform" style={{ opacity: 0.42 }} />

      {/* предмет — всегда целиком */}
      <div
        data-obj
        className="absolute will-change-transform"
        style={{
          left: '12%', right: '12%', top: '8%', bottom: '16%',
          transformStyle: 'preserve-3d', transformOrigin: 'center center', transition: 'none',
        }}
      >
        <img
          src={url}
          alt={alt}
          draggable={false}
          className="w-full h-full object-contain drop-shadow-[0_22px_30px_rgba(0,0,0,0.3)] pointer-events-none"
        />
      </div>

      {/* лоадер */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-white/85 backdrop-blur px-3 py-1.5">
            <Icon name="Loader" size={13} className="text-[#A0784A] animate-spin" />
            <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-[#1A1A1A]">обработка фото</span>
          </div>
        </div>
      )}

      {/* подпись */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
        <Icon name="Move3d" size={13} className="text-white" />
        <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">3D · покрутите</span>
      </div>

      {/* панель управления */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-1.5 py-1.5 shadow-lg">
        <Ctrl icon="ZoomOut" onClick={() => zoom(-0.2)} title="Уменьшить" />
        <Ctrl icon="ZoomIn" onClick={() => zoom(0.2)} title="Увеличить" />
        <div className="w-px h-5 bg-[#E0D6C6]" />
        <Ctrl icon={auto ? 'Pause' : 'Play'} onClick={() => setAuto((v) => !v)} title="Авто-вращение" active={auto} />
        <Ctrl icon="RotateCcw" onClick={reset} title="Сбросить" />
      </div>
    </div>
  );
}

function Ctrl({ icon, onClick, title, active }: { icon: string; onClick: () => void; title: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => e.stopPropagation()}
      className={`w-8 h-8 flex items-center justify-center transition-colors ${
        active ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
      }`}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}
