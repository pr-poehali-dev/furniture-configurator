import { useState, useEffect, useRef } from 'react';
import { BACKEND } from '@/lib/backend';

type State = { status: 'idle' | 'pending' | 'ready' | 'error'; url: string };
const MEM = new Map<string, string>();
const STORAGE = 'artora_studio_v1';

function loadStore(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { return {}; }
}
function saveStore(map: Record<string, string>) {
  try { localStorage.setItem(STORAGE, JSON.stringify(map)); } catch { /* ignore */ }
}

/**
 * ИИ-художник: дорисовывает предмет до целого и делает студийный кадр.
 * Запускается по требованию (enabled=true). Долгая генерация не блокирует UI —
 * запрос start идёт фоном, а статус опрашивается по готовности файла в S3.
 */
export function useStudioShot(src: string, enabled: boolean): State {
  const cached = MEM.get(src) || loadStore()[src];
  const [state, setState] = useState<State>(
    cached ? { status: 'ready', url: cached } : { status: 'idle', url: '' }
  );
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const hit = MEM.get(src) || loadStore()[src];
    if (hit) { setState({ status: 'ready', url: hit }); return; }
    if (!enabled || !src) return;

    let alive = true;
    setState({ status: 'pending', url: '' });

    const finish = (url: string) => {
      MEM.set(src, url);
      const store = loadStore(); store[src] = url; saveStore(store);
      if (alive) setState({ status: 'ready', url });
    };

    const poll = () => {
      timer.current = window.setTimeout(async () => {
        if (!alive) return;
        try {
          const r = await fetch(BACKEND.studioShot, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', imageUrl: src }),
          });
          const d = await r.json();
          if (!alive) return;
          if (d.status === 'ready' && d.url) finish(d.url);
          else if (d.status === 'error') setState({ status: 'error', url: '' });
          else poll();
        } catch { if (alive) poll(); }
      }, 4000);
    };

    // запускаем генерацию (запрос может оборваться по таймауту шлюза — это ок,
    // результат всё равно появится в S3 и его поймает опрос статуса)
    fetch(BACKEND.studioShot, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', imageUrl: src }),
    })
      .then((r) => r.json())
      .then((d) => { if (alive && d.status === 'ready' && d.url) finish(d.url); })
      .catch(() => { /* шлюз оборвал — ловим через poll */ });

    poll();

    return () => { alive = false; if (timer.current) clearTimeout(timer.current); };
  }, [src, enabled]);

  return state;
}
