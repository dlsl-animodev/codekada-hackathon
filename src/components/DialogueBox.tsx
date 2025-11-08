'use client';

import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameState';

export default function DialogueBox() {
  const [input, setInput] = useState('');
  const { messages, addMessage, isAiTyping } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // add user message
    addMessage({ role: 'user', content: input });
    setInput('');

    // send to ai api (placeholder)
    // this will be implemented with the useGeminiAI hook
  };

  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 w-[600px] max-h-[300px] flex flex-col">
      {/* messages display */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.slice(-5).map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm ${
              msg.role === 'user' 
                ? 'text-blue-400' 
                : 'text-green-400'
            }`}
          >
            <span className="font-semibold">
              {msg.role === 'user' ? 'You: ' : 'AI Guide: '}
            </span>
            {msg.content}
          </div>
        ))}
        {isAiTyping && (
          <div className="text-sm text-green-400 italic">
            AI Guide is thinking...
          </div>
        )}
      </div>

      {/* input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type your message or use voice..."
          className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-primary hover:cursor-text"
        />
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark px-4 py-2 rounded text-sm font-medium transition-colors hover:cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}
