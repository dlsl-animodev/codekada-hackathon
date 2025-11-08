import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import BedroomScene from "./bedroom-scene";

interface SceneCanvasProps {
  playerRef: React.MutableRefObject<any>;
}

export default function SceneCanvas({ playerRef }: SceneCanvasProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <OrthographicCamera
          makeDefault
          position={[10, 10, 10]}
          zoom={50}
          onUpdate={(cam) => cam.lookAt(0, 0, 0)}
        />

        <ambientLight color="#586380ff" intensity={0.15} />
        <hemisphereLight args={["#0b2540", "#081012", 0.35]} />
        <directionalLight
          color="#a8d7ff"
          position={[8, 12, 6]}
          intensity={0.6}
        />

        <Suspense fallback={null}>
          <BedroomScene playerRef={playerRef} />
        </Suspense>
        <OrbitControls
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
