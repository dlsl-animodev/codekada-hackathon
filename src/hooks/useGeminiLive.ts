"use client";

import { useEffect, useRef, useState } from "react";
import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
} from "@google/genai";

interface GeminiLiveMessage {
  role: "user" | "assistant";
  text: string;
  audio?: string;
}

// Parse API keys from environment variables
const parseApiKeys = (): string[] => {
  const keys: string[] = [];

  // Try to get comma-separated keys first
  const keysString = process.env.NEXT_PUBLIC_GEMINI_API_KEYS;
  if (keysString) {
    keys.push(
      ...keysString
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    );
  }

  // Also check individual key variables
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    keys.push(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  }
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY1) {
    keys.push(process.env.NEXT_PUBLIC_GEMINI_API_KEY1);
  }
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY2) {
    keys.push(process.env.NEXT_PUBLIC_GEMINI_API_KEY2);
  }
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY3) {
    keys.push(process.env.NEXT_PUBLIC_GEMINI_API_KEY3);
  }
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY4) {
    keys.push(process.env.NEXT_PUBLIC_GEMINI_API_KEY4);
  }

  // Remove duplicates and filter valid keys
  return [...new Set(keys)].filter((key) => key && key.length > 20);
};

const API_KEYS = parseApiKeys();

export function useGeminiLive() {
  const [messages, setMessages] = useState<GeminiLiveMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioPartsRef = useRef<string[]>([]);
  const currentTextPartsRef = useRef<string[]>([]);
  const userTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);
  const apiKeyIndexRef = useRef(0);
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // initialize gemini live session with API key rotation
  const connect = async () => {
    if (isConnectingRef.current || sessionRef.current) {
      console.log("Already connecting or connected");
      return;
    }

    if (API_KEYS.length === 0) {
      const error =
        "No valid API keys found. Please configure NEXT_PUBLIC_GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEYS";
      console.error(error);
      setConnectionError(error);
      return;
    }

    isConnectingRef.current = true;
    shouldReconnectRef.current = true;
    setConnectionError(null);
    let lastError: Error | null = null;

    // Try each API key in rotation
    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      try {
        const currentKey = API_KEYS[apiKeyIndexRef.current];
        console.log(
          `🔑 Attempting connection with API key #${
            apiKeyIndexRef.current + 1
          }/${API_KEYS.length}`
        );

        const ai = new GoogleGenAI({
          apiKey: currentKey,
        });
        const model = "models/gemini-2.0-flash-exp";

        const config = {
          responseModalities: [Modality.TEXT],
          inputAudioTranscription: {},
          systemInstruction: {
            parts: [
              {
                text: "<<SYSTEM_INSTRUCTION_START>>You are an English-only AI assistant. LANGUAGE RULE: Respond EXCLUSIVELY in English. DO NOT use Thai, Filipino, Tagalog, Chinese, Japanese, Korean, or any other language under ANY circumstances. Even if the user speaks another language, you MUST reply in English only. ALWAYS respond in English.<<SYSTEM_INSTRUCTION_END>> You are an AI detective helping solve an escape room mystery. Provide concise, immersive hints and validate player actions. Remember: ALL responses must be in English language.",
              },
            ],
          },
        };

        const session = await ai.live.connect({
          model,
          callbacks: {
            onopen: () => {
              console.log(
                `✅ Gemini live connected successfully with API key #${
                  apiKeyIndexRef.current + 1
                }`
              );
              setIsConnected(true);
              setCurrentApiKeyIndex(apiKeyIndexRef.current);
              setConnectionError(null);
            },
            onmessage: (message: LiveServerMessage) => {
              handleMessage(message);
            },
            onerror: (e: ErrorEvent) => {
              console.error("❌ Gemini live error:", e.message);
              setConnectionError(e.message);
            },
            onclose: (e: CloseEvent) => {
              console.log(`🔌 Gemini live closed: ${e.reason}`);
              setIsConnected(false);
              sessionRef.current = null;

              // If the connection closed due to invalid API key, try next key
              if (
                shouldReconnectRef.current &&
                e.reason &&
                e.reason.includes("API key")
              ) {
                console.log("🔄 API key invalid, rotating to next key...");
                apiKeyIndexRef.current =
                  (apiKeyIndexRef.current + 1) % API_KEYS.length;
                isConnectingRef.current = false;
                // Attempt reconnection with next key
                setTimeout(() => connect(), 1000);
              }
            },
          },
          config,
        });

        sessionRef.current = session;
        console.log(
          `✨ Successfully connected with API key #${
            apiKeyIndexRef.current + 1
          }`
        );
        isConnectingRef.current = false;
        return;
      } catch (error) {
        console.error(
          `❌ API key #${apiKeyIndexRef.current + 1} failed:`,
          error
        );
        lastError = error as Error;

        // Rotate to next API key
        apiKeyIndexRef.current = (apiKeyIndexRef.current + 1) % API_KEYS.length;

        // If we've tried all keys, throw error
        if (attempt === API_KEYS.length - 1) {
          isConnectingRef.current = false;
          const errorMsg = `All ${API_KEYS.length} API keys failed. Last error: ${lastError?.message}`;
          console.error(errorMsg);
          setConnectionError(errorMsg);
          throw new Error(errorMsg);
        }
      }
    }

    isConnectingRef.current = false;
  };

  // handle messages from gemini
  const handleMessage = (message: LiveServerMessage) => {
    console.log("received message from gemini:", message);

    if (message.toolCall?.functionCalls) {
      console.log("received tool call");
    }

    if (message.serverContent?.modelTurn?.parts) {
      const parts = message.serverContent.modelTurn.parts;
      const part = parts[0];

      if (part?.text) {
        currentTextPartsRef.current.push(part.text);
      }

      if (part?.inlineData) {
        console.log(
          "received audio chunk, mime type:",
          part.inlineData.mimeType
        );
        currentAudioPartsRef.current.push(part.inlineData.data!);
      }
    }

    // check if turn is complete
    if (message.serverContent?.turnComplete) {
      setIsProcessing(false);

      if (currentTextPartsRef.current.length > 0) {
        const fullText = currentTextPartsRef.current.join("");

        setMessages((prev) => [...prev, { role: "assistant", text: fullText }]);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: fullText },
        ]);

        // speak the ai's response
        speakText(fullText);

        currentTextPartsRef.current = [];
      }

      if (currentAudioPartsRef.current.length > 0) {
        playAudioChunks(currentAudioPartsRef.current);
        currentAudioPartsRef.current = [];
      }
    }
  };

  // speak text using Web Speech API
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('speech synthesis not available');
      return;
    }

    // stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // configure voice settings for a detective character here!
    utterance.rate = 0.95; // slightly slower for dramatic effect
    utterance.pitch = 0.9; // slightly lower pitch for gravitas
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    // male dEep voice for detective
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.lang.startsWith('en') && voice.name.includes('Male')
    ) || voices.find(voice => voice.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('speech synthesis error:', event);
      setIsSpeaking(false);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // stop speaking
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // play collected audio chunks
  const playAudioChunks = (audioParts: string[]) => {
    try {
      // convert pcm to wav
      const pcmData = audioParts.map((part) => {
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
      pcmData.forEach((data) => {
        combinedData.set(data, offset);
        offset += data.length;
      });

      const audioBlob = new Blob([combinedData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onerror = (e) => console.error("audio playback error:", e);
      audio.play().catch((err) => console.error("failed to play audio:", err));
    } catch (error) {
      console.error("failed to process audio:", error);
    }
  };

  // create wav header
  const createWavHeader = (
    dataLength: number,
    sampleRate: number,
    numChannels: number,
    bitsPerSample: number
  ): Uint8Array => {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
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
      userTranscriptRef.current = "";

      // Web Speech API for now since Gemini Live Transcription is not working
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript;
              }
            }
            if (transcript) {
              userTranscriptRef.current = transcript;
            }
          };

          recognition.onerror = (event: any) => {
            console.error("speech recognition error:", event.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } else {
          console.warn("web speech api not available");
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        await sendAudioToGemini(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("failed to start recording:", error);
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
      console.error("no session available");
      return;
    }

    console.log("sending audio to gemini, size:", audioBlob.size);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = (reader.result as string).split(",")[1];

      const displayText = userTranscriptRef.current || "[voice input]";

      // add user message with transcription
      setMessages((prev) => [
        ...prev,
        { role: "user" as const, text: displayText },
      ]);

      sessionRef.current?.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "audio/webm",
                  data: base64Audio,
                },
              },
            ],
          },
        ],
      });
    };
    reader.readAsDataURL(audioBlob);
  };

  // send text message
  const sendText = (text: string) => {
    if (!sessionRef.current) return;

    setMessages((prev) => [...prev, { role: "user", text }]);

    // add language reminder to help enforce english responses
    const messageWithReminder = `[RESPOND IN ENGLISH ONLY] ${text}`;

    sessionRef.current.sendClientContent({
      turns: [messageWithReminder],
    });
  };

  // disconnect session
  const disconnect = () => {
    shouldReconnectRef.current = false;
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
    // stop any ongoing speech
    stopSpeaking();
  };

  // Test connection on mount
  useEffect(() => {
    console.log(`🚀 Found ${API_KEYS.length} API key(s) configured`);

    // Auto-connect for testing
    const timer = setTimeout(() => {
      if (!sessionRef.current && !isConnectingRef.current) {
        console.log("🔌 Auto-connecting for testing...");
        connect();
      }
    }, 1000);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      clearTimeout(timer);
      shouldReconnectRef.current = false;
      disconnect();
    };
  }, []);

  return {
    messages,
    isConnected,
    isListening,
    isProcessing,
    currentApiKeyIndex,
    connectionError,
    totalApiKeys: API_KEYS.length,
    isSpeaking,
    connect,
    disconnect,
    startListening,
    stopListening,
    stopSpeaking,
    sendText,
  };
}
