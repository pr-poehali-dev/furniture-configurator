import { useState, useRef, lazy, Suspense, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import type { Config } from './types';

const Scene3D = lazy(() => import('./Scene3D'));

type Placement = { x: number; y: number; scale: number };

const ROOM_LIBRARY = [
  { id: 'living', label: 'Гостиная', src: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/bc7f4ba9-3c87-4750-b81b-1b889463d3bd.jpg' },
  { id: 'bedroom', label: 'Спальня', src: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/f8deafea-42fa-4588-9d75-b530b1ee536f.jpg' },
  { id: 'kitchen', label: 'Кухня', src: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/3adab72a-4962-43fe-9e14-8a640effcfef.jpg' },
  { id: 'office', label: 'Офис', src: 'https://cdn.poehali.dev/projects/c7826767-e216-4db9-a10a-19a218146298/files/c1663dac-a11c-4cfe-af43-d796ddd6b20a.jpg' },
];

export default function RoomTryOn({ config, warm }: { config: Config; warm: boolean }) {
  const [bg, setBg] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>({ x: 50, y: 58, scale: 1 });
  const [shadow, setShadow] = useState(0.35);
  const [exporting, setExporting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<(() => string) | null>(null);
  const dragRef = useRef<{ active: boolean; sx: number; sy: number; px: number; py: number }>({
    active: false, sx: 0, sy: 0, px: 0, py: 0,
  });

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBg(reader.result as string);
    reader.readAsDataURL(file);
  };

  // drag the furniture overlay
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, px: placement.x, py: placement.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.sx) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.sy) / rect.height) * 100;
    setPlacement((p) => ({
      ...p,
      x: Math.min(95, Math.max(5, dragRef.current.px + dx)),
      y: Math.min(95, Math.max(5, dragRef.current.py + dy)),
    }));
  };
  const onPointerUp = () => { dragRef.current.active = false; };

  const overlaySize = 62 * placement.scale; // % of stage width

  const exportCollage = useCallback(async () => {
    if (!bg || !captureRef.current || exporting) return;
    setExporting(true);
    try {
      const furnitureShot = captureRef.current();
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      const fImg = new Image();
      await Promise.all([
        new Promise((res, rej) => { bgImg.onload = res; bgImg.onerror = rej; bgImg.src = bg; }),
        new Promise((res, rej) => { fImg.onload = res; fImg.onerror = rej; fImg.src = furnitureShot; }),
      ]);

      const W = 1600;
      const H = Math.round((W * bgImg.height) / bgImg.width);
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bgImg, 0, 0, W, H);

      // furniture overlay — square, sized to overlaySize% of width, centered at placement
      const fW = (overlaySize / 100) * W;
      const fH = fW; // scene is square
      const cx = (placement.x / 100) * W;
      const cy = (placement.y / 100) * H;
      ctx.drawImage(fImg, cx - fW / 2, cy - fH / 2, fW, fH);

      // watermark
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '900 28px Montserrat, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText('ARTORA', 28, H - 24);

      const link = document.createElement('a');
      link.download = `artora-interior-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      /* ignore */
    } finally {
      setExporting(false);
    }
  }, [bg, exporting, overlaySize, placement.x, placement.y]);

  return (
    <div className="bg-[#242424] p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-[#A0784A] flex items-center justify-center">
          <Icon name="Layers" size={16} className="text-white" />
        </div>
        <h3 className="font-montserrat font-700 text-white text-sm uppercase tracking-widest">
          Примерка в интерьере
        </h3>
      </div>
      <p className="font-opensans text-white/50 text-xs mb-5">
        Выберите готовое помещение или загрузите фото своего — мебель встанет в кадр. Двигайте, масштабируйте, крутите мышью и скачайте результат.
      </p>

      {!bg ? (
        <div>
          <p className="font-montserrat text-[10px] uppercase tracking-widest text-white/40 mb-3">
            Готовые помещения
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {ROOM_LIBRARY.map((room) => (
              <button
                key={room.id}
                onClick={() => setBg(room.src)}
                className="group relative overflow-hidden rounded-sm aspect-[4/3] border border-white/10 hover:border-[#A0784A] transition"
              >
                <img
                  src={room.src}
                  alt={room.label}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-1.5 left-2 font-montserrat font-700 text-white text-[10px] uppercase tracking-widest">
                  {room.label}
                </span>
              </button>
            ))}
          </div>
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 hover:border-[#A0784A] transition cursor-pointer py-10 rounded-sm">
            <Icon name="ImageUp" size={28} className="text-[#A0784A]" />
            <span className="font-montserrat font-700 text-white/70 text-xs uppercase tracking-widest">
              Или загрузите фото своего помещения
            </span>
            <span className="font-opensans text-white/40 text-xs">JPG, PNG — квартира, офис и др.</span>
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <>
          {/* Stage */}
          <div
            ref={stageRef}
            className="relative w-full overflow-hidden rounded-sm bg-black select-none"
            style={{ aspectRatio: '16/10' }}
          >
            <img src={bg} alt="Интерьер" className="absolute inset-0 w-full h-full object-cover" />

            {/* draggable furniture overlay */}
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="absolute cursor-move touch-none"
              style={{
                left: `${placement.x}%`,
                top: `${placement.y}%`,
                width: `${overlaySize}%`,
                aspectRatio: '1/1',
                transform: 'translate(-50%, -50%)',
                filter: `drop-shadow(0 ${12 * placement.scale}px ${20 * placement.scale}px rgba(0,0,0,${shadow}))`,
              }}
            >
              <Suspense fallback={null}>
                <Scene3D config={config} warm={warm} transparent onReady={(fn) => (captureRef.current = fn)} />
              </Suspense>
              <div className="absolute inset-0 ring-1 ring-white/20 pointer-events-none" />
            </div>

            <div className="absolute top-3 left-3 bg-[#1A1A1A]/80 text-white font-montserrat text-[10px] uppercase tracking-widest px-2 py-1 pointer-events-none">
              Перетащите мебель · крутите мышью
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="font-montserrat text-[10px] uppercase tracking-widest text-white/50 block mb-2">
                Размер мебели
              </label>
              <input
                type="range" min={0.4} max={1.6} step={0.02}
                value={placement.scale}
                onChange={(e) => setPlacement((p) => ({ ...p, scale: Number(e.target.value) }))}
                className="w-full accent-[#A0784A]"
              />
            </div>
            <div>
              <label className="font-montserrat text-[10px] uppercase tracking-widest text-white/50 block mb-2">
                Тень / реализм
              </label>
              <input
                type="range" min={0} max={0.7} step={0.02}
                value={shadow}
                onChange={(e) => setShadow(Number(e.target.value))}
                className="w-full accent-[#A0784A]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={exportCollage}
              disabled={exporting}
              className="flex-1 bg-[#A0784A] hover:bg-[#8B4513] disabled:opacity-50 text-white font-montserrat font-700 uppercase tracking-widest text-xs py-4 transition flex items-center justify-center gap-2"
            >
              <Icon name={exporting ? 'Loader' : 'Download'} size={14} className={exporting ? 'animate-spin' : ''} />
              {exporting ? 'Готовим...' : 'Скачать результат'}
            </button>
            <button
              onClick={() => setBg(null)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-montserrat font-700 uppercase tracking-widest text-xs py-4 transition flex items-center justify-center gap-2"
            >
              <Icon name="RefreshCw" size={14} />
              Сменить помещение
            </button>
          </div>
        </>
      )}
    </div>
  );
}