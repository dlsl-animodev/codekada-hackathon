'use client';

import { useState } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export default function VoiceButton() {
  const { isListening, startListening, stopListening } = useVoiceInput();

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative w-16 h-16 rounded-full flex items-center justify-center
        transition-all duration-200
        ${isListening 
          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
          : 'bg-primary hover:bg-primary-dark'
        }
        hover:cursor-pointer
      `}
      aria-label={isListening ? 'stop voice input' : 'start voice input'}
    >
      {/* microphone icon */}
      <svg
        className="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>

      {/* listening indicator */}
      {isListening && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full" />
      )}
    </button>
  );
}
