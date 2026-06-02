import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Environment } from '@react-three/drei';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/**
 * Сцена с настоящей 3D-моделью (GLB). Авто-кадрирование, мягкий свет,
 * вращение мышью/пальцем (OrbitControls), плавное авто-вращение.
 */
export default function Model3DScene({ url }: { url: string }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 38, position: [0, 0, 6] }}>
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.5} adjustCamera={1.0} shadows="contact">
          <Model url={url} />
        </Stage>
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.2}
        enablePan={false}
        minDistance={2}
        maxDistance={12}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
