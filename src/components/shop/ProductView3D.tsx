import { useState, lazy, Suspense } from 'react';
import Icon from '@/components/ui/icon';
import Object3DViewer from './Object3DViewer';
import { useCutout } from '@/hooks/useCutout';

const DepthMesh3D = lazy(() => import('./DepthMesh3D'));

type Props = { src: string; alt: string; className?: string };

/**
 * Просмотр товара в объёме. По умолчанию — мгновенный 2.5D фото-обзор.
 * Кнопка «3D-модель» строит настоящий 3D-mesh из карты глубины (наш движок,
 * без внешних сервисов) и показывает его с вращением на 360°.
 */
export default function ProductView3D({ src, alt, className = '' }: Props) {
  const [mode3D, setMode3D] = useState(false);
  const { url, depthUrl, ready } = useCutout(src);
  const canMesh = ready && !!depthUrl;
  const showMesh = mode3D && canMesh;

  return (
    <div className="space-y-3">
      <div className={`relative ${className}`}>
        {showMesh ? (
          <div className="relative w-full h-full bg-gradient-to-b from-[#f7f2ea] to-[#e4d9c7] overflow-hidden">
            <Suspense fallback={<Center><Icon name="Loader" size={26} className="text-[#A0784A] animate-spin" /></Center>}>
              <DepthMesh3D textureUrl={url} depthUrl={depthUrl} />
            </Suspense>
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
              <Icon name="Box" size={13} className="text-white" />
              <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">3D-модель · 360°</span>
            </div>
          </div>
        ) : (
          <Object3DViewer src={src} alt={alt} className="w-full h-full" />
        )}

        {mode3D && !canMesh && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm">
            <Icon name="Loader" size={28} className="text-white animate-spin" />
            <p className="font-montserrat font-700 text-[10px] uppercase tracking-widest text-white">строим объёмную модель…</p>
          </div>
        )}
      </div>

      {!showMesh ? (
        <button
          onClick={() => setMode3D(true)}
          className="w-full flex items-center justify-center gap-2 py-3 font-montserrat font-700 text-[10px] uppercase tracking-widest border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#A0784A] hover:border-[#A0784A] transition"
        >
          <Icon name="Rotate3d" size={14} /> Смотреть в 3D · 360°
        </button>
      ) : (
        <button
          onClick={() => setMode3D(false)}
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
