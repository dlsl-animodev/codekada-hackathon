import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Player from "./player";
import { World } from "@/hooks/world";

interface BedroomSceneProps {
  playerRef: React.MutableRefObject<any>;
  onLoad?: () => void;
}

export default function BedroomScene({ playerRef, onLoad }: BedroomSceneProps, props: any) {
  const { scene } = useGLTF("/models/bedroom.glb") as any;
  const bedRef = useRef<THREE.Object3D | null>(null);
  const deskRef = useRef<THREE.Object3D | null>(null);
  const drawerRef = useRef<THREE.Object3D | null>(null);
  const campfireRef = useRef<THREE.Object3D | null>(null);
  const campfireFireRef = useRef<THREE.Object3D | null>(null);
  const matchRef = useRef<THREE.Object3D | null>(null);
  const deadBodyRef = useRef<THREE.Object3D | null>(null);
  const lightingAnimationRef = useRef<number>(0);
  const bodyFadeAnimationRef = useRef<number>(0);
  const [isLighting, setIsLighting] = useState(false);
  const [isFadingBody, setIsFadingBody] = useState(false);

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
        World.registerCollidable(child, 1.5);
      }

      if (childName.includes("desk") && !deskRef.current) {
        deskRef.current = child;
        console.log("found desk:", child.name);
        World.registerObject("desk", child);
        World.registerCollidable(child, 1.0);
      }

      if (childName.includes("drawer") && !drawerRef.current) {
        drawerRef.current = child;
        console.log("found drawer:", child.name);
        World.registerObject("drawer", child);
        World.registerCollidable(child, 0.8);
      }

      if (childName.includes("match") && childName.includes("object")) {
        matchRef.current = child;
        console.log("found match_object:", child.name);
        World.registerObject("match", child);
      }

      if (childName === "dead_body" || (childName.includes("dead") && childName.includes("body"))) {
        deadBodyRef.current = child;
        console.log("found dead_body:", child.name);
        World.registerObject("dead_body", child);
        child.visible = false;

        // make all materials transparent for fade-in effect
        child.traverse((meshChild: any) => {
          if (meshChild.isMesh && meshChild.material) {
            const materials = Array.isArray(meshChild.material) ? meshChild.material : [meshChild.material];
            materials.forEach((mat: any) => {
              if (mat) {
                mat.transparent = true;
                mat.opacity = 0;
              }
            });
          }
        });
      }

      if (childName === "campfire" && !campfireRef.current) {
        campfireRef.current = child;
        console.log("found campfire:", child.name);
        World.registerObject("campfire", child);
        World.registerCollidable(child, 0.6);
        child.visible = false;

        // register light campfire function for animation
        (World as any).lightCampfireAnimated = () => {
          setIsLighting(true);
          lightingAnimationRef.current = 0;

          // also start fading in the dead body
          setIsFadingBody(true);
          bodyFadeAnimationRef.current = 0;
        };
      }

      if (childName === "campfire_fire" && !campfireFireRef.current) {
        campfireFireRef.current = child;
        console.log("found campfire_fire:", child.name);
        World.registerObject("campfire_fire", child);
        child.visible = false;

        // set initial scale to 0 for animation
        child.scale.set(0, 0, 0);
      }
    });

    // trigger onload callback after scene is ready
    if (onLoad) {
      const timer = setTimeout(() => {
        onLoad();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scene, onLoad]);

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

  // animate campfire lighting
  useFrame((_, delta) => {
    if (!isLighting) return;

    const campfire = campfireRef.current;
    const campfireFire = campfireFireRef.current;

    if (!campfire || !campfireFire) return;

    // animate over 1 second
    lightingAnimationRef.current += delta;
    const progress = Math.min(lightingAnimationRef.current / 1.0, 1.0);

    if (progress < 1.0) {
      // ease out cubic for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);

      // make campfire visible immediately
      campfire.visible = true;
      campfireFire.visible = true;

      // scale up the fire with slight overshoot effect
      const scale = eased * 1.1;
      campfireFire.scale.set(scale, scale, scale);

      // add slight flickering during ignition
      const flicker = Math.sin(progress * 20) * 0.05;
      campfireFire.scale.x += flicker;
      campfireFire.scale.z += flicker;
    } else {
      // animation complete, settle to normal scale
      campfireFire.scale.set(1, 1, 1);
      setIsLighting(false);
    }
  });

  // animate dead body fade in
  useFrame((_, delta) => {
    if (!isFadingBody) return;

    const deadBody = deadBodyRef.current;
    if (!deadBody) return;

    // fade in over 2 seconds (slower for dramatic effect)
    bodyFadeAnimationRef.current += delta;
    const progress = Math.min(bodyFadeAnimationRef.current / 2.0, 1.0);

    if (progress < 1.0) {
      // ease in for gradual reveal
      const eased = progress * progress;

      // make body visible
      deadBody.visible = true;

      // fade in all materials
      deadBody.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat && mat.transparent) {
              mat.opacity = eased;
            }
          });
        }
      });
    } else {
      // animation complete, set full opacity
      deadBody.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat && mat.transparent) {
              mat.opacity = 1.0;
            }
          });
        }
      });
      setIsFadingBody(false);
    }
  });

  return (
    <group {...props}>
      <primitive object={scene} />
      <Player ref={playerRef} position={[0, 0, 0]} />
    </group>
  );
}
useGLTF.preload("/models/bedroom.glb");
