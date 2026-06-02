import { lazy, Suspense } from 'react';
import Icon from '@/components/ui/icon';
import type { Config } from '@/components/constructor/types';

const Scene3D = lazy(() => import('@/components/constructor/Scene3D'));

export default function Product3D({
  config,
  warm = false,
  className = '',
}: {
  config: Config;
  warm?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-[#202225]">
            <Icon name="Loader" size={28} className="text-[#A0784A] animate-spin" />
          </div>
        }
      >
        <Scene3D config={config} warm={warm} />
      </Suspense>
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
        <Icon name="Rotate3d" size={13} className="text-white" />
        <span className="font-montserrat font-700 text-[9px] uppercase tracking-widest text-white">3D · вращается</span>
      </div>
    </div>
  );
}
