import { useState, useEffect } from 'react';
import { BACKEND } from '@/lib/backend';

const MEM = new Map<string, string>();
const STORAGE = 'artora_cutouts_v1';

function loadStore(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || '{}');
  } catch {
    return {};
  }
}

function saveStore(map: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Возвращает версию фото с удалённым фоном (прозрачный PNG).
 * Результат кэшируется в памяти и localStorage, а на бэкенде — в S3.
 * Пока идёт обработка, отдаётся исходное фото (ready=false).
 */
export function useCutout(src: string): { url: string; ready: boolean } {
  const [url, setUrl] = useState<string>(() => MEM.get(src) || loadStore()[src] || src);
  const [ready, setReady] = useState<boolean>(() => MEM.has(src) || !!loadStore()[src]);

  useEffect(() => {
    if (!src) return;

    const cached = MEM.get(src) || loadStore()[src];
    if (cached) {
      setUrl(cached);
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
      .then((data) => {
        if (!alive || !data?.url) return;
        MEM.set(src, data.url);
        const store = loadStore();
        store[src] = data.url;
        saveStore(store);
        setUrl(data.url);
        setReady(true);
      })
      .catch(() => {
        /* оставляем исходное фото */
      });

    return () => {
      alive = false;
    };
  }, [src]);

  return { url, ready };
}
