'use client';

import { useGameStore } from '@/hooks/useGameState';

export default function GameControls() {
  const { resetGame } = useGameStore();

  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-semibold text-white mb-2">controls</h3>
      
      <div className="text-xs text-white/70 space-y-1">
        <p>• click objects to interact</p>
        <p>• drag to rotate camera</p>
        <p>• scroll to zoom</p>
        <p>• use voice or text to talk to ai</p>
      </div>

      <button
        onClick={resetGame}
        className="w-full mt-4 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded text-xs text-white transition-colors hover:cursor-pointer"
      >
        Reset Game
      </button>
    </div>
  );
}
