import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

type WoodKind = 'oak' | 'walnut' | 'white' | 'metal';

const PALETTES: Record<WoodKind, { base: string; grain: string; streak: string }> = {
  oak: { base: '#c89b62', grain: '#a87840', streak: '#8a5e2c' },
  walnut: { base: '#6e4326', grain: '#4a2a17', streak: '#3a2010' },
  white: { base: '#f4f0e8', grain: '#e6ded0', streak: '#d8cfbe' },
  metal: { base: '#9a9a9e', grain: '#7c7c80', streak: '#6a6a6e' },
};

/**
 * Procedurally generate a wood/metal texture on a canvas.
 * Returns a cached THREE.Texture.
 */
export function makeWoodTexture(kind: WoodKind): THREE.Texture {
  if (cache.has(kind)) return cache.get(kind)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const pal = PALETTES[kind];

  // base
  ctx.fillStyle = pal.base;
  ctx.fillRect(0, 0, size, size);

  if (kind === 'metal') {
    // brushed metal: vertical fine lines
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * size;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  } else {
    // wood grain: wavy horizontal lines
    for (let i = 0; i < 70; i++) {
      const y = (i / 70) * size + (Math.random() - 0.5) * 6;
      const lw = 1 + Math.random() * 3;
      ctx.strokeStyle = i % 5 === 0 ? pal.streak : pal.grain;
      ctx.globalAlpha = 0.25 + Math.random() * 0.35;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) {
        const wave = Math.sin((x / size) * Math.PI * (2 + i * 0.05)) * (4 + i * 0.15);
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    // knots
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 4; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 8 + Math.random() * 18;
      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      grad.addColorStop(0, pal.streak);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  cache.set(kind, texture);
  return texture;
}

export type { WoodKind };
