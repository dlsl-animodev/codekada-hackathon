"use client";
import React, { useState } from "react";

// Example mock room (replace with dynamic data from story.json)
const mockRoom = {
  name: "Lady Eleanor’s Bedroom",
  description:
    "Moonlight filters through the curtains. The jewelry box sits open on the vanity — empty, save for a broken clasp.",
};

export default function Page() {
  const [message, setMessage] = useState("");
  const [storyText, setStoryText] = useState(
    "Welcome, Detective. The case awaits your keen observation..."
  );
  const [currentRoom, setCurrentRoom] = useState(mockRoom);

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: integrate Gemini agent call here
    setStoryText((prev) => prev + `\n\n> You: ${message}`);
    setMessage("");
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
              <div className="text-3xl mb-1">🔍</div>

              <h1 className="text-2xl font-heading font-bold text-yellow-100 tracking-wide mb-1 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)] [text-shadow:_1px_1px_2px_rgb(0_0_0_/_80%)]">
                {currentRoom.name}
              </h1>

              <p className="text-xs text-yellow-200/90 italic font-serif">
                "Every clue hides a whisper of truth."
              </p>
            </header>
          </div>

          {/* Wooden Border */}
          <div className="absolute inset-0 border-4 border-yellow-900/40 rounded-lg pointer-events-none" />

          {/* Scratches and Wear */}
          <div className="absolute top-4 right-8 w-12 h-0.5 bg-black/20 rotate-12" />
          <div className="absolute bottom-6 left-6 w-8 h-0.5 bg-black/20 -rotate-6" />
        </div>

        {/* Shadow under sign */}
        <div className="absolute inset-0 top-2 -z-10 bg-black/40 blur-md rounded-lg" />
      </div>

      {/* Main Scene Area */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#101010] to-[#181818] relative">
        <div className="w-[80%] h-[60vh] border-2 border-yellow-700/50 rounded-xl bg-[#111] shadow-2xl flex items-center justify-center">
          <p className="text-gray-400 italic">
            (Scene of {currentRoom.name} will appear here — rendered with
            Three.js)
          </p>
        </div>
      </main>

      {/* Story Text Area */}
      <section className="border-t border-yellow-700/40 bg-[#111] p-6 h-48 overflow-y-auto">
        <h2 className="text-xl font-heading font-semibold text-yellow-500 mb-2">
          Case Notes:
        </h2>
        <pre className="whitespace-pre-wrap font-serif text-gray-300 leading-relaxed">
          {storyText}
        </pre>
      </section>

      {/* Input Box */}
      <footer className="bg-[#1a1a1a] border-t border-yellow-700/40 p-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Type your observation or ask the AI detective..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-[#0f0f0f] text-gray-200 border border-yellow-700/40 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 placeholder-gray-500 font-sans"
        />
        <button
          onClick={handleSend}
          className="bg-yellow-600 hover:bg-yellow-700 transition text-black font-sans font-semibold px-6 py-3 rounded-lg shadow-md"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
