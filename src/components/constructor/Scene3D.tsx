import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Center, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import FurnitureModels from './FurnitureModels';
import type { Config } from './types';

function CaptureBridge({ onReady }: { onReady?: (fn: () => string) => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!onReady) return;
    onReady(() => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    });
  }, [gl, scene, camera, onReady]);
  return null;
}

export default function Scene3D({
  config,
  warm,
  onReady,
}: {
  config: Config;
  warm: boolean;
  onReady?: (fn: () => string) => void;
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [3.2, 2.2, 3.8], fov: 36 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: warm ? 1.05 : 1.15,
      }}
    >
      <CaptureBridge onReady={onReady} />
      <SoftShadows size={28} samples={16} focus={0.9} />

      {/* gradient backdrop */}
      <color attach="background" args={[warm ? '#26201b' : '#202225']} />
      <fog attach="fog" args={[warm ? '#26201b' : '#202225', 9, 16]} />

      {/* Key light */}
      <ambientLight intensity={warm ? 0.35 : 0.45} color={warm ? '#ffe2bd' : '#ffffff'} />
      <directionalLight
        position={[5, 7, 4]}
        intensity={warm ? 2.1 : 2.4}
        color={warm ? '#ffcf95' : '#fff4e2'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={25}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      {/* Fill + rim light */}
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color={warm ? '#b07848' : '#9bb6ff'} />
      <spotLight position={[0, 6, -5]} intensity={0.8} angle={0.6} penumbra={1} color={warm ? '#ffb870' : '#cfe0ff'} />

      <Suspense fallback={null}>
        <Center disableY>
          <group position={[0, -1.4, 0]}>
            <FurnitureModels config={config} />
          </group>
        </Center>

        {/* studio floor for grounding + subtle reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.43, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color={warm ? '#1d1813' : '#1a1c1e'} roughness={0.75} metalness={0.15} />
        </mesh>

        <ContactShadows
          position={[0, -1.42, 0]}
          opacity={0.7}
          scale={11}
          blur={2.8}
          far={4.5}
          resolution={1024}
          color="#000000"
        />
        <Environment preset={warm ? 'apartment' : 'city'} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={7}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate
        autoRotateSpeed={0.55}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}