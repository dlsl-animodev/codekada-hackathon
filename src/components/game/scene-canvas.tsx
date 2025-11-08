import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import BedroomScene from "./bedroom-scene";

interface ObjectState {
  rotation: { x: number; y: number; z: number };
  targetRotation: { x: number; y: number; z: number };
  action: string;
  color: string;
}

interface SceneCanvasProps {
  objectStates: {
    bed: ObjectState;
    desk: ObjectState;
    drawer: ObjectState;
    campfire: ObjectState;
  };
  setObjectStates: React.Dispatch<
    React.SetStateAction<{
      bed: ObjectState;
      desk: ObjectState;
      drawer: ObjectState;
      campfire: ObjectState;
    }>
  >;
}

export default function SceneCanvas({ objectStates, setObjectStates }: SceneCanvasProps) {
  return (
    // make this fill the parent by using absolute inset-0
    <div className="absolute inset-0">
      <Canvas
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Orthographic camera positioned on the diagonal for an isometric-like view */}
        <OrthographicCamera
          makeDefault
          position={[10, 10, 10]}
          zoom={50}
          onUpdate={(cam) => cam.lookAt(0, 0, 0)}
        />

        {/* Night-time ambient setup */}
        {/* Very low warm/cool ambient to keep scene visible but dark */}
        <ambientLight color="#586380ff" intensity={0.15} />
        {/* Hemisphere light to give subtle cool sky and slightly warm ground bounce */}
        <hemisphereLight args={["#0b2540", "#081012", 0.35]} />
        {/* Cooler, dimmer directional moonlight to cast soft shadows/highlights */}
        <directionalLight
          color="#a8d7ff"
          position={[8, 12, 6]}
          intensity={0.6}
        />

        <Suspense fallback={null}>
          <BedroomScene objectStates={objectStates} setObjectStates={setObjectStates} />
        </Suspense>
        {/* Disable rotation to keep the isometric view, allow pan/zoom */}
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
