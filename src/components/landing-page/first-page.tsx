"use client";

// First page is the actual title, description and cta

import HeroImage from '../../../public/images/hero-image.jpg'

import Link from "next/link";
import { useUsername } from "../../../hooks/use-username";
import { Button } from "@/components/ui/Button";
import { useEffect, useRef, useState } from "react";

import { Dispatch } from "react";
import { SetStateAction } from "react";
import Image from 'next/image';

interface FirstPageProps {
    setPage: Dispatch<SetStateAction<number>>;
}

export default function FirstPage({ setPage }: FirstPageProps) {
    const { username, setUsername } = useUsername();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Isometric particles animation
        const particles: Array<{
            x: number;
            y: number;
            z: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
        }> = [];

        const colors = ["#FAC638", "#64B5F6", "#81C784", "#FFB74D", "#BA68C8"];

        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                z: Math.random() * 100,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        const animate = () => {
            ctx.fillStyle = "rgba(10, 15, 30, 0.1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw isometric cube
                const isoX = particle.x - particle.y * 0.5;
                const isoY = particle.y * 0.5 + particle.z * 0.5;

                ctx.fillStyle = particle.color;
                ctx.globalAlpha = 0.6;
                ctx.fillRect(isoX, isoY, particle.size, particle.size);
                ctx.globalAlpha = 1;
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <div className="relative h-dvh w-full overflow-hidden">
            {/* Animated Background Canvas */}
            <Image 
                src={HeroImage}
                alt="Hero Background"
                className="w-screen h-screen mb-8 absolute z-[-1] brightness-50 blur-sm"            
            />

            {/* Content Container */}
            <div className="relative z-10 h-full max-w-6xl mx-auto flex flex-col items-center justify-center px-6">
                <div className="flex flex-col items-center justify-center gap-8 p-12 rounded-3xl bg-gradient-to-br from-black/20 to-black/20 backdrop-blur-xl border-2 border-white/10 shadow-2xl max-w-3xl transform  transition-transform duration-300">
                    {/* Title with modern styling */}
                    <h1 className="text-center text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-[#FAC638] to-white bg-clip-text text-transparent leading-tight">
                        The Case of the
                        <br />
                        <span className="text-[#FAC638]">
                            Vanished Heirloom
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-center text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">
                        A frantic letter arrives at Baker Street. Lady Eleanor
                        of Wiltshire has lost her family's priceless sapphire
                        necklace, the{" "}
                        <span className="text-[#64B5F6] font-semibold">
                            Blue Serpent
                        </span>
                        . She believes it was stolen from her manor room in the
                        dead of night. Holmes is away on a mission, so you, the
                        AI detective assistant, are tasked to investigate.
                    </p>

                    {/* Input with modern styling */}
                    <div className="w-full max-w-md">
                        <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                            Your Detective Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your name..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-[#FAC638] focus:ring-2 focus:ring-[#FAC638]/50 transition-all duration-300"
                        />
                    </div>

                    {/* CTA Button */}
                    <Button
                        onClick={() => {
                            setPage(1);
                        }}
                        className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-[#FAC638] to-[#FFB74D] hover:from-[#FFB74D] hover:to-[#FAC638] text-black rounded-xl shadow-lg hover:shadow-[#FAC638]/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                        Start Investigation
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                            →
                        </span>
                    </Button>

                    {/* Feature hints */}
                    <div className="flex gap-6 mt-4 text-sm text-gray-400">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#64B5F6]"></span>
                            Isometric World
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#81C784]"></span>
                            AI Agent
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#FAC638]"></span>
                            3D Prompt Game
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
