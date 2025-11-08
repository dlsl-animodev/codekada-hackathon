'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setResponse(data.text || data.error);
    } catch (error) {
      setResponse('error connecting to api');
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl text-white">gemini api test</h1>

      <div className="w-full max-w-md space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask something..."
          className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white hover:cursor-text"
          onKeyDown={(e) => e.key === 'Enter' && testAPI()}
        />

        <button
          onClick={testAPI}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:cursor-pointer hover:bg-blue-700 disabled:bg-gray-600"
        >
          {loading ? 'loading...' : 'send'}
        </button>

        {response && (
          <div className="rounded-lg bg-gray-800 p-4 text-white">
            {response}
          </div>
        )}
      </div>
    </main>
  );
}