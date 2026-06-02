import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import Object3DViewer from './Object3DViewer';
import CinematicViewer from './CinematicViewer';
import { useStudioShot } from '@/hooks/useStudioShot';

type Props = { src: string; alt: string; className?: string };

/**
 * Просмотр товара. Если студийный ИИ-кадр уже сделан (хранится в БД) —
 * сразу показываем его с кинематографичной анимацией. Иначе — фото-обзор (2.5D)
 * с кнопкой разовой генерации кадра.
 */
export default function ProductView3D({ src, alt, className = '' }: Props) {
  const [wantAI, setWantAI] = useState(false);
  const [prefer2D, setPrefer2D] = useState(false);
  const studio = useStudioShot(src, wantAI);

  // если готовый кадр нашёлся в БД — показываем его автоматически
  const hasStudio = studio.status === 'ready' && !!studio.url;
  const showStudio = hasStudio && !prefer2D;

  useEffect(() => { if (hasStudio) setWantAI(true); }, [hasStudio]);

  return (
    <div className="space-y-3">
      <div className={`relative ${className}`}>
        {showStudio ? (
          <CinematicViewer src={studio.url} alt={alt} className="w-full h-full" />
        ) : (
          <Object3DViewer src={src} alt={alt} className="w-full h-full" />
        )}

        {wantAI && studio.status === 'pending' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm">
            <Icon name="Sparkles" size={30} className="text-white animate-pulse" />
            <div className="text-center px-6">
              <p className="font-montserrat font-700 text-[11px] uppercase tracking-widest text-white">ИИ-художник рисует кадр</p>
              <p className="font-montserrat text-[10px] text-white/70 mt-1">дорисовываем предмет и свет · до 1 минуты</p>
            </div>
          </div>
        )}
        {wantAI && studio.status === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-sm">
            <Icon name="TriangleAlert" size={26} className="text-white" />
            <p className="font-montserrat text-[11px] text-white text-center px-6">Не удалось создать кадр. Попробуйте ещё раз позже.</p>
            <button onClick={() => setWantAI(false)} className="mt-1 font-montserrat font-700 text-[10px] uppercase tracking-widest text-white border border-white/40 px-3 py-1.5 hover:bg-white/10">
              Назад к фото
            </button>
          </div>
        )}
      </div>

      {hasStudio ? (
        <button
          onClick={() => setPrefer2D((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 font-montserrat font-700 text-[10px] uppercase tracking-widest border border-[#E8E0D4] text-[#666] hover:border-[#A0784A] transition"
        >
          <Icon name={showStudio ? 'Image' : 'Sparkles'} size={14} />
          {showStudio ? 'Показать исходное фото' : 'Показать студийный кадр'}
        </button>
      ) : studio.status !== 'pending' ? (
        <button
          onClick={() => setWantAI(true)}
          className="w-full flex items-center justify-center gap-2 py-3 font-montserrat font-700 text-[10px] uppercase tracking-widest border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#A0784A] hover:border-[#A0784A] transition"
        >
          <Icon name="Sparkles" size={14} /> Сделать студийный ИИ-кадр
        </button>
      ) : null}
    </div>
  );
}
