'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality, Session } from '@google/genai';

interface GeminiLiveMessage {
  role: 'user' | 'assistant';
  text: string;
  audio?: string;
}

export function useGeminiLive() {
  const [messages, setMessages] = useState<GeminiLiveMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioPartsRef = useRef<string[]>([]);

  // initialize gemini live session
  const connect = async () => {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      });

      const model = 'models/gemini-2.0-flash-exp';

      const config = {
        responseModalities: [Modality.TEXT],
      };

      const session = await ai.live.connect({
        model,
        callbacks: {
          onopen: () => {
            console.log('gemini live connected');
            setIsConnected(true);
          },
          onmessage: (message: LiveServerMessage) => {
            handleMessage(message);
          },
          onerror: (e: ErrorEvent) => {
            console.error('gemini live error:', e.message);
          },
          onclose: (e: CloseEvent) => {
            console.log('gemini live closed:', e.reason);
            setIsConnected(false);
          },
        },
        config,
      });

      sessionRef.current = session;
    } catch (error) {
      console.error('failed to connect to gemini live:', error);
    }
  };

  // handle messages from gemini
  const handleMessage = (message: LiveServerMessage) => {
    console.log('received message from gemini:', message);

    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent.modelTurn.parts[0];

      if (part?.text) {
        console.log('received text:', part.text);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: part.text! },
        ]);
      }

      if (part?.inlineData) {
        console.log('received audio chunk, mime type:', part.inlineData.mimeType);
        currentAudioPartsRef.current.push(part.inlineData.data!);
      }
    }

    // check if turn is complete
    if (message.serverContent?.turnComplete) {
      console.log('turn complete, playing audio');
      setIsProcessing(false);

      if (currentAudioPartsRef.current.length > 0) {
        playAudioChunks(currentAudioPartsRef.current);
        currentAudioPartsRef.current = [];
      }
    }
  };

  // play collected audio chunks
  const playAudioChunks = (audioParts: string[]) => {
    try {
      // convert pcm to wav
      const pcmData = audioParts.map(part => {
        const binary = atob(part);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      });

      const totalLength = pcmData.reduce((sum, arr) => sum + arr.length, 0);
      const wavHeader = createWavHeader(totalLength, 24000, 1, 16);

      const combinedData = new Uint8Array(wavHeader.length + totalLength);
      combinedData.set(wavHeader, 0);

      let offset = wavHeader.length;
      pcmData.forEach(data => {
        combinedData.set(data, offset);
        offset += data.length;
      });

      const audioBlob = new Blob([combinedData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onerror = (e) => console.error('audio playback error:', e);
      audio.play().catch(err => console.error('failed to play audio:', err));
    } catch (error) {
      console.error('failed to process audio:', error);
    }
  };

  // create wav header
  const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number): Uint8Array => {
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    return new Uint8Array(buffer);
  };

  // convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // start voice recording
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToGemini(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('failed to start recording:', error);
    }
  };

  // stop voice recording
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setIsProcessing(true);
    }
  };

  // send audio to gemini
  const sendAudioToGemini = async (audioBlob: Blob) => {
    if (!sessionRef.current) {
      console.error('no session available');
      return;
    }

    console.log('sending audio to gemini, size:', audioBlob.size);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = (reader.result as string).split(',')[1];

      console.log('sending audio data to gemini');

      sessionRef.current?.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64Audio,
                },
              },
            ],
          },
        ],
      });

      setMessages((prev) => [...prev, { role: 'user', text: '[voice message sent]' }]);
    };
    reader.readAsDataURL(audioBlob);
  };

  // send text message
  const sendText = (text: string) => {
    if (!sessionRef.current) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);

    sessionRef.current.sendClientContent({
      turns: [text],
    });
  };

  // disconnect session
  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    messages,
    isConnected,
    isListening,
    isProcessing,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
  };
}