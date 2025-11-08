'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import IsometricRoom from '@/scenes/IsometricRoom';

export default function GameScene() {
  return (
    <Canvas
      camera={{
        position: [10, 10, 10],
        fov: 50,
      }}
      className="w-full h-full"
    >
      {/* lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      {/* isometric room scene */}
      <IsometricRoom />
      
      {/* camera controls */}
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        minDistance={8}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
