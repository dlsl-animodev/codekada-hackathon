import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import BedroomScene from "./bedroom-scene";
import * as THREE from "three";

interface SceneCanvasProps {
  playerRef: React.MutableRefObject<any>;
}

// camera follower component
function CameraFollower({ playerRef }: { playerRef: React.MutableRefObject<any> }) {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (!playerRef.current || !cameraRef.current || !controlsRef.current) return;

    const playerObj = playerRef.current.getObject3D?.();
    if (!playerObj) return;

    const playerPos = new THREE.Vector3();
    playerObj.getWorldPosition(playerPos);

    // smooth camera follow
    const cameraOffset = new THREE.Vector3(10, 10, 10);
    const targetCameraPos = playerPos.clone().add(cameraOffset);
    
    cameraRef.current.position.lerp(targetCameraPos, 0.1);
    
    // update orbit controls target to follow player
    const currentTarget = new THREE.Vector3();
    controlsRef.current.target.lerp(playerPos, 0.1);
    controlsRef.current.update();
  });

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={[10, 10, 10]}
        zoom={50}
        onUpdate={(cam) => cam.lookAt(0, 0, 0)}
      />
      <OrbitControls
        ref={controlsRef}
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function SceneCanvas({ playerRef }: SceneCanvasProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <CameraFollower playerRef={playerRef} />

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
      </Canvas>
    </div>
  );
}
