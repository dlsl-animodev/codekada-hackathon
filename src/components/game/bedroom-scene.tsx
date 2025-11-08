import { useGLTF } from "@react-three/drei";

export default function BedroomScene(props: any) {
  const { scene } = useGLTF("/models/bedroom.glb") as any;
  return <primitive object={scene} {...props} />;
}

useGLTF.preload("/models/bedroom.glb");
