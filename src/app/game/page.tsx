"use client";

import React, { useState, useEffect } from "react";
import { useGeminiLive } from "@/hooks/useGeminiLive";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";

const mockRoom = {
    name: "Lady Eleanor's Bedroom",
    description:
        "Moonlight filters through the curtains. The jewelry box sits open on the vanity  empty, save for a broken clasp.",
};

export default function Page() {
    const [message, setMessage] = useState("");
    const [currentRoom, setCurrentRoom] = useState(mockRoom);
    const {
        messages,
        isConnected,
        isListening,
        isProcessing,
        connect,
        disconnect,
        startListening,
        stopListening,
        sendText,
    } = useGeminiLive();

    useEffect(() => {
        connect();
        return () => disconnect();
    }, []);

    const handleSend = () => {
        if (!message.trim()) return;
        sendText(message);
        setMessage("");
    };

    const toggleVoice = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-gray-100">
            {/* Header */}
            <div className="relative mx-auto my-3 max-w-2xl">
                {/* Wooden Tavern Sign */}
                <div className="relative bg-gradient-to-br from-amber-800 via-yellow-800 to-amber-900 rounded-lg shadow-[0_8px_16px_rgba(0,0,0,0.6)] transform hover:rotate-1 transition-transform duration-300">
                    {/* Wood Grain Texture */}
                    <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />

                    {/* Worn Edges */}
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-lg" />

                    {/* Metal Corner Brackets */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-l-4 border-t-4 border-gray-800 rounded-tl" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-r-4 border-t-4 border-gray-800 rounded-tr" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-l-4 border-b-4 border-gray-800 rounded-bl" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-r-4 border-b-4 border-gray-800 rounded-br" />

                    {/* Content */}
                    <div className="relative px-6 py-4">
                        <header className="text-center">
                            <div className="text-3xl mb-1"></div>
                            <h1 className="text-2xl font-heading font-bold text-yellow-100 tracking-wide mb-1 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)] [text-shadow:_1px_1px_2px_rgb(0_0_0_/_80%)]">
                                {currentRoom.name}
                            </h1>
                            <p className="text-xs text-yellow-200/90 italic font-serif">
                                "Every clue hides a whisper of truth."
                            </p>
                        </header>
                    </div>
                    <div className="absolute inset-0 border-4 border-yellow-900/40 rounded-lg pointer-events-none" />
                    <div className="absolute top-4 right-8 w-12 h-0.5 bg-black/20 rotate-12" />
                    <div className="absolute bottom-6 left-6 w-8 h-0.5 bg-black/20 -rotate-6" />
                </div>
                <div className="absolute inset-0 top-2 -z-10 bg-black/40 blur-md rounded-lg" />
            </div>

            {/* Main Scene Area */}
            <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#101010] to-[#181818] relative">
                <Canvas>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Suspense fallback={null}>
                        {/* 3D Room Model would go here */}
                        {/* For now, just render a placeholder box. */}
                        <mesh>
                            <boxGeometry args={[2, 2, 2]} />
                            <meshStandardMaterial color="orange" />
                        </mesh>
                    </Suspense>
                    <OrbitControls />
                </Canvas>
            </main>

            {/* Story Text Area */}
            <section className="border-t border-yellow-700/40 bg-[#111] p-6 h-48 overflow-y-auto">
                <h2 className="text-xl font-semibold text-yellow-500 mb-2">
                    Case Notes:
                </h2>
                <div className="space-y-3">
                    {messages.length === 0 ? (
                        <p className="text-gray-400 italic">
                            {isConnected
                                ? "AI detective is ready. Start asking questions or use voice..."
                                : "Connecting to AI detective..."}
                        </p>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className="leading-relaxed">
                                {msg.role === "user" ? (
                                    <p className="text-blue-400">
                                        <span className="font-semibold">
                                            You:
                                        </span>{" "}
                                        {msg.text}
                                    </p>
                                ) : (
                                    <p className="text-gray-300">
                                        <span className="font-semibold text-yellow-500">
                                            AI Detective:
                                        </span>{" "}
                                        {msg.text}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                    {isProcessing && (
                        <p className="text-yellow-500 italic animate-pulse">
                            AI detective is thinking...
                        </p>
                    )}
                </div>
            </section>

            {/* Input Box */}
            <footer className="bg-[#1a1a1a] border-t border-yellow-700/40 p-4 flex items-center gap-3">
                <button
                    onClick={toggleVoice}
                    disabled={!isConnected || isProcessing}
                    className={
                        "px-4 py-3 rounded-lg font-semibold transition hover:cursor-pointer " +
                        (isListening
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : isProcessing
                            ? "bg-yellow-600 text-black"
                            : "bg-blue-600 hover:bg-blue-700 text-white") +
                        " disabled:bg-gray-600 disabled:cursor-not-allowed"
                    }
                >
                    {isProcessing ? "" : isListening ? " Stop" : " Voice"}
                </button>

                <input
                    type="text"
                    placeholder="Type your observation or ask the AI detective..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 bg-[#0f0f0f] text-gray-200 border border-yellow-700/40 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 placeholder-gray-500 hover:cursor-text"
                />

                <button
                    onClick={handleSend}
                    disabled={!isConnected || !message.trim()}
                    className="bg-yellow-600 hover:bg-yellow-700 transition text-black font-semibold px-6 py-3 rounded-lg shadow-md hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </footer>
        </div>
    );
}