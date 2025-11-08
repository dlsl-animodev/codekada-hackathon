import Link from "next/link";
import React from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function EndingPage() {
  return (
    <div
      className={`${inter.className} flex flex-col items-center justify-center min-h-screen bg-black text-center text-white px-6`}
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-6">
        🕵️ The Case of the Vanished Heirloom
      </h1>
      <p className="text-lg max-w-2xl leading-relaxed mb-8">
        Congratulations, Detective! The mystery has been solved, the Blue
        Serpent recovered, and justice restored to Lady Eleanor's manor.
      </p>
      <div className="bg-slate-700/40 p-6 rounded-2xl shadow-lg max-w-lg">
        <h2 className="text-2xl font-semibold mb-3">Thank You for Playing</h2>
        <p className="text-base text-slate-200">
          This interactive investigation was created to showcase how{" "}
          <span className="font-medium text-blue-400">AI agents</span> can
          enhance storytelling and learning through deduction, reasoning, and
          immersive problem-solving.
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
    </div>
  );
}
