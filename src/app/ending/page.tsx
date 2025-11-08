import HeroImage from "../../../public/images/hero-image.jpg";
import Image from "next/image";

import Link from "next/link";
import React from "react";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/Button";

const inter = Inter({ subsets: ["latin"] });

export default function EndingPage() {
    return (
        <div
            className={`${inter.className} flex flex-col items-center justify-center min-h-screen text-center text-white px-6`}
        >
            <Image
                src={HeroImage}
                alt="Hero Background"
                className="w-screen h-screen mb-8 absolute z-[-1] brightness-50 blur-sm"
            />

            <div className="bg-gradient-to-br from-black/20 to-black/20 backdrop-blur-xl border-2 border-white/10 shadow-2xl p-6 rounded-2xl max-w-4xl flex flex-col items-center justify-center">
                <h1 className="text-center text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#FAC638] to-white bg-clip-text text-transparent leading-tight mb-2">
                    The Case of the
                    <br />
                    <span className="text-[#FAC638]">Vanished Heirloom</span>
                </h1>
                <p className="text-lg max-w-2xl leading-relaxed mb-8">
                    Congratulations, Detective! The mystery has been solved, the
                    Blue Serpent recovered, and justice restored to Lady
                    Eleanor's manor.
                </p>
                <div>
                    <h2 className="text-2xl font-semibold mb-3">
                        Thank You for Playing
                    </h2>
                    <p className="text-base text-slate-200">
                        This interactive investigation was created to showcase
                        how{" "}
                        <span className="font-medium text-blue-400">
                            AI agents
                        </span>{" "}
                        can enhance storytelling and learning through deduction,
                        reasoning, and immersive problem-solving.
                    </p>
                </div>
                <p className="mt-10 text-sm text-slate-400">
                    Built with Next.js, Three.js, and Gemini AI
                </p>
                <Link
                    href="https://github.com/dlsl-animodev/codekada-hackathon"
                    className="text-blue-600"
                >
                    {" "}
                    Github Link
                </Link>
                <p>By x-03 from De La Salle Lipa :D</p>
                <Link href={"/game"} className="mt-8">
                    <Button className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-[#FAC638] to-[#FFB74D] hover:from-[#FFB74D] hover:to-[#FAC638] text-black rounded-xl shadow-lg hover:shadow-[#FAC638]/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
                        Play Again
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                            →
                        </span>
                    </Button>
                </Link>
            </div>
        </div>
    );
}
