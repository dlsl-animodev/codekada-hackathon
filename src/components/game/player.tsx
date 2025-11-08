"use client";

import React, { useEffect, useRef, useImperativeHandle } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { World } from "@/hooks/world";
import * as THREE from "three";

type Vec3 = [number, number, number];

export type PlayerHandle = {
  moveTo: (pos: Vec3, speed?: number) => void;
  setPosition: (pos: Vec3) => void;
  stop: () => void;
  getPosition: () => Vec3;
  getObject3D: () => THREE.Object3D | null;
};

export type PlayerProps = {
  position?: Vec3;
  speed?: number; // default movement speed for keyboard and moveTo when not provided
  onArrived?: () => void; // callback when an issued moveTo finishes
};

const Player = React.forwardRef<PlayerHandle, PlayerProps>(
  (props, ref) => {
    const { position = [0, 0, 0], speed = 1, onArrived, ...rest } = props as PlayerProps & any;
    const group = useRef<THREE.Group | null>(null);
    const { scene, animations } = useGLTF("/models/stickman_cool_guy.glb") as any;
    const { actions } = useAnimations(animations, group as any);
    const currentAction = useRef<any>(null);

    // target movement (for voice-controlled moves)
    const targetRef = useRef<Vec3 | null>(null);
    const targetSpeedRef = useRef<number>(speed);

    // helper to robustly find an action by keywords (case-insensitive, partial match)
    const getActionByKeywords = (keywords: string[]) => {
      if (!actions) return null;
      for (const name of Object.keys(actions)) {
        const lname = name.toLowerCase();
        for (const kw of keywords) {
          if (lname.includes(kw.toLowerCase())) {
            return actions[name];
          }
        }
      }
      // fallback: direct key access if provided
      for (const key of keywords) {
        if ((actions as any)[key]) return (actions as any)[key];
      }
      return null;
    };

    // enable shadows on all meshes in the loaded scene
    React.useEffect(() => {
      if (!scene) return;
      scene.traverse((obj: any) => {
        if (obj.isMesh || obj.isSkinnedMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
    }, [scene]);

    // simple key state
    const keys = useRef<Record<string, boolean>>({});
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        keys.current[e.key.toLowerCase()] = true;
      };
      const up = (e: KeyboardEvent) => {
        keys.current[e.key.toLowerCase()] = false;
      };
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      return () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
      };
    }, []);

    // try to start with static pose / idle animation
    useEffect(() => {
      const idle = getActionByKeywords(["static", "pose", "idle"]);
      if (idle) {
        idle.play();
        currentAction.current = idle;
      }
    }, [actions]);

    // expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        moveTo: (pos: Vec3, s?: number) => {
          targetRef.current = pos;
          targetSpeedRef.current = s ?? speed;
        },
        setPosition: (pos: Vec3) => {
          if (group.current) group.current.position.set(pos[0], pos[1], pos[2]);
        },
        stop: () => {
          targetRef.current = null;
        },
        getPosition: () => {
          const p = group.current?.position;
          return [p?.x ?? 0, p?.y ?? 0, p?.z ?? 0];
        },
        getObject3D: () => {
          return group.current;
        },
      }),
      [speed]
    );

    useFrame((_, delta) => {
      const obj = group.current;
      if (!obj) return;

      const playerRadius = 0.5; // collision radius for player

      // determine movement direction - if there's a voice target, follow it and ignore keys
      const dir = new THREE.Vector3();
      const target = targetRef.current;
      if (target) {
        const tx = target[0];
        const tz = target[2];
        dir.x = tx - obj.position.x;
        dir.z = tz - obj.position.z;

        const dist = Math.hypot(dir.x, dir.z);
        if (dist > 0.01) {
          dir.normalize();
          const step = targetSpeedRef.current * delta;
          // avoid overshoot
          const move = Math.min(step, dist);
          
          // calculate new position and check collision
          const newPosition = new THREE.Vector3(
            obj.position.x + dir.x * move,
            obj.position.y,
            obj.position.z + dir.z * move
          );
          
          const validPosition = World.getValidPosition(newPosition, obj.position, playerRadius);
          obj.position.copy(validPosition);

          // face movement direction (y-up)
          const targetAngle = Math.atan2(dir.x, dir.z);
          const targetQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, targetAngle, 0)
          );
          obj.quaternion.slerp(targetQuat, Math.min(1, 10 * delta));

          // ensure walking animation plays
          const walk = getActionByKeywords(["walk", "walking"]);
          if (walk) {
            if (currentAction.current !== walk) {
              // switch to walk animation
              currentAction.current?.fadeOut?.(0.15);
              walk.paused = false;
              walk.setLoop(THREE.LoopRepeat, Infinity);
              walk.clampWhenFinished = false;
              walk.timeScale = 1;
              walk.reset().fadeIn(0.15).play();
              currentAction.current = walk;
            } else {
              // already walking, ensure it's playing properly
              if (walk.paused) {
                walk.paused = false;
              }
              if ((walk.timeScale ?? 1) <= 0) {
                walk.timeScale = 1;
              }
              if (!walk.isRunning()) {
                walk.play();
              }
            }
          }
        } else {
          // arrived
          targetRef.current = null;

          // transition back to idle
          const idle = getActionByKeywords(["static", "pose", "idle"]);
          if (idle && currentAction.current !== idle) {
            currentAction.current?.fadeOut?.(0.15);
            idle.reset().fadeIn(0.15).play();
            currentAction.current = idle;
          }

          if (onArrived) onArrived();
        }
      } else {
        // keyboard movement when not following a voice target
        if (keys.current["w"]) dir.z -= 1;
        if (keys.current["s"]) dir.z += 1;
        if (keys.current["a"]) dir.x -= 1;
        if (keys.current["d"]) dir.x += 1;

        if (dir.length() > 0) {
          dir.normalize();
          const speedUsed = speed; // keyboard speed
          
          // calculate new position and check collision
          const newPosition = new THREE.Vector3(
            obj.position.x + dir.x * speedUsed * delta,
            obj.position.y,
            obj.position.z + dir.z * speedUsed * delta
          );
          
          const validPosition = World.getValidPosition(newPosition, obj.position, playerRadius);
          obj.position.copy(validPosition);

          // face movement direction (y-up)
          const targetAngle = Math.atan2(dir.x, dir.z);
          const targetQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, targetAngle, 0)
          );
          obj.quaternion.slerp(targetQuat, Math.min(1, 10 * delta));

          // play walking animation (robust lookup) and ensure it's looping forward
          const walk = getActionByKeywords(["walk", "walking"]);
          if (walk) {
            if (currentAction.current === walk) {
              if ((walk.timeScale ?? 1) < 0) {
                walk.timeScale = 1;
                walk.setLoop(THREE.LoopRepeat, Infinity);
                walk.clampWhenFinished = false;
                walk.paused = false;
                walk.play?.();
              }

              if (walk.paused) {
                walk.paused = false;
                walk.play?.();
              }
            } else {
              currentAction.current?.fadeOut?.(0.15);
              walk.paused = false;
              walk.setLoop(THREE.LoopRepeat, Infinity);
              walk.clampWhenFinished = false;
              walk.timeScale = 1;
              walk.reset().fadeIn(0.15).play();
              currentAction.current = walk;
            }
          } else {
            if (currentAction.current && currentAction.current.paused) {
              currentAction.current.paused = false;
              currentAction.current.play?.();
            }
          }
        } else {
          // no input -> idle/static (robust lookup)
          const idle = getActionByKeywords(["static", "pose", "idle"]);

          if (idle && currentAction.current !== idle) {
            currentAction.current?.fadeOut?.(0.15);
            idle.reset().fadeIn(0.15).play();
            currentAction.current = idle;
          } else if (!idle) {
            // if no idle action exists, smoothly transition the walk animation back to its first pose
            const walk = getActionByKeywords(["walk", "walking"]);
            if (walk && currentAction.current === walk) {
              const clipDuration =
                (typeof walk.getClip === "function"
                  ? walk.getClip().duration
                  : walk._clip && walk._clip.duration) || 1;
              const currentTime = (walk.time || 0) % clipDuration;
              const progress = currentTime / clipDuration;

              if (progress > 0.5) {
                if ((walk.timeScale ?? 1) < 0) walk.timeScale = 1;
                walk.setLoop(THREE.LoopOnce, 0);
                walk.clampWhenFinished = true;
                walk.paused = false;
                walk.play?.();
              } else {
                walk.setLoop(THREE.LoopOnce, 0);
                walk.clampWhenFinished = true;
                walk.timeScale = -0.6;
                walk.paused = false;
                walk.play?.();
              }

              currentAction.current = walk;
            } else {
              if (currentAction.current && !currentAction.current.paused) {
                currentAction.current.paused = true;
              }
            }
          }
        }
      }
    });

    return (
      <group ref={group} dispose={null} position={position} {...(rest as any)}>
        <primitive object={scene} />
      </group>
    );
  }
);

export default Player;

useGLTF.preload("/models/stickman_cool_guy.glb");
