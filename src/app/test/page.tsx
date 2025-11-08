"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";

function Box() {
    return (
        <mesh rotation={[0.4, 0.2, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="green" />
        </mesh>
    );
}

export default function TestPage() {
    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <Canvas>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Suspense fallback={null}>
                    <Box />
                </Suspense>
                <OrbitControls />
            </Canvas>
        </div>
    );
}
