import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { makeWoodTexture, makeRoughnessTexture, type WoodKind } from './woodTexture';
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
    const kind = MATERIAL_TO_WOOD[material] ?? 'oak';
    const tex = makeWoodTexture(kind);
    tex.repeat.set(2, 1);
    const rough = makeRoughnessTexture(kind);
    rough.repeat.set(2, 1);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughnessMap: rough,
      roughness: material === 'white' ? 0.4 : opts?.rough ?? 0.62,
      metalness: opts?.metal ?? 0.04,
      envMapIntensity: material === 'white' ? 0.6 : 0.4,
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

function useHardwareMaterial(hardware: string, material: string) {
  return useMemo(() => {
    const color = HARDWARE_COLOR[hardware] ?? '#888';
    if (hardware === 'h3') {
      const tex = makeWoodTexture(MATERIAL_TO_WOOD[material] === 'white' ? 'oak' : (MATERIAL_TO_WOOD[material] ?? 'oak'));
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.05 });
    }
    return new THREE.MeshStandardMaterial({
      color,
      roughness: hardware === 'h1' ? 0.25 : 0.4,
      metalness: 0.9,
    });
  }, [hardware, material]);
}

/* A single drawer/cabinet pull (knob or bar handle) facing +Z */
function Handle({
  x,
  y,
  z,
  material,
  bar,
}: {
  x: number;
  y: number;
  z: number;
  material: THREE.Material;
  bar: boolean;
}) {
  if (bar) {
    return (
      <group position={[x, y, z]}>
        <mesh castShadow position={[0, 0, 0.05]} material={material}>
          <boxGeometry args={[0.32, 0.035, 0.035]} />
        </mesh>
        <mesh material={material} position={[-0.13, 0, 0.025]}>
          <boxGeometry args={[0.03, 0.03, 0.05]} />
        </mesh>
        <mesh material={material} position={[0.13, 0, 0.025]}>
          <boxGeometry args={[0.03, 0.03, 0.05]} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh castShadow position={[x, y, z + 0.04]} material={material}>
      <sphereGeometry args={[0.05, 20, 20]} />
    </mesh>
  );
}

/* ---------------- TABLE ---------------- */
function TableModel({ config }: { config: Config }) {
  const [w, d] = SIZE_SCALE[config.size] ?? SIZE_SCALE.m;
  const thickness = config.thickness === 't3' ? 0.12 : 0.08;
  const h = LEG_HEIGHT[config.legsHeight] ?? 1.5;
  const top = useWoodMaterial(config.material);
  const legMat = useLegMaterial(config.legsStyle, config.material);
  const hwMat = useHardwareMaterial(config.hardware, config.material);
  const hasHw = config.hardware !== 'none';
  const barHandle = config.hardware === 'h2' || config.hardware === 'h3';

  const legPositions: [number, number][] = [
    [w / 2 - 0.15, d / 2 - 0.15],
    [-w / 2 + 0.15, d / 2 - 0.15],
    [w / 2 - 0.15, -d / 2 + 0.15],
    [-w / 2 + 0.15, -d / 2 + 0.15],
  ];

  const legGeom = () => {
    if (config.legsStyle === 'cone') {
      return <cylinderGeometry args={[0.04, 0.09, h, 24]} />;
    }
    if (config.legsStyle === 'metal') {
      return <cylinderGeometry args={[0.035, 0.035, h, 16]} />;
    }
    return <boxGeometry args={[0.12, h, 0.12]} />;
  };

  const drawerH = 0.22;
  const drawerY = h - drawerH / 2 - 0.02;

  return (
    <group position={[0, 0, 0]}>
      {/* tabletop with chamfered edges */}
      <RoundedBox
        args={[w, thickness, d]}
        radius={Math.min(thickness * 0.4, 0.03)}
        smoothness={4}
        castShadow
        receiveShadow
        position={[0, h + thickness / 2, 0]}
        material={top}
      />

      {/* drawer apron under the top (front-facing +Z) */}
      <RoundedBox
        args={[w * 0.55, drawerH, 0.05]}
        radius={0.012}
        smoothness={3}
        castShadow
        position={[0, drawerY, d / 2 - 0.06]}
        material={top}
      />
      {/* drawer handle */}
      {hasHw && (
        <Handle x={0} y={drawerY} z={d / 2 - 0.035} material={hwMat} bar={barHandle} />
      )}

      {/* legs */}
      {legPositions.map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, h / 2, z]} material={legMat}>
          {legGeom()}
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
  const hwMat = useHardwareMaterial(config.hardware, config.material);
  const hasHw = config.hardware !== 'none';
  const barHandle = config.hardware === 'h2' || config.hardware === 'h3';
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

  // bottom closed section height (between shelf 0 and shelf 1)
  const sectionTop = (1 / (shelfCount - 1)) * height;
  const doorH = sectionTop - thickness;
  const doorY = thickness / 2 + doorH / 2;
  const doorW = width / 2 - 0.04;

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

      {/* two doors on the bottom section */}
      {[-1, 1].map((dir) => (
        <group key={dir}>
          <mesh castShadow position={[dir * (doorW / 2 + 0.01), doorY, depth / 2 - 0.02]} material={wood}>
            <boxGeometry args={[doorW, doorH, 0.04]} />
          </mesh>
          {hasHw && (
            <Handle
              x={dir * 0.06}
              y={doorY}
              z={depth / 2}
              material={hwMat}
              bar={barHandle}
            />
          )}
        </group>
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
  const hwMat = useHardwareMaterial(config.hardware, config.material);
  const hasHw = config.hardware !== 'none';
  const barHandle = config.hardware === 'h2' || config.hardware === 'h3';

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
      <mesh position={[0, h + height * 0.55, depth / 2 + 0.001]} material={body}>
        <boxGeometry args={[width * 0.92, 0.015, 0.02]} />
      </mesh>
      {/* handles on two drawers */}
      {hasHw && (
        <>
          <Handle x={0} y={h + height * 0.78} z={depth / 2} material={hwMat} bar={barHandle} />
          <Handle x={0} y={h + height * 0.28} z={depth / 2} material={hwMat} bar={barHandle} />
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