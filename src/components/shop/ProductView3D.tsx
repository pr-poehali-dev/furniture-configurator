import { useState, lazy, Suspense } from 'react';
import Icon from '@/components/ui/icon';
import Object3DViewer from './Object3DViewer';
import { useModel3D } from '@/hooks/useModel3D';

const Model3DScene = lazy(() => import('./Model3DScene'));

type Props = { src: string; alt: string; className?: string };

/**
 * Просмотр товара в объёме. По умолчанию — мгновенный 2.5D.
 * Кнопка «Создать 3D-модель» запускает ИИ-генерацию настоящей GLB-модели
 * (Meshy) и показывает её с вращением на 360°.
 */
export default function ProductView3D({ src, alt, className = '' }: Props) {
  const [want3D, setWant3D] = useState(false);
  const model = useModel3D(src, want3D);
  const showModel = want3D && model.status === 'ready' && model.modelUrl;

  return (
    <div className="space-y-3">
      <div className={`relative ${className}`}>
        {showModel ? (
          <div className="relative w-full h-full bg-gradient-to-b from-[#f7f2ea] to-[#e4d9c7] overflow-hidden">
            <Suspense fallback={<Center><Icon name="Loader" size={26} className="text-[#A0784A] animate-spin" /></Center>}>
              <Model3DScene url={model.modelUrl} />
            </Suspense>
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
              <Icon name="Box" size={13} className="text-white" />
              <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">настоящая 3D-модель</span>
            </div>
          </div>
        ) : (
          <Object3DViewer src={src} alt={alt} className="w-full h-full" />
        )}

        {/* оверлей генерации */}
        {want3D && model.status === 'pending' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm">
            <Icon name="Loader" size={30} className="text-white animate-spin" />
            <div className="text-center">
              <p className="font-montserrat font-700 text-[11px] uppercase tracking-widest text-white">ИИ строит 3D-модель</p>
              <p className="font-montserrat text-[10px] text-white/70 mt-1">{model.progress}% · обычно 1–3 минуты</p>
            </div>
            <div className="w-40 h-1 bg-white/20 overflow-hidden">
              <div className="h-full bg-[#A0784A] transition-all" style={{ width: `${Math.max(5, model.progress)}%` }} />
            </div>
          </div>
        )}
        {want3D && model.status === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-sm">
            <Icon name="TriangleAlert" size={26} className="text-white" />
            <p className="font-montserrat text-[11px] text-white text-center px-6">Не удалось создать модель. Проверьте API-ключ Meshy или попробуйте позже.</p>
            <button onClick={() => setWant3D(false)} className="mt-1 font-montserrat font-700 text-[10px] uppercase tracking-widest text-white border border-white/40 px-3 py-1.5 hover:bg-white/10">
              Вернуться к 2.5D
            </button>
          </div>
        )}
      </div>

      {/* переключатель режима */}
      {!showModel && model.status !== 'pending' && (
        <button
          onClick={() => setWant3D(true)}
          className="w-full flex items-center justify-center gap-2 py-3 font-montserrat font-700 text-[10px] uppercase tracking-widest border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#A0784A] hover:border-[#A0784A] transition"
        >
          <Icon name="Sparkles" size={14} /> Создать настоящую 3D-модель
        </button>
      )}
      {showModel && (
        <button
          onClick={() => setWant3D(false)}
          className="w-full flex items-center justify-center gap-2 py-3 font-montserrat font-700 text-[10px] uppercase tracking-widest border border-[#E8E0D4] text-[#666] hover:border-[#A0784A] transition"
        >
          <Icon name="Image" size={14} /> Вернуться к фото-обзору
        </button>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 flex items-center justify-center">{children}</div>;
}
