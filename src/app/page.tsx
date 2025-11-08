'use client';

import { Suspense } from 'react';
import GameScene from '@/components/GameScene';
import DialogueBox from '@/components/DialogueBox';
import VoiceButton from '@/components/VoiceButton';
import GameControls from '@/components/GameControls';

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* three.js canvas - isometric room scene */}
      <Suspense fallback={
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-white">loading escape room...</p>
        </div>
      }>
        <GameScene />
      </Suspense>

      {/* ui overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* dialogue box at bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <DialogueBox />
        </div>

        {/* voice button at bottom right */}
        <div className="absolute bottom-8 right-8 pointer-events-auto">
          <VoiceButton />
        </div>

        {/* game controls at top right */}
        <div className="absolute top-8 right-8 pointer-events-auto">
          <GameControls />
        </div>
      </div>
    </main>
  );
}
