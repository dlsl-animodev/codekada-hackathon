import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import Player from "./player";
import { World } from "@/hooks/world";

interface BedroomSceneProps {
  playerRef: React.MutableRefObject<any>;
}

export default function BedroomScene({ playerRef }: BedroomSceneProps, props: any) {
  const { scene } = useGLTF("/models/bedroom.glb") as any;
  const bedRef = useRef<THREE.Object3D | null>(null);
  const deskRef = useRef<THREE.Object3D | null>(null);
  const drawerRef = useRef<THREE.Object3D | null>(null);
  const campfireRef = useRef<THREE.Object3D | null>(null);
  const campfireFireRef = useRef<THREE.Object3D | null>(null);
  const matchRef = useRef<THREE.Object3D | null>(null);

  // find and store references to bedroom objects
  useEffect(() => {
    if (!scene) return;
    World.setSceneRoot(scene);

    // traverse the scene to find objects by name
    scene.traverse((child: THREE.Object3D) => {
      const childName = child.name.toLowerCase();

      if (childName.includes("bed") && !bedRef.current) {
        bedRef.current = child;
        console.log("found bed:", child.name);
        World.registerObject("bed", child);
      }

      if (childName.includes("desk") && !deskRef.current) {
        deskRef.current = child;
        console.log("found desk:", child.name);
        World.registerObject("desk", child);
      }

      if (childName.includes("drawer") && !drawerRef.current) {
        drawerRef.current = child;
        console.log("found drawer:", child.name);
        World.registerObject("drawer", child);
      }

      if (childName.includes("match") && childName.includes("object")) {
        matchRef.current = child;
        console.log("found match_object:", child.name);
        World.registerObject("match", child);
      }

      if (childName === "campfire" && !campfireRef.current) {
        campfireRef.current = child;
        console.log("found campfire:", child.name);
        World.registerObject("campfire", child);
        child.visible = false;
      }

      if (childName === "campfire_fire" && !campfireFireRef.current) {
        campfireFireRef.current = child;
        console.log("found campfire_fire:", child.name);
        World.registerObject("campfire_fire", child);
        child.visible = false;
      }
    });
  }, [scene]);

  // register player in world when available
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const obj = playerRef?.current?.getObject3D?.();
        if (obj) World.registerObject("player", obj);
      } catch {}
    }, 100);
    return () => clearTimeout(t);
  }, [playerRef]);


  return (
    <group {...props}>
      <primitive object={scene} />
      <Player ref={playerRef} position={[0, 0, 0]} />
    </group>
  );
}
useGLTF.preload("/models/bedroom.glb");
