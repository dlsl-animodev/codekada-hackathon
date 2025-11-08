import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ObjectState {
  rotation: { x: number; y: number; z: number };
  targetRotation: { x: number; y: number; z: number };
  action: string;
  color: string;
}

interface BedroomSceneProps {
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

export default function BedroomScene({ objectStates, setObjectStates }: BedroomSceneProps) {
  const { scene } = useGLTF("/models/bedroom.glb") as any;
  const bedRef = useRef<THREE.Object3D | null>(null);
  const deskRef = useRef<THREE.Object3D | null>(null);
  const drawerRef = useRef<THREE.Object3D | null>(null);
  const campfireRef = useRef<THREE.Object3D | null>(null);

  // find and store references to bedroom objects
  useEffect(() => {
    if (!scene) return;

    // traverse the scene to find objects by name
    scene.traverse((child: THREE.Object3D) => {
      const childName = child.name.toLowerCase();
      
      // look for bed-related objects
      if (childName.includes("bed") && !bedRef.current) {
        bedRef.current = child;
        console.log("found bed:", child.name);
      }
      
      // look for desk-related objects
      if (childName.includes("desk") && !deskRef.current) {
        deskRef.current = child;
        console.log("found desk:", child.name);
      }
      
      // look for drawer-related objects
      if (childName.includes("drawer") && !drawerRef.current) {
        drawerRef.current = child;
        console.log("found drawer:", child.name);
      }
      
      // look for campfire-related objects
      if ((childName.includes("campfire") || childName.includes("fire") || childName.includes("camp")) && !campfireRef.current) {
        campfireRef.current = child;
        console.log("found campfire:", child.name);
      }
    });
  }, [scene]);

  // animate objects based on their states
  useFrame(() => {
    // animate bed
    if (bedRef.current) {
      const bedState = objectStates.bed;
      bedRef.current.rotation.x = THREE.MathUtils.lerp(
        bedRef.current.rotation.x,
        bedState.targetRotation.x,
        0.1
      );
      bedRef.current.rotation.y = THREE.MathUtils.lerp(
        bedRef.current.rotation.y,
        bedState.targetRotation.y,
        0.1
      );
      bedRef.current.rotation.z = THREE.MathUtils.lerp(
        bedRef.current.rotation.z,
        bedState.targetRotation.z,
        0.1
      );

      // update color if changed
      bedRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material & { color?: THREE.Color }) => {
              if (mat.color) mat.color.set(bedState.color);
            });
          } else if ((child.material as any).color) {
            (child.material as any).color.set(bedState.color);
          }
        }
      });

      // update rotation state
      setObjectStates((prev) => ({
        ...prev,
        bed: {
          ...prev.bed,
          rotation: {
            x: bedRef.current!.rotation.x,
            y: bedRef.current!.rotation.y,
            z: bedRef.current!.rotation.z,
          },
        },
      }));
    }

    // animate desk
    if (deskRef.current) {
      const deskState = objectStates.desk;
      deskRef.current.rotation.x = THREE.MathUtils.lerp(
        deskRef.current.rotation.x,
        deskState.targetRotation.x,
        0.1
      );
      deskRef.current.rotation.y = THREE.MathUtils.lerp(
        deskRef.current.rotation.y,
        deskState.targetRotation.y,
        0.1
      );
      deskRef.current.rotation.z = THREE.MathUtils.lerp(
        deskRef.current.rotation.z,
        deskState.targetRotation.z,
        0.1
      );

      // update color if changed
      deskRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material & { color?: THREE.Color }) => {
              if (mat.color) mat.color.set(deskState.color);
            });
          } else if ((child.material as any).color) {
            (child.material as any).color.set(deskState.color);
          }
        }
      });

      // update rotation state
      setObjectStates((prev) => ({
        ...prev,
        desk: {
          ...prev.desk,
          rotation: {
            x: deskRef.current!.rotation.x,
            y: deskRef.current!.rotation.y,
            z: deskRef.current!.rotation.z,
          },
        },
      }));
    }

    // animate drawer
    if (drawerRef.current) {
      const drawerState = objectStates.drawer;
      drawerRef.current.rotation.x = THREE.MathUtils.lerp(
        drawerRef.current.rotation.x,
        drawerState.targetRotation.x,
        0.1
      );
      drawerRef.current.rotation.y = THREE.MathUtils.lerp(
        drawerRef.current.rotation.y,
        drawerState.targetRotation.y,
        0.1
      );
      drawerRef.current.rotation.z = THREE.MathUtils.lerp(
        drawerRef.current.rotation.z,
        drawerState.targetRotation.z,
        0.1
      );

      // update color if changed
      drawerRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material & { color?: THREE.Color }) => {
              if (mat.color) mat.color.set(drawerState.color);
            });
          } else if ((child.material as any).color) {
            (child.material as any).color.set(drawerState.color);
          }
        }
      });

      // update rotation state
      setObjectStates((prev) => ({
        ...prev,
        drawer: {
          ...prev.drawer,
          rotation: {
            x: drawerRef.current!.rotation.x,
            y: drawerRef.current!.rotation.y,
            z: drawerRef.current!.rotation.z,
          },
        },
      }));
    }

    // animate campfire
    if (campfireRef.current) {
      const campfireState = objectStates.campfire;
      campfireRef.current.rotation.x = THREE.MathUtils.lerp(
        campfireRef.current.rotation.x,
        campfireState.targetRotation.x,
        0.1
      );
      campfireRef.current.rotation.y = THREE.MathUtils.lerp(
        campfireRef.current.rotation.y,
        campfireState.targetRotation.y,
        0.1
      );
      campfireRef.current.rotation.z = THREE.MathUtils.lerp(
        campfireRef.current.rotation.z,
        campfireState.targetRotation.z,
        0.1
      );

      // update color if changed
      campfireRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material & { color?: THREE.Color }) => {
              if (mat.color) mat.color.set(campfireState.color);
            });
          } else if ((child.material as any).color) {
            (child.material as any).color.set(campfireState.color);
          }
        }
      });

      // update rotation state
      setObjectStates((prev) => ({
        ...prev,
        campfire: {
          ...prev.campfire,
          rotation: {
            x: campfireRef.current!.rotation.x,
            y: campfireRef.current!.rotation.y,
            z: campfireRef.current!.rotation.z,
          },
        },
      }));
    }
  });

  return <primitive object={scene} />;
}

useGLTF.preload("/models/bedroom.glb");
