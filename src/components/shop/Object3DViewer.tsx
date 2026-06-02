import { useRef, useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useCutout } from '@/hooks/useCutout';

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** число слоёв глубины (больше = объёмнее, тяжелее) */
  layers?: number;
};

/**
 * Супер-движок 2.5D: превращает плоское фото в объёмный предмет.
 * Распознаёт предмет (вырезка), берёт карту глубины и при вращении
 * смещает слои на разную величину (parallax displacement) — создаётся
 * настоящий 3D-объём. Управление: перетаскивание, зум, авто-вращение.
 */
export default function Object3DViewer({ src, alt, className = '', layers = 6 }: Props) {
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

  const hasDepth = ready && !!depthUrl;
  const layerEls = useRef<HTMLDivElement[]>([]);

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  const apply = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;

    if (!dragging.current && autoRef.current) target.current.ry += 0.16;
    if (!dragging.current && (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01)) {
      target.current.ry += velocity.current.x;
      target.current.rx = clamp(target.current.rx - velocity.current.y, -26, 26);
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;
    }
    target.current.ry = clamp(target.current.ry, -34, 34);

    const c = current.current;
    const tg = target.current;
    c.rx += (tg.rx - c.rx) * 0.12;
    c.ry += (tg.ry - c.ry) * 0.12;
    c.zoom += (tg.zoom - c.zoom) * 0.12;

    const float = autoRef.current && !dragging.current
      ? Math.sin((performance.now() - startTs.current) / 1000) * 3 : 0;

    // нормализованные углы -> сдвиг параллакса в %
    const px = c.ry / 34;   // -1..1
    const py = c.rx / 26;

    el.style.transform = `translateY(${float}px) rotateX(${c.rx * 0.35}deg) rotateY(${c.ry * 0.4}deg) scale(${c.zoom})`;

    const n = layerEls.current.length;
    layerEls.current.forEach((lay, i) => {
      if (!lay) return;
      // глубина слоя: 0 (зад) .. 1 (перёд)
      const d = n > 1 ? i / (n - 1) : 0.5;
      const amp = (d - 0.5) * 30; // px-амплитуда смещения
      lay.style.transform = `translate3d(${px * amp}px, ${py * amp * 0.6}px, ${(d - 0.5) * 40}px)`;
    });

    // блик-подсветка по направлению вращения
    const glow = wrapRef.current?.querySelector('[data-glow]') as HTMLElement | null;
    if (glow) glow.style.background = `radial-gradient(circle at ${50 + px * 22}% ${38 + py * 12}%, rgba(255,255,255,0.6), rgba(255,255,255,0) 60%)`;

    const shadow = wrapRef.current?.querySelector('[data-shadow]') as HTMLElement | null;
    if (shadow) shadow.style.transform = `translateX(calc(-50% + ${px * 22}px)) scaleX(${c.zoom})`;

    rafRef.current = requestAnimationFrame(apply);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(rafRef.current);
  }, [apply, hasDepth]);

  const onDown = (x: number, y: number) => {
    dragging.current = true; lastPt.current = { x, y };
    velocity.current = { x: 0, y: 0 }; setAuto(false);
  };
  const onMove = (x: number, y: number) => {
    if (!dragging.current) return;
    const dx = x - lastPt.current.x, dy = y - lastPt.current.y;
    target.current.ry = clamp(target.current.ry + dx * 0.4, -34, 34);
    target.current.rx = clamp(target.current.rx - dy * 0.3, -26, 26);
    velocity.current = { x: dx * 0.4, y: dy * 0.3 };
    lastPt.current = { x, y };
  };
  const onUp = () => { dragging.current = false; };
  const zoom = (d: number) => { target.current.zoom = clamp(target.current.zoom + d, 0.7, 2.2); };
  const reset = () => { target.current = { rx: -3, ry: 0, zoom: 1 }; velocity.current = { x: 0, y: 0 }; startTs.current = performance.now(); };

  // слои: каждый слой = вырезка, маскированная диапазоном глубины
  const depthLayers = Array.from({ length: layers }, (_, i) => {
    const lo = i / layers;
    const hi = (i + 1) / layers;
    return { lo, hi };
  });

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
      <div data-glow className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.6), rgba(255,255,255,0) 60%)' }} />

      <div data-shadow className="absolute left-1/2 bottom-[8%] w-[50%] h-[6%] rounded-[50%] bg-black blur-2xl will-change-transform" style={{ opacity: 0.28 }} />

      {/* сцена */}
      <div
        ref={stageRef}
        className="absolute will-change-transform"
        style={{ left: '12%', right: '12%', top: '8%', bottom: '16%', transformStyle: 'preserve-3d', transition: 'none' }}
      >
        {hasDepth ? (
          depthLayers.map((lr, i) => (
            <div
              key={i}
              ref={(n) => { if (n) layerEls.current[i] = n; }}
              className="absolute inset-0 will-change-transform"
              style={{
                transformStyle: 'preserve-3d',
                filter: `brightness(${0.9 + (i / layers) * 0.18})`,
              }}
            >
              <DepthSlice src={url} depth={depthUrl} lo={lr.lo} hi={lr.hi} alt={i === 0 ? alt : ''} />
            </div>
          ))
        ) : (
          <img src={url} alt={alt} draggable={false} className="w-full h-full object-contain drop-shadow-[0_22px_30px_rgba(0,0,0,0.3)] pointer-events-none" />
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

/**
 * Один «срез» предмета по глубине [lo..hi].
 * Маска глубины + clip по яркости через SVG-фильтр невозможны просто,
 * поэтому используем canvas: оставляем пиксели, чья глубина в диапазоне.
 */
function DepthSlice({ src, depth, lo, hi, alt }: { src: string; depth: string; lo: number; hi: number; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    let alive = true;
    const img = new Image();
    const dep = new Image();
    img.crossOrigin = 'anonymous';
    dep.crossOrigin = 'anonymous';
    let loaded = 0;
    const draw = () => {
      if (!alive || loaded < 2) return;
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return;
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const base = ctx.getImageData(0, 0, w, h);

      const dc = document.createElement('canvas');
      dc.width = w; dc.height = h;
      const dctx = dc.getContext('2d');
      if (!dctx) return;
      dctx.drawImage(dep, 0, 0, w, h);
      const dData = dctx.getImageData(0, 0, w, h).data;

      const loV = lo * 255, hiV = hi * 255;
      const px = base.data;
      for (let i = 0; i < px.length; i += 4) {
        const dv = dData[i]; // глубина (灰)
        if (dv < loV || dv > hiV) px[i + 3] = 0; // вне среза — прозрачно
      }
      ctx.putImageData(base, 0, 0);
    };
    img.onload = () => { loaded++; draw(); };
    dep.onload = () => { loaded++; draw(); };
    img.src = src;
    dep.src = depth;
    return () => { alive = false; };
  }, [src, depth, lo, hi]);

  return <canvas ref={canvasRef} aria-label={alt} className="w-full h-full object-contain" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
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