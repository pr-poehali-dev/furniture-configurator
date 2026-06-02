import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type Props = { textureUrl: string; depthUrl: string; depthScale?: number };

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, (t) => resolve(t), undefined, reject);
  });
}

/** Превращает depth-картинку в данные глубины (0..1) на сетке gridxgrid. */
function readDepthGrid(depthTex: THREE.Texture, alphaTex: THREE.Texture, grid: number) {
  try {
    const dImg = depthTex.image as HTMLImageElement;
    const aImg = alphaTex.image as HTMLImageElement;
    const cv = document.createElement('canvas');
    cv.width = grid; cv.height = grid;
    const ctx = cv.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(dImg, 0, 0, grid, grid);
    const d = ctx.getImageData(0, 0, grid, grid).data;
    ctx.clearRect(0, 0, grid, grid);
    ctx.drawImage(aImg, 0, 0, grid, grid);
    const a = ctx.getImageData(0, 0, grid, grid).data;
    return { depth: d, alpha: a };
  } catch {
    return null;
  }
}

function ObjectMesh({ textureUrl, depthUrl, depthScale = 0.8 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const [mat, setMat] = useState<THREE.Material | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [tex, depth] = await Promise.all([loadTexture(textureUrl), loadTexture(depthUrl)]);
      if (!alive) return;
      tex.colorSpace = THREE.SRGBColorSpace;

      const img = tex.image as HTMLImageElement;
      const aspect = img.width && img.height ? img.width / img.height : 1;
      const grid = 160;
      const data = readDepthGrid(depth, tex, grid);

      const W = aspect >= 1 ? 3 : 3 * aspect;
      const H = aspect >= 1 ? 3 / aspect : 3;

      const g = new THREE.BufferGeometry();

      if (data) {
        // строим сетку только по пикселям предмета (alpha>порог), смещая по глубине
        const dData = data.depth, aData = data.alpha;
        const positions: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const idx = new Int32Array(grid * grid).fill(-1);
        const depthAt = (x: number, y: number) => (dData[(y * grid + x) * 4] / 255) * depthScale;
        const solid = (x: number, y: number) => aData[(y * grid + x) * 4 + 3] > 110;

        let count = 0;
        for (let y = 0; y < grid; y++) {
          for (let x = 0; x < grid; x++) {
            if (!solid(x, y)) continue;
            idx[y * grid + x] = count++;
            const px = (x / (grid - 1) - 0.5) * W;
            const py = (0.5 - y / (grid - 1)) * H;
            positions.push(px, py, depthAt(x, y));
            uvs.push(x / (grid - 1), 1 - y / (grid - 1));
          }
        }
        for (let y = 0; y < grid - 1; y++) {
          for (let x = 0; x < grid - 1; x++) {
            const a = idx[y * grid + x];
            const b = idx[y * grid + x + 1];
            const c = idx[(y + 1) * grid + x];
            const d2 = idx[(y + 1) * grid + x + 1];
            if (a >= 0 && b >= 0 && c >= 0) indices.push(a, c, b);
            if (b >= 0 && c >= 0 && d2 >= 0) indices.push(b, c, d2);
          }
        }
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        g.setIndex(indices);
      } else {
        // фолбэк без CORS-данных: плоскость, фон режется по альфе текстуры
        const plane = new THREE.PlaneGeometry(W, H, 1, 1);
        g.setAttribute('position', plane.getAttribute('position'));
        g.setAttribute('uv', plane.getAttribute('uv'));
        g.setIndex(plane.getIndex());
        plane.dispose();
      }
      g.computeVertexNormals();

      const m = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.65,
        metalness: 0.05,
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.4,
      });

      if (!alive) { g.dispose(); m.dispose(); return; }
      setGeo(g);
      setMat(m);
    })();
    return () => { alive = false; };
  }, [textureUrl, depthUrl, depthScale]);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.4;
  });

  if (!geo || !mat) return null;
  return (
    <group ref={groupRef}>
      <mesh geometry={geo} material={mat} />
    </group>
  );
}

function ContextGuard() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => { e.preventDefault(); };
    canvas.addEventListener('webglcontextlost', onLost);
    return () => canvas.removeEventListener('webglcontextlost', onLost);
  }, [gl]);
  return null;
}

/**
 * Свой 3D-движок: из фото и его карты глубины строится настоящая полигональная
 * сетка (вершины смещены по глубине), фото — текстура. Объект вращается в 3D.
 * Полностью оффлайн, без внешних API и HDR.
 */
export default function DepthMesh3D({ textureUrl, depthUrl, depthScale }: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 42, position: [0, 0, 4.6] }}
    >
      <ContextGuard />
      <color attach="background" args={['#f0e8da']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 3, 5]} intensity={1.4} />
      <directionalLight position={[-3, 1, 2]} intensity={0.6} />
      <Suspense fallback={null}>
        <ObjectMesh textureUrl={textureUrl} depthUrl={depthUrl} depthScale={depthScale} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}