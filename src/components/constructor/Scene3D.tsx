import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Center } from '@react-three/drei';
import FurnitureModels from './FurnitureModels';
import type { Config } from './types';

export default function Scene3D({ config, warm }: { config: Config; warm: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3.2, 2.4, 3.6], fov: 38 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={[warm ? '#2a2420' : '#242424']} />

      {/* Lighting */}
      <ambientLight intensity={warm ? 0.5 : 0.7} color={warm ? '#ffd9a0' : '#ffffff'} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={warm ? 1.6 : 1.9}
        color={warm ? '#ffcf95' : '#fff6e8'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.5} color={warm ? '#a06840' : '#9bb6ff'} />

      <Suspense fallback={null}>
        <Center disableY>
          <group position={[0, -1.4, 0]}>
            <FurnitureModels config={config} />
          </group>
        </Center>
        <ContactShadows
          position={[0, -1.42, 0]}
          opacity={0.55}
          scale={10}
          blur={2.4}
          far={4}
          resolution={512}
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
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
