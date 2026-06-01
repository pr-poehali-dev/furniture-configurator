import { useMemo } from 'react';
import * as THREE from 'three';
import { makeWoodTexture, type WoodKind } from './woodTexture';
import type { Config } from './types';

const MATERIAL_TO_WOOD: Record<string, WoodKind> = {
  oak: 'oak',
  walnut: 'walnut',
  white: 'white',
};

const SIZE_SCALE: Record<string, [number, number]> = {
  s: [1.6, 1.2],
  m: [2.4, 1.5],
  l: [3.2, 1.8],
};

const LEG_HEIGHT: Record<string, number> = {
  h70: 1.4,
  h75: 1.5,
  h80: 1.6,
};

const HARDWARE_COLOR: Record<string, string> = {
  none: '#888',
  h1: '#b8860b',
  h2: '#3a3a3a',
  h3: '#8a5e2c',
};

function useWoodMaterial(material: string, opts?: { rough?: number; metal?: number }) {
  return useMemo(() => {
    const tex = makeWoodTexture(MATERIAL_TO_WOOD[material] ?? 'oak');
    tex.repeat.set(2, 1);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: material === 'white' ? 0.35 : opts?.rough ?? 0.55,
      metalness: opts?.metal ?? 0.05,
    });
  }, [material, opts?.rough, opts?.metal]);
}

function useLegMaterial(legsStyle: string, material: string) {
  return useMemo(() => {
    if (legsStyle === 'metal') {
      const tex = makeWoodTexture('metal');
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.85, color: '#aaa' });
    }
    const tex = makeWoodTexture(MATERIAL_TO_WOOD[material] ?? 'oak');
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 });
  }, [legsStyle, material]);
}

/* ---------------- TABLE ---------------- */
function TableModel({ config }: { config: Config }) {
  const [w, d] = SIZE_SCALE[config.size] ?? SIZE_SCALE.m;
  const thickness = config.thickness === 't3' ? 0.12 : 0.08;
  const h = LEG_HEIGHT[config.legsHeight] ?? 1.5;
  const top = useWoodMaterial(config.material);
  const legMat = useLegMaterial(config.legsStyle, config.material);

  const legPositions: [number, number][] = [
    [w / 2 - 0.15, d / 2 - 0.15],
    [-w / 2 + 0.15, d / 2 - 0.15],
    [w / 2 - 0.15, -d / 2 + 0.15],
    [-w / 2 + 0.15, -d / 2 + 0.15],
  ];

  const legGeom = (i: number) => {
    if (config.legsStyle === 'cone') {
      return <cylinderGeometry args={[0.04, 0.09, h, 24]} />;
    }
    if (config.legsStyle === 'metal') {
      return <cylinderGeometry args={[0.035, 0.035, h, 16]} />;
    }
    return <boxGeometry args={[0.12, h, 0.12]} />;
  };

  return (
    <group position={[0, 0, 0]}>
      {/* tabletop */}
      <mesh castShadow receiveShadow position={[0, h + thickness / 2, 0]} material={top}>
        <boxGeometry args={[w, thickness, d]} />
      </mesh>
      {/* legs */}
      {legPositions.map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, h / 2, z]} material={legMat}>
          {legGeom(i)}
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- SHELF ---------------- */
function ShelfModel({ config }: { config: Config }) {
  const [w] = SIZE_SCALE[config.size] ?? SIZE_SCALE.m;
  const width = Math.min(w, 2.2);
  const height = 2.6;
  const depth = 0.7;
  const thickness = config.thickness === 't3' ? 0.1 : 0.07;
  const wood = useWoodMaterial(config.material);
  const frameMat = useLegMaterial(config.legsStyle, config.material);
  const shelfCount = 4;

  const shelves = Array.from({ length: shelfCount }, (_, i) => {
    const y = (i / (shelfCount - 1)) * height;
    return (
      <mesh key={i} castShadow receiveShadow position={[0, y, 0]} material={wood}>
        <boxGeometry args={[width, thickness, depth]} />
      </mesh>
    );
  });

  const sidePosts: [number, number][] = [
    [width / 2, depth / 2 - 0.04],
    [-width / 2, depth / 2 - 0.04],
    [width / 2, -depth / 2 + 0.04],
    [-width / 2, -depth / 2 + 0.04],
  ];

  return (
    <group position={[0, 0, 0]}>
      {shelves}
      {sidePosts.map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, height / 2, z]} material={frameMat}>
          {config.legsStyle === 'metal' ? (
            <cylinderGeometry args={[0.03, 0.03, height + thickness, 16]} />
          ) : (
            <boxGeometry args={[0.08, height + thickness, 0.08]} />
          )}
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- NIGHTSTAND ---------------- */
function NightstandModel({ config }: { config: Config }) {
  const width = 1.1;
  const height = 1.0;
  const depth = 0.8;
  const h = (LEG_HEIGHT[config.legsHeight] ?? 1.5) * 0.25;
  const body = useWoodMaterial(config.material);
  const legMat = useLegMaterial(config.legsStyle, config.material);
  const hwColor = HARDWARE_COLOR[config.hardware] ?? '#888';

  const hwMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: hwColor, roughness: 0.3, metalness: config.hardware === 'h3' ? 0.1 : 0.8 }),
    [hwColor, config.hardware]
  );

  const legPositions: [number, number][] = [
    [width / 2 - 0.12, depth / 2 - 0.12],
    [-width / 2 + 0.12, depth / 2 - 0.12],
    [width / 2 - 0.12, -depth / 2 + 0.12],
    [-width / 2 + 0.12, -depth / 2 + 0.12],
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* body */}
      <mesh castShadow receiveShadow position={[0, h + height / 2, 0]} material={body}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      {/* drawer line */}
      <mesh position={[0, h + height * 0.72, depth / 2 + 0.001]} material={body}>
        <boxGeometry args={[width * 0.92, 0.02, 0.02]} />
      </mesh>
      {/* handles */}
      {config.hardware !== 'none' && (
        <>
          <mesh position={[0, h + height * 0.85, depth / 2 + 0.04]} material={hwMat}>
            <boxGeometry args={[0.3, 0.04, 0.04]} />
          </mesh>
          <mesh position={[0, h + height * 0.35, depth / 2 + 0.04]} material={hwMat}>
            <boxGeometry args={[0.3, 0.04, 0.04]} />
          </mesh>
        </>
      )}
      {/* legs */}
      {legPositions.map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, h / 2, z]} material={legMat}>
          {config.legsStyle === 'cone' ? (
            <cylinderGeometry args={[0.03, 0.06, h, 20]} />
          ) : config.legsStyle === 'metal' ? (
            <cylinderGeometry args={[0.025, 0.025, h, 16]} />
          ) : (
            <boxGeometry args={[0.08, h, 0.08]} />
          )}
        </mesh>
      ))}
    </group>
  );
}

export default function FurnitureModels({ config }: { config: Config }) {
  if (config.furniture === 'shelf') return <ShelfModel config={config} />;
  if (config.furniture === 'nightstand') return <NightstandModel config={config} />;
  return <TableModel config={config} />;
}
