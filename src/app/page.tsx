'use client';

import { useGeminiLive } from '@/hooks/useGeminiLive';

export default function Home() {
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl text-white">gemini live voice test</h1>

      <div className="w-full max-w-md space-y-4">
        {/* connection status */}
        <div className="flex gap-2">
          <button
            onClick={connect}
            disabled={isConnected}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:cursor-pointer hover:bg-green-700 disabled:bg-gray-600"
          >
            {isConnected ? 'connected' : 'connect'}
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:cursor-pointer hover:bg-red-700 disabled:bg-gray-600"
          >
            disconnect
          </button>
        </div>

        {/* voice controls */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isConnected || isProcessing}
          className={`w-full rounded-lg px-4 py-8 text-white hover:cursor-pointer ${
            isListening
              ? 'bg-red-600 hover:bg-red-700'
              : isProcessing
              ? 'bg-yellow-600'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:bg-gray-600`}
        >
          {isProcessing
            ? '⏳ ai is thinking...'
            : isListening
            ? '🎤 listening... (click to stop)'
            : '🎤 click to speak'}
        </button>

        {/* messages */}
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg bg-gray-800 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400">
              connect and start speaking to test gemini live
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-sm ${
                  msg.role === 'user' ? 'text-blue-400' : 'text-green-400'
                }`}
              >
                <span className="font-semibold">
                  {msg.role === 'user' ? 'you: ' : 'ai: '}
                </span>
                {msg.text}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}