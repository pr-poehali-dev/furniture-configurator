import { useRef, useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useCutout } from '@/hooks/useCutout';

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Движок 2.5D: превращает плоское фото в объёмный предмет.
 * Предмет вырезается из фона, при вращении наклоняется в 3D и получает
 * параллакс + динамический свет/тень по карте глубины. Без canvas и CORS —
 * предмет всегда виден. Управление: перетаскивание, зум, авто-вращение.
 */
export default function Object3DViewer({ src, alt, className = '' }: Props) {
  const { url, depthUrl, ready } = useCutout(src);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const target = useRef({ rx: -3, ry: 0, zoom: 1 });
  const current = useRef({ rx: -3, ry: 0, zoom: 1 });
  const dragging = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const startTs = useRef(performance.now());

  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  useEffect(() => { autoRef.current = auto; }, [auto]);

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  const apply = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;

    if (!dragging.current && autoRef.current) target.current.ry += 0.16;
    if (!dragging.current && (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01)) {
      target.current.ry += velocity.current.x;
      target.current.rx = clamp(target.current.rx - velocity.current.y, -24, 24);
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;
    }
    target.current.ry = clamp(target.current.ry, -32, 32);

    const c = current.current;
    const tg = target.current;
    c.rx += (tg.rx - c.rx) * 0.12;
    c.ry += (tg.ry - c.ry) * 0.12;
    c.zoom += (tg.zoom - c.zoom) * 0.12;

    const float = autoRef.current && !dragging.current
      ? Math.sin((performance.now() - startTs.current) / 1000) * 3 : 0;

    const nx = c.ry / 32; // -1..1
    const ny = c.rx / 24;

    el.style.transform =
      `translateY(${float}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.zoom})`;

    // объёмный «передний» слой по карте глубины смещается сильнее (параллакс)
    const depthEl = wrapRef.current?.querySelector('[data-depth]') as HTMLElement | null;
    if (depthEl) {
      depthEl.style.transform = `translate3d(${nx * 14}px, ${ny * 9}px, 0)`;
    }
    // динамический свет по направлению поворота
    const shade = wrapRef.current?.querySelector('[data-shade]') as HTMLElement | null;
    if (shade) {
      const lx = 50 - nx * 40;
      shade.style.background =
        `linear-gradient(${90 + nx * 60}deg, rgba(0,0,0,${0.28 * Math.abs(nx)}) 0%, rgba(0,0,0,0) 40%), ` +
        `radial-gradient(circle at ${lx}% 35%, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%)`;
    }
    const glow = wrapRef.current?.querySelector('[data-glow]') as HTMLElement | null;
    if (glow) glow.style.background = `radial-gradient(circle at ${50 + nx * 20}% ${38 + ny * 12}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)`;
    const shadow = wrapRef.current?.querySelector('[data-shadow]') as HTMLElement | null;
    if (shadow) shadow.style.transform = `translateX(calc(-50% + ${nx * 20}px)) scaleX(${c.zoom})`;

    rafRef.current = requestAnimationFrame(apply);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(rafRef.current);
  }, [apply]);

  const onDown = (x: number, y: number) => {
    dragging.current = true; lastPt.current = { x, y };
    velocity.current = { x: 0, y: 0 }; setAuto(false);
  };
  const onMove = (x: number, y: number) => {
    if (!dragging.current) return;
    const dx = x - lastPt.current.x, dy = y - lastPt.current.y;
    target.current.ry = clamp(target.current.ry + dx * 0.4, -32, 32);
    target.current.rx = clamp(target.current.rx - dy * 0.3, -24, 24);
    velocity.current = { x: dx * 0.4, y: dy * 0.3 };
    lastPt.current = { x, y };
  };
  const onUp = () => { dragging.current = false; };
  const zoom = (d: number) => { target.current.zoom = clamp(target.current.zoom + d, 0.7, 2.2); };
  const reset = () => { target.current = { rx: -3, ry: 0, zoom: 1 }; velocity.current = { x: 0, y: 0 }; startTs.current = performance.now(); };

  const depthStyle: React.CSSProperties = depthUrl
    ? {
        WebkitMaskImage: `url(${depthUrl})`,
        maskImage: `url(${depthUrl})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }
    : {};

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden select-none bg-gradient-to-b from-[#f7f2ea] via-[#f0e8da] to-[#e4d9c7] cursor-grab active:cursor-grabbing ${className}`}
      style={{ perspective: '1200px', touchAction: 'none' }}
      onMouseDown={(e) => onDown(e.clientX, e.clientY)}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onDoubleClick={reset}
      onWheel={(e) => zoom(-e.deltaY * 0.001)}
      onTouchStart={(e) => { const t = e.touches[0]; if (t) onDown(t.clientX, t.clientY); }}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }}
      onTouchEnd={onUp}
    >
      <div data-glow className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)' }} />
      <div data-shadow className="absolute left-1/2 bottom-[8%] w-[50%] h-[6%] rounded-[50%] bg-black blur-2xl will-change-transform" style={{ opacity: 0.28 }} />

      {/* сцена с предметом */}
      <div
        ref={stageRef}
        className="absolute will-change-transform"
        style={{ left: '12%', right: '12%', top: '8%', bottom: '16%', transformStyle: 'preserve-3d', transition: 'none' }}
      >
        {/* базовый слой предмета — всегда виден */}
        <img
          src={url}
          alt={alt}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_22px_30px_rgba(0,0,0,0.3)] pointer-events-none"
        />

        {/* объёмный передний слой по карте глубины (параллакс + свет) */}
        {depthUrl && (
          <div data-depth className="absolute inset-0 will-change-transform pointer-events-none" style={depthStyle}>
            <img src={url} alt="" aria-hidden draggable={false} className="absolute inset-0 w-full h-full object-contain" />
            <div data-shade className="absolute inset-0" style={{ mixBlendMode: 'soft-light', ...depthStyle }} />
          </div>
        )}
      </div>

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-white/85 backdrop-blur px-3 py-1.5">
            <Icon name="Loader" size={13} className="text-[#A0784A] animate-spin" />
            <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-[#1A1A1A]">создаём объём…</span>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
        <Icon name="Box" size={13} className="text-white" />
        <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">3D-объём · покрутите</span>
      </div>

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
      className={`w-8 h-8 flex items-center justify-center transition-colors ${active ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'}`}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}
