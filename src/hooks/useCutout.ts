import { useState, useEffect } from 'react';
import { BACKEND } from '@/lib/backend';

type Cut = { url: string; depthUrl: string };
const MEM = new Map<string, Cut>();
const STORAGE = 'artora_cutouts_v4';

function loadStore(): Record<string, Cut> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || '{}');
  } catch {
    return {};
  }
}

function saveStore(map: Record<string, Cut>) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Возвращает вырезанное фото (прозрачный PNG) и карту глубины (depthUrl)
 * для 2.5D-объёма. Кэшируется в памяти, localStorage и S3.
 * Пока идёт обработка — отдаётся исходное фото (ready=false).
 */
export function useCutout(src: string): { url: string; depthUrl: string; ready: boolean } {
  const init = () => MEM.get(src) || loadStore()[src];
  const [data, setData] = useState<Cut>(() => init() || { url: src, depthUrl: '' });
  const [ready, setReady] = useState<boolean>(() => !!init());

  useEffect(() => {
    if (!src) return;

    const cached = MEM.get(src) || loadStore()[src];
    if (cached) {
      setData(cached);
      setReady(true);
      return;
    }

    let alive = true;
    fetch(BACKEND.removeBg, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: src }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (!alive || !res?.url) return;
        const cut: Cut = { url: res.url, depthUrl: res.depthUrl || '' };
        MEM.set(src, cut);
        const store = loadStore();
        store[src] = cut;
        saveStore(store);
        setData(cut);
        setReady(true);
      })
      .catch(() => {
        /* оставляем исходное фото */
      });

    return () => {
      alive = false;
    };
  }, [src]);

  return { url: data.url, depthUrl: data.depthUrl, ready };
}