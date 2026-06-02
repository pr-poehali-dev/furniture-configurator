import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

type Props = { textureUrl: string; depthUrl: string };

const vertex = /* glsl */ `
  uniform sampler2D uDepth;
  uniform float uDepthScale;
  uniform sampler2D uTex;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    vUv = uv;
    vec4 t = texture2D(uTex, uv);
    vAlpha = t.a;
    float d = texture2D(uDepth, uv).r;
    // фон (alpha~0) — отводим назад, чтобы не торчал
    float depth = d * uDepthScale * step(0.15, t.a);
    vec3 pos = position;
    pos.z += depth;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform sampler2D uDepth;
  uniform float uDepthScale;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    vec4 c = texture2D(uTex, vUv);
    if (c.a < 0.35) discard; // фон не рисуем
    // мягкое затенение по глубине — объём виден лучше
    float d = texture2D(uDepth, vUv).r;
    float shade = 0.78 + d * 0.32;
    gl_FragColor = vec4(c.rgb * shade, 1.0);
  }
`;

function Mesh({ textureUrl, depthUrl }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [tex, depth] = useLoader(THREE.TextureLoader, [textureUrl, depthUrl]);

  const { aspect, uniforms } = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const img = tex.image as HTMLImageElement | undefined;
    const a = img && img.width && img.height ? img.width / img.height : 1;
    return {
      aspect: a,
      uniforms: {
        uTex: { value: tex },
        uDepth: { value: depth },
        uDepthScale: { value: 0.55 },
      },
    };
  }, [tex, depth]);

  // лёгкое «дыхание» — намёк на живой объём, вращение делает OrbitControls
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
  });

  const w = aspect >= 1 ? 3 : 3 * aspect;
  const h = aspect >= 1 ? 3 / aspect : 3;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[w, h, 200, 200]} />
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}

/**
 * Настоящий 3D-mesh из одного фото: сетка получает рельеф по карте глубины
 * (displacement в вершинном шейдере), фото накладывается текстурой.
 * Крутится на 360° мышью/пальцем. Без внешних API.
 */
export default function DepthMesh3D({ textureUrl, depthUrl }: Props) {
  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 40, position: [0, 0, 5.2] }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Suspense fallback={null}>
        <Mesh textureUrl={textureUrl} depthUrl={depthUrl} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.6}
        enablePan={false}
        minDistance={2.5}
        maxDistance={9}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(Math.PI * 2) / 3}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
