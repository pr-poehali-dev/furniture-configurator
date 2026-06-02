import { useState, useEffect, useRef } from 'react';
import { BACKEND } from '@/lib/backend';

type State = { status: 'idle' | 'pending' | 'ready' | 'error'; progress: number; modelUrl: string };
const MEM = new Map<string, string>();
const STORAGE = 'artora_models_v1';

function loadStore(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { return {}; }
}
function saveStore(map: Record<string, string>) {
  try { localStorage.setItem(STORAGE, JSON.stringify(map)); } catch { /* ignore */ }
}

/**
 * Генерирует и отдаёт настоящую 3D-модель (GLB) из фото через Meshy.
 * Кэширует готовую модель в памяти/localStorage/S3. Генерация запускается
 * только когда enabled=true (по требованию, чтобы не тратить кредиты).
 */
export function useModel3D(src: string, enabled: boolean): State {
  const cached = MEM.get(src) || loadStore()[src];
  const [state, setState] = useState<State>(
    cached ? { status: 'ready', progress: 100, modelUrl: cached } : { status: 'idle', progress: 0, modelUrl: '' }
  );
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const hit = MEM.get(src) || loadStore()[src];
    if (hit) { setState({ status: 'ready', progress: 100, modelUrl: hit }); return; }
    if (!enabled || !src) return;

    let alive = true;
    setState({ status: 'pending', progress: 0, modelUrl: '' });

    const poll = (taskId: string) => {
      timer.current = window.setTimeout(async () => {
        if (!alive) return;
        try {
          const r = await fetch(BACKEND.gen3d, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', taskId, imageUrl: src }),
          });
          const d = await r.json();
          if (!alive) return;
          if (d.status === 'SUCCEEDED' && d.modelUrl) {
            MEM.set(src, d.modelUrl);
            const store = loadStore(); store[src] = d.modelUrl; saveStore(store);
            setState({ status: 'ready', progress: 100, modelUrl: d.modelUrl });
          } else if (d.status === 'FAILED' || d.status === 'EXPIRED') {
            setState({ status: 'error', progress: 0, modelUrl: '' });
          } else {
            setState({ status: 'pending', progress: d.progress || 0, modelUrl: '' });
            poll(taskId);
          }
        } catch { if (alive) setState({ status: 'error', progress: 0, modelUrl: '' }); }
      }, 4000);
    };

    fetch(BACKEND.gen3d, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', imageUrl: src }),
    })
      .then((r) => r.json())
      .then((d) => { if (alive && d.taskId) poll(d.taskId); else if (alive) setState({ status: 'error', progress: 0, modelUrl: '' }); })
      .catch(() => { if (alive) setState({ status: 'error', progress: 0, modelUrl: '' }); });

    return () => { alive = false; if (timer.current) clearTimeout(timer.current); };
  }, [src, enabled]);

  return state;
}
