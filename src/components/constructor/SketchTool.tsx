import { useRef, useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';
import { Config, MATERIALS, SIZES, THICKNESS, LEGS_STYLE, LEGS_HEIGHT, HARDWARE, FURNITURE_TYPES } from './types';

type Mode = 'draw' | 'upload';

type AnalyzedConfig = Partial<Config> & { comment?: string };

function labelOf(arr: { id: string; label: string }[], id?: string) {
  return arr.find((o) => o.id === id)?.label ?? '—';
}

async function pdfToImage(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // worker from CDN matching installed version
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function SketchTool({ onApply }: { onApply: (config: Partial<Config>) => void }) {
  const [mode, setMode] = useState<Mode>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<AnalyzedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [mode]);

  const pos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasDrawing(true);
  };
  const end = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    setResult(null);
    setError(null);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setConverting(true);
      try {
        const img = await pdfToImage(file);
        setUploadPreview(img);
      } catch {
        setError('Не удалось прочитать PDF. Попробуйте другой файл или фото.');
      } finally {
        setConverting(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    let image: string;
    if (mode === 'draw') {
      image = canvasRef.current!.toDataURL('image/png');
    } else {
      image = uploadPreview!;
    }
    try {
      const res = await fetch(BACKEND.sketchAnalyze, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Не удалось распознать изображение');
      } else {
        setResult(data.config as AnalyzedConfig);
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }, [mode, uploadPreview]);

  const canAnalyze = mode === 'draw' ? hasDrawing : !!uploadPreview;

  return (
    <div className="bg-[#242424] p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-[#A0784A] flex items-center justify-center">
          <Icon name="Sparkles" size={16} className="text-white" />
        </div>
        <h3 className="font-montserrat font-700 text-white text-sm uppercase tracking-widest">
          Эскиз в 3D · ИИ
        </h3>
      </div>
      <p className="font-opensans text-white/50 text-xs mb-5">
        Нарисуйте мебель от руки или загрузите фото, скан или PDF — ИИ распознает и подберёт конфигурацию.
      </p>

      {/* mode tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode('draw'); setResult(null); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-montserrat font-700 text-[11px] uppercase tracking-widest transition ${
            mode === 'draw' ? 'bg-white text-[#1A1A1A]' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <Icon name="Pencil" size={14} />
          Рисовать
        </button>
        <button
          onClick={() => { setMode('upload'); setResult(null); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-montserrat font-700 text-[11px] uppercase tracking-widest transition ${
            mode === 'upload' ? 'bg-white text-[#1A1A1A]' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <Icon name="Upload" size={14} />
          Фото / PDF
        </button>
      </div>

      {/* canvas / upload area */}
      {mode === 'draw' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={340}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="w-full bg-white touch-none cursor-crosshair rounded-sm"
            style={{ aspectRatio: '600/340' }}
          />
          <button
            onClick={clearCanvas}
            className="absolute top-3 right-3 bg-[#1A1A1A]/80 text-white p-2 hover:bg-[#1A1A1A] transition"
            title="Очистить"
          >
            <Icon name="Eraser" size={14} />
          </button>
          {!hasDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-opensans text-[#bbb] text-sm">Нарисуйте здесь...</span>
            </div>
          )}
        </div>
      ) : (
        <div>
          {uploadPreview ? (
            <div className="relative">
              <img src={uploadPreview} alt="Загруженное фото" className="w-full max-h-[340px] object-contain bg-white rounded-sm" />
              <button
                onClick={() => { setUploadPreview(null); setResult(null); }}
                className="absolute top-3 right-3 bg-[#1A1A1A]/80 text-white p-2 hover:bg-[#1A1A1A] transition"
                title="Удалить"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          ) : converting ? (
            <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#A0784A] py-16 rounded-sm">
              <Icon name="Loader" size={32} className="text-[#A0784A] animate-spin" />
              <span className="font-montserrat font-700 text-white/70 text-xs uppercase tracking-widest">
                Читаем PDF...
              </span>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 hover:border-[#A0784A] transition cursor-pointer py-16 rounded-sm">
              <Icon name="FileUp" size={32} className="text-[#A0784A]" />
              <span className="font-montserrat font-700 text-white/70 text-xs uppercase tracking-widest">
                Фото, скан или PDF
              </span>
              <span className="font-opensans text-white/40 text-xs">JPG, PNG, PDF — до 10 МБ</span>
              <input type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
            </label>
          )}
        </div>
      )}

      {/* analyze button */}
      <button
        onClick={analyze}
        disabled={!canAnalyze || loading}
        className="w-full mt-4 bg-[#A0784A] hover:bg-[#8B4513] disabled:opacity-40 disabled:cursor-not-allowed text-white font-montserrat font-700 uppercase tracking-widest text-xs py-4 transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Icon name="Loader" size={14} className="animate-spin" />
            ИИ анализирует...
          </>
        ) : (
          <>
            <Icon name="Wand2" size={14} />
            Превратить в 3D
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 bg-[#3A2A2A] border border-[#6A4A4A] p-3 flex items-start gap-2">
          <Icon name="TriangleAlert" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <span className="font-opensans text-red-200 text-xs">{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 bg-[#2A3A2A] border border-[#4A6A4A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="CircleCheck" size={16} className="text-green-400" />
            <span className="font-montserrat font-700 text-white text-xs uppercase tracking-widest">
              ИИ распознал
            </span>
          </div>
          {result.comment && (
            <p className="font-opensans text-white/70 text-xs mb-3 italic">«{result.comment}»</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
            {[
              ['Предмет', labelOf(FURNITURE_TYPES, result.furniture)],
              ['Материал', labelOf(MATERIALS, result.material)],
              ['Размер', labelOf(SIZES, result.size)],
              ['Толщина', labelOf(THICKNESS, result.thickness)],
              ['Ножки', labelOf(LEGS_STYLE, result.legsStyle)],
              ['Фурнитура', labelOf(HARDWARE, result.hardware)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="font-opensans text-white/40 text-[11px]">{k}</span>
                <span className="font-opensans text-white/80 text-[11px] text-right">{v}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onApply(result)}
            className="w-full bg-white text-[#1A1A1A] font-montserrat font-700 uppercase tracking-widest text-xs py-3 hover:bg-[#D2B48C] transition flex items-center justify-center gap-2"
          >
            <Icon name="ArrowDown" size={14} />
            Открыть в 3D-конструкторе
          </button>
        </div>
      )}
    </div>
  );
}