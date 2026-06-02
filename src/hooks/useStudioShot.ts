import { useState, useEffect, useRef } from 'react';
import { BACKEND } from '@/lib/backend';

type State = { status: 'idle' | 'pending' | 'ready' | 'error'; url: string };
const MEM = new Map<string, string>();

/**
 * ИИ-художник: дорисовывает предмет до целого и делает студийный кадр.
 * Генерация разовая — результат фиксируется в БД на бэкенде. Здесь только
 * запрашиваем готовый кадр или запускаем разовую генерацию (enabled=true).
 */
export function useStudioShot(src: string, enabled: boolean): State {
  const cached = MEM.get(src);
  const [state, setState] = useState<State>(
    cached ? { status: 'ready', url: cached } : { status: 'idle', url: '' }
  );
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (MEM.has(src)) { setState({ status: 'ready', url: MEM.get(src)! }); return; }
    if (!src) return;

    let alive = true;

    const ask = (action: 'status' | 'start') =>
      fetch(BACKEND.studioShot, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, imageUrl: src }),
      }).then((r) => r.json());

    const finish = (url: string) => {
      MEM.set(src, url);
      if (alive) setState({ status: 'ready', url });
    };

    // сначала проверяем — вдруг кадр уже зафиксирован в БД
    ask('status')
      .then((d) => {
        if (!alive) return;
        if (d.status === 'ready' && d.url) { finish(d.url); return; }
        if (!enabled) { setState({ status: 'idle', url: '' }); return; }

        // запускаем разовую генерацию
        setState({ status: 'pending', url: '' });
        ask('start')
          .then((res) => {
            if (!alive) return;
            if (res.status === 'ready' && res.url) finish(res.url);
            else setState({ status: 'error', url: '' });
          })
          .catch(() => {
            // запрос мог оборваться по таймауту шлюза — добиваем опросом статуса
            if (!alive) return;
            const poll = () => {
              timer.current = window.setTimeout(() => {
                ask('status').then((s) => {
                  if (!alive) return;
                  if (s.status === 'ready' && s.url) finish(s.url);
                  else poll();
                }).catch(() => { if (alive) poll(); });
              }, 4000);
            };
            poll();
          });
      })
      .catch(() => { if (alive) setState({ status: 'error', url: '' }); });

    return () => { alive = false; if (timer.current) clearTimeout(timer.current); };
  }, [src, enabled]);

  return state;
}
