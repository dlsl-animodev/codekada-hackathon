"use client";

import { useEffect, useRef, useState } from "react";
import { World } from "@/hooks/world";
import {
  GoogleGenAI,
  LiveConnectConfig,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
  Type,
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
  const [detectiveThought, setDetectiveThought] = useState<{
    thought: string;
    priority: string;
  } | null>({
    thought: "the room is dark... i should look around and find a way to light the campfire",
    priority: "medium"
  });

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
  const toolCallbacksRef = useRef<Map<string, (args: any) => any>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

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
        const model = "models/gemini-2.5-flash-native-audio-preview-09-2025";

        const config: LiveConnectConfig = {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: {
            parts: [
              {
                text: "<<SYSTEM_INSTRUCTION_START>>You are an English-only AI assistant. LANGUAGE RULE: Respond EXCLUSIVELY in English. DO NOT use Thai, Filipino, Tagalog, Chinese, Japanese, Korean, or any other language under ANY circumstances. Even if the user speaks another language, you MUST reply in English only. ALWAYS respond in English.<<SYSTEM_INSTRUCTION_END>> You are an AI detective helping solve an escape room mystery. Provide concise, immersive hints and validate player actions. Remember: ALL responses must be in English language.\n\nYou will also receive a WORLD_SNAPSHOT enclosed between [[WORLD_SNAPSHOT_START]] and [[WORLD_SNAPSHOT_END]]. It is a compact JSON representation of the current 3D scene graph (named objects, types, positions, rotations, scales, and colors). use this snapshot to reason about the world, reference objects by their names, and avoid inventing objects that are not present. if an object is missing from the snapshot, ask for clarification.\n\nYou have access to tools that allow you to interact with the game world. Use these tools to help the player solve puzzles and progress through the mystery.\n\nIMPORTANT: After each user interaction, call the 'updateDetectiveThoughts' tool to share your current thinking, observations, and deductions with the player. This helps create an immersive detective experience where the player can see your thought process.",
              },
            ],
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "getSceneSnapshot",
                  description: "get a complete snapshot of all objects in the scene with their positions, rotations, scales, and colors. use this to understand the current state of the world.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {},
                  },
                },
                {
                  name: "getObjectInfo",
                  description: "get detailed information about a specific object including its position, rotation, scale, and color.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      objectName: {
                        type: Type.STRING,
                        description: "the name of the object to query (e.g., 'bed', 'desk', 'drawer', 'campfire', 'player')",
                      },
                    },
                    required: ["objectName"],
                  },
                },
                {
                  name: "getPlayerPosition",
                  description: "get the current position of the player character in the scene.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {},
                  },
                },
                {
                  name: "listSceneObjects",
                  description: "get a list of all named objects in the scene with their basic information. useful for discovering what's available to interact with.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {},
                  },
                },
                {
                  name: "changeObjectColor",
                  description: "change the color of an object in the scene. use this when the player asks to change colors or when solving color-based puzzles.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      objectName: {
                        type: Type.STRING,
                        description: "the name of the object to change (e.g., 'bed', 'desk', 'drawer', 'campfire')",
                      },
                      color: {
                        type: Type.STRING,
                        description: "the color to change to (e.g., 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan', 'white', 'black', 'gold', 'silver')",
                      },
                    },
                    required: ["objectName", "color"],
                  },
                },
                {
                  name: "rotateObject",
                  description: "rotate an object in the scene. use this to flip, spin, or turn objects when investigating clues.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      objectName: {
                        type: Type.STRING,
                        description: "the name of the object to rotate",
                      },
                      action: {
                        type: Type.STRING,
                        description: "the rotation action: 'flip' for 180 degrees, 'spin' for 360 degrees, 'reset' to return to original position",
                      },
                    },
                    required: ["objectName", "action"],
                  },
                },
                {
                  name: "movePlayer",
                  description: "move the player character to a specific location or object in the scene.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      target: {
                        type: Type.STRING,
                        description: "the target location or object name (e.g., 'bed', 'desk', 'drawer', 'campfire', or coordinates like '0,0,0')",
                      },
                    },
                    required: ["target"],
                  },
                },
                {
                  name: "inspectObject",
                  description: "get detailed information about an object in the scene. use this to provide clues or descriptions.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      objectName: {
                        type: Type.STRING,
                        description: "the name of the object to inspect",
                      },
                    },
                    required: ["objectName"],
                  },
                },
                {
                  name: "unlockClue",
                  description: "reveal a clue or puzzle piece to the player when they discover something important.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      clueId: {
                        type: Type.STRING,
                        description: "the identifier for the clue being unlocked",
                      },
                      clueText: {
                        type: Type.STRING,
                        description: "the text of the clue to reveal",
                      },
                    },
                    required: ["clueId", "clueText"],
                  },
                },
                {
                  name: "pickupObject",
                  description: "pick up an object from the scene and add it to the player's inventory. this will make the object invisible.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      objectName: {
                        type: Type.STRING,
                        description: "the name of the object to pick up (e.g., 'match')",
                      },
                    },
                    required: ["objectName"],
                  },
                },
                {
                  name: "lightCampfire",
                  description: "light the campfire using a match. the player must have picked up the match first. this will make the campfire and fire visible.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {},
                  },
                },
                {
                  name: "checkInventory",
                  description: "check what items the player is currently carrying in their inventory.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {},
                  },
                },
                {
                  name: "updateDetectiveThoughts",
                  description: "update the detective's current thoughts about the case based on observations, clues discovered, and the current situation. call this after processing user messages to share your reasoning and deductions with the player.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      thought: {
                        type: Type.STRING,
                        description: "the detective's current thought or deduction about the case (e.g., 'the broken clasp suggests forced entry...', 'the campfire placement is unusual...')",
                      },
                      priority: {
                        type: Type.STRING,
                        description: "the importance level of this thought: 'low', 'medium', 'high', or 'critical'",
                      },
                    },
                    required: ["thought", "priority"],
                  },
                },
              ],
            },
          ],
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

    if (message.serverContent?.outputTranscription) {
      const transcription = message.serverContent.outputTranscription;
      console.log("received output transcription:", transcription);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: transcription.text || "" },
      ]);
    }

    // handle tool calls
    if (message.toolCall?.functionCalls) {
      console.log("received tool call:", message.toolCall.functionCalls);

      const functionCalls = message.toolCall.functionCalls;
      const functionResponses = functionCalls.map((call) => {
        const functionName = call.name || "unknown";
        const args = call.args;

        console.log(`executing tool: ${functionName}`, args);

        // handle updateDetectiveThoughts specially (internal state)
        if (functionName === "updateDetectiveThoughts") {
          const { thought, priority } = args as { thought: string; priority: string };
          setDetectiveThought({ thought, priority });
          return {
            id: call.id,
            name: functionName,
            response: { success: true, message: `thought updated: ${thought}` },
          };
        }

        // get the registered callback for this tool
        const callback = toolCallbacksRef.current.get(functionName);

        if (callback) {
          try {
            const result = callback(args);
            console.log(`tool ${functionName} result:`, result);
            return {
              id: call.id,
              name: functionName,
              response: result,
            };
          } catch (error) {
            console.error(`error executing tool ${functionName}:`, error);
            return {
              id: call.id,
              name: functionName,
              response: { error: String(error) },
            };
          }
        } else {
          console.warn(`no callback registered for tool: ${functionName}`);
          return {
            id: call.id,
            name: functionName,
            response: { error: "tool not implemented" },
          };
        }
      });

      // send the function responses back to gemini
      if (sessionRef.current && functionResponses.length > 0) {
        sessionRef.current.sendToolResponse({
          functionResponses,
        });
      }
    }

    if (message.serverContent?.modelTurn?.parts) {
      const parts = message.serverContent.modelTurn.parts;

      for (const part of parts) {
        if (part?.text) {
          console.log("received text part:", part.text);
          currentTextPartsRef.current.push(part.text);
        }

        if (part?.inlineData) {
          console.log(
            "received audio chunk, mime type:",
            part.inlineData.mimeType
          );
          // play audio chunk immediately as it arrives
          playAudioChunkStreaming(part.inlineData.data!);
        }
      }
    }

    // check if turn is complete
    if (message.serverContent?.turnComplete) {
      setIsProcessing(false);

      if (currentTextPartsRef.current.length > 0) {
        const fullText = currentTextPartsRef.current.join("");
        console.log("turn complete, full text:", fullText);

        setMessages((prev) => [...prev, { role: "assistant", text: fullText }]);

        currentTextPartsRef.current = [];
      }

      if (currentAudioPartsRef.current.length > 0) {
        playAudioChunks(currentAudioPartsRef.current);
        currentAudioPartsRef.current = [];
      }
    }
  };
  
  // stop speaking
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    // also stop web audio playback
    if (audioContextRef.current) {
      audioQueueRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // already stopped
        }
      });
      audioQueueRef.current = [];
      nextPlayTimeRef.current = 0;
    }
  };

  // initialize audio context
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // play individual audio chunk immediately (streaming)
  const playAudioChunkStreaming = async (base64Audio: string) => {
    try {
      const audioContext = getAudioContext();
      
      // decode base64 to pcm data
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // convert pcm to audio buffer - use correct sample rate (24000 Hz)
      const pcmData = new Int16Array(bytes.buffer);
      const sampleRate = 24000; // must match gemini's output sample rate
      const audioBuffer = audioContext.createBuffer(1, pcmData.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // simple conversion without interpolation for speed
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0; // normalize to -1 to 1
      }

      // create source and schedule playback
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // schedule this chunk to play after the previous one
      const currentTime = audioContext.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);
      
      // set speaking state when first chunk starts playing
      if (audioQueueRef.current.length === 0) {
        setIsSpeaking(true);
      }
      
      source.start(startTime);
      audioQueueRef.current.push(source);

      // update next play time
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      // clean up finished sources
      source.onended = () => {
        const index = audioQueueRef.current.indexOf(source);
        if (index > -1) {
          audioQueueRef.current.splice(index, 1);
        }
        
        // stop speaking when all audio chunks are done
        if (audioQueueRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };

    } catch (error) {
      console.error("failed to play audio chunk:", error);
    }
  };

  // play collected audio chunks (fallback for compatibility)
  const playAudioChunks = (audioParts: string[]) => {
    console.log("playing audio chunks:", audioParts.length, "parts");
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
      // use 24000 Hz to match gemini's output sample rate
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
              { text: World.getSnapshotText() },
              { text: `[RESPOND IN ENGLISH ONLY] ${displayText}` },
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
      turns: [
        {
          role: "user",
          parts: [
            { text: World.getSnapshotText() },
            { text: messageWithReminder },
          ],
        },
      ],
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

  // register a tool callback
  const registerTool = (name: string, callback: (args: any) => any) => {
    console.log(`registering tool: ${name}`);
    toolCallbacksRef.current.set(name, callback);
  };

  // unregister a tool callback
  const unregisterTool = (name: string) => {
    console.log(`unregistering tool: ${name}`);
    toolCallbacksRef.current.delete(name);
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
    detectiveThought,
    connect,
    disconnect,
    startListening,
    stopListening,
    stopSpeaking,
    sendText,
    registerTool,
    unregisterTool,
  };
}
