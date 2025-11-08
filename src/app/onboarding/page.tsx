"use client";

import HEROIMAGE from "../../../public/images/hero-image.jpg";
import Image from "next/image";
import Link from "next/link";
import { useUsername } from "../../../hooks/use-username";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
    const { username, setUsername } = useUsername();

    return (
        <div className="h-dvh max-w-5xl mx-auto flex flex-col items-center justify-center">
            <Image
                src={HEROIMAGE}
                alt="Hero Image"
                width={600}
                height={400}
                className="absolute w-[100dvw] h-[100dvh] z-[-1] object-cover object-center brightness-50"
            />

            <div className="flex flex-col h-fit items-center justify-center gap-6 bg-black/20 backdrop-blur-sm p-10 rounded-2xl shadow border-white/20 border">
                <h1 className="text-center text-6xl font-semibold">
                    The Case of the Vanished Heirloom
                </h1>
                <p className="text-center text-xl">
                    A frantic letter arrives at Baker Street. Lady Eleanor of
                    Wiltshire has lost her family's priceless sapphire necklace
                    — the Blue Serpent. She believes it was stolen from her
                    manor room in the dead of night. Holmes is away on a
                    mission, so you, the AI detective assistant, are tasked to
                    investigate.
                </p>

                <input
                    type="text"
                    placeholder="Enter your detective name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-4 py-2 rounded w-80 text-black focus:outline-none focus:ring-2 focus:ring-[#FAC638]"
                />

                <Link href={"/"}>
                    <Button>Start Solving</Button>
                </Link>
            </div>
        </div>
    );
}
