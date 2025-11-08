import { useGLTF } from "@react-three/drei";
import Player from "./player";

export default function BedroomScene(props: any) {
  const { scene } = useGLTF("/models/bedroom.glb") as any;
  return (
    <group {...props}>
      <primitive object={scene} />
      {/* Player placed near the center; adjust position as needed */}
      <Player position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload("/models/bedroom.glb");
