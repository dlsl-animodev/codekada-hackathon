"use client";

import { Dispatch } from "react";
import { SetStateAction } from "react";
import { Button } from "../ui/Button";
import Link from "next/link";
import GameImage from "../../../public/images/game-image.png";
import Image from "next/image";

interface SecondPageProps {
    setPage: Dispatch<SetStateAction<number>>;
}

export default function SecondPage({ setPage }: SecondPageProps) {
    return (
        <div className="flex flex-col items-center justify-center h-dvh gap-10 mx-10">
            <Image
                src={GameImage}
                alt="Game Illustration"
                className="w-screen h-screen mb-8 absolute z-[-1] brightness-50 blur-sm"
            />

            <h1 className="bg-gradient-to-r from-white via-[#FAC638] to-white bg-clip-text text-transparent font-bold leading-tight text-6xl">
                Here are the instructions to solve the case!
            </h1>
            <ul className="grid grid-cols-3 gap-6">
                <InstructionItem number="1">
                    In this game, you control the AI agent by giving it
                    instructions, either through text or voice.
                </InstructionItem>
                <InstructionItem number="2">
                    Based on your commands, the AI will analyze the situation
                    and perform the corresponding actions in real time.
                </InstructionItem>
                <InstructionItem number="3">
                    Your goal is to solve the missing jewelry case by commanding
                    the AI agent on what to inspect
                </InstructionItem>
            </ul>
            <Link href={"/game"}>
                <Button
                    onClick={() => {
                        setPage(1);
                    }}
                    className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-[#FAC638] to-[#FFB74D] hover:from-[#FFB74D] hover:to-[#FAC638] text-black rounded-xl shadow-lg hover:shadow-[#FAC638]/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                    Let's Begin!
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                        →
                    </span>
                </Button>
            </Link>
        </div>
    );
}

interface InstructionItem {
    number: string;
    children: string;
}

function InstructionItem({ number, children }: InstructionItem) {
    return (
        <li className="flex items-center gap-10 bg-white/10 border-white/20 text-wihte placeholder-gray-400 border rounded-2xl py-6 px-12">
            <div className="text-neutral-500 font-extrabold text-lg">
                {number}
            </div>
            <p className="text-xl font-medium">{children}</p>
        </li>
    );
}
