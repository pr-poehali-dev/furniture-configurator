import { useState, useRef } from 'react';
import { BACKEND } from '@/lib/backend';
import {
  Config,
  DEFAULT_CONFIG,
  calcPrice,
  MATERIALS,
  SIZES,
  THICKNESS,
  LEGS_STYLE,
  LEGS_HEIGHT,
  HARDWARE,
  FURNITURE_TYPES,
  Option,
} from './constructor/types';
import RoomTryOn from './constructor/RoomTryOn';
import ConstructorHeader from './constructor/ConstructorHeader';
import ConfigPanel from './constructor/ConfigPanel';
import ConstructorViewer from './constructor/ConstructorViewer';

export default function ConstructorSection() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [submitted, setSubmitted] = useState(false);
  const [warm, setWarm] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState({ name: '', phone: '' });
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<'build' | 'tryon'>('build');
  const captureRef = useRef<(() => string) | null>(null);

  const price = calcPrice(config);
  const set = (key: keyof Config) => (val: string) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    if (key === 'furniture') setGalleryIdx(0);
  };

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    setSubmitted(false);
    setShowForm(false);
    setLead({ name: '', phone: '' });
    setGalleryIdx(0);
  };

  const submitLead = async () => {
    if (!lead.name.trim() || !lead.phone.trim() || sending) return;
    setSending(true);
    try {
      await fetch(BACKEND.leads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'constructor',
          name: lead.name,
          phone: lead.phone,
          config,
          price,
        }),
      });
      setSubmitted(true);
      setShowForm(false);
    } catch {
      setSubmitted(true);
      setShowForm(false);
    } finally {
      setSending(false);
    }
  };

  const labelOf = (arr: Option[], id: string) => arr.find((o) => o.id === id)?.label ?? '';

  const exportImage = async () => {
    if (!captureRef.current || exporting) return;
    setExporting(true);
    try {
      const shot = captureRef.current();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = shot;
      });

      const W = 1280;
      const H = 960;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // background
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(0, 0, W, H);

      // render area for 3D shot (keep aspect, contain)
      const padTop = 96;
      const areaH = 660;
      const ratio = img.width / img.height;
      let dw = W - 120;
      let dh = dw / ratio;
      if (dh > areaH) {
        dh = areaH;
        dw = dh * ratio;
      }
      const dx = (W - dw) / 2;
      ctx.drawImage(img, dx, padTop + (areaH - dh) / 2, dw, dh);

      // header
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px Montserrat, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('ARTORA-ai', 60, 44);
      ctx.fillStyle = '#A0784A';
      ctx.font = '700 16px Montserrat, sans-serif';
      ctx.fillText('МЕБЕЛЬ НА ЗАКАЗ · ВАША КОНФИГУРАЦИЯ', 60, 92);

      // bottom spec bar
      const barY = padTop + areaH + 24;
      ctx.fillStyle = '#242424';
      ctx.fillRect(60, barY, W - 120, 140);

      const specs = [
        ['Предмет', FURNITURE_TYPES.find((f) => f.id === config.furniture)?.label ?? ''],
        ['Материал', labelOf(MATERIALS, config.material)],
        ['Размер', `${labelOf(SIZES, config.size)} см`],
        ['Толщина', labelOf(THICKNESS, config.thickness)],
        ['Ножки', labelOf(LEGS_STYLE, config.legsStyle)],
        ['Фурнитура', labelOf(HARDWARE, config.hardware)],
      ];
      const colW = (W - 160) / 3;
      specs.forEach((s, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const sx = 90 + col * colW;
        const sy = barY + 28 + row * 52;
        ctx.fillStyle = '#777';
        ctx.font = '700 13px Montserrat, sans-serif';
        ctx.fillText(s[0].toUpperCase(), sx, sy);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 20px "Open Sans", sans-serif';
        ctx.fillText(s[1], sx, sy + 18);
      });

      // price (right side of header)
      const priceStr = `${price.toLocaleString('ru')} ₽`;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#D2B48C';
      ctx.font = '900 40px Montserrat, sans-serif';
      ctx.fillText(priceStr, W - 60, 50);
      ctx.fillStyle = '#777';
      ctx.font = '700 13px Montserrat, sans-serif';
      ctx.fillText('ИТОГОВАЯ СТОИМОСТЬ', W - 60, 96);
      ctx.textAlign = 'left';

      const link = document.createElement('a');
      link.download = `artora-${config.furniture}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      /* ignore */
    } finally {
      setExporting(false);
    }
  };

  return (
    <section id="constructor" className="py-24 lg:py-32 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <ConstructorHeader tab={tab} setTab={setTab} config={config} onFurniture={set('furniture')} />

        {tab === 'tryon' ? (
          <RoomTryOn config={config} warm={warm} />
        ) : (
          <>
            <div className="grid lg:grid-cols-[360px,1fr] gap-8 items-start">
              {/* LEFT — Options */}
              <ConfigPanel config={config} set={set} />

              {/* RIGHT — 3D + gallery + summary */}
              <ConstructorViewer
                config={config}
                warm={warm}
                setWarm={setWarm}
                exporting={exporting}
                exportImage={exportImage}
                captureRef={captureRef}
                galleryIdx={galleryIdx}
                setGalleryIdx={setGalleryIdx}
                price={price}
                reset={reset}
                submitted={submitted}
                showForm={showForm}
                setShowForm={setShowForm}
                lead={lead}
                setLead={setLead}
                sending={sending}
                submitLead={submitLead}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}