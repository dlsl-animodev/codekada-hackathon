"use client";

import { Button } from "@/components/ui/Button";
import HEROIMAGE from "../../../public/images/hero-image.jpg";
import Image from "next/image";
import Link from "next/link";
import { useUsername } from "../../../hooks/use-username";

export default function EndScreenPage() {
    const { username } = useUsername();

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
                    You Solved the Case, {username}!
                </h1>
                <p className="text-center text-xl">
                    With your keen eye for detail and excellent communication
                    skills, the mystery of the Blue Serpent has been solved. The
                    culprit has been caught, and Lady Eleanor's heirloom is safe
                    once more. Another triumph for the AI Detective.
                </p>

                <div className="flex flex-col gap-2 items-center">
                    <p className="text-neutral-500">Want to try again?</p>
                    <Link href={"/"}>
                        <Button>Play Again</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
