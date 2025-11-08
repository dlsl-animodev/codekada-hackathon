"use client";


import React, { useState, useEffect, Suspense, useRef } from "react";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SceneCanvas from "@/components/game/scene-canvas";
import { World } from "@/hooks/world";
import * as THREE from "three";

const mockRoom = {
  name: "Lady Eleanor's Bedroom",
  description:
    "Moonlight filters through the curtains. The jewelry box sits open on the vanity empty, save for a broken clasp.",
};

export default function Page() {
  const [message, setMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState(mockRoom);
  const [inventory, setInventory] = useState<string[]>([]);
  const playerRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isConnected,
    isListening,
    isProcessing,
    isSpeaking,
    detectiveThought,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
    stopSpeaking,
    registerTool,
    unregisterTool,
  } = useGeminiLive();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  // register tool callbacks for gemini to use
  useEffect(() => {
    if (!isConnected) return;

    // helper function to get color hex value
    const getColorHex = (colorName: string): string => {
      const colorMap: { [key: string]: string } = {
        red: "#ff0000",
        blue: "#0066ff",
        green: "#00ff00",
        yellow: "#ffff00",
        orange: "#ff8800",
        purple: "#9900ff",
        pink: "#ff69b4",
        cyan: "#00ffff",
        white: "#ffffff",
        black: "#000000",
        gold: "#ffd700",
        silver: "#c0c0c0",
        brown: "#8b7355",
      };
      return colorMap[colorName.toLowerCase()] || colorName;
    };

    // tool: get scene snapshot
    registerTool("getSceneSnapshot", () => {
      console.log("tool called: getSceneSnapshot()");
      const snapshot = World.getSnapshot();
      return {
        success: true,
        objectCount: snapshot.length,
        objects: snapshot,
      };
    });

    // tool: get object info
    registerTool("getObjectInfo", ({ objectName }: { objectName: string }) => {
      console.log(`tool called: getObjectInfo(${objectName})`);

      const obj = World.getObjectByLabel(objectName.toLowerCase());
      if (!obj) {
        return { success: false, message: `object '${objectName}' not found in world` };
      }

      const pos = new THREE.Vector3();
      const rot = new THREE.Euler();
      const scl = new THREE.Vector3();
      obj.getWorldPosition(pos);
      obj.getWorldQuaternion(new THREE.Quaternion());
      obj.getWorldScale(scl);

      let colorHex: string | undefined;
      if ((obj as any).isMesh && (obj as any).material) {
        const materials = Array.isArray((obj as any).material) ? (obj as any).material : [(obj as any).material];
        const matWithColor = materials.find((m: any) => m && m.color);
        if (matWithColor && matWithColor.color) {
          colorHex = "#" + matWithColor.color.getHexString();
        }
      }

      return {
        success: true,
        objectName,
        type: obj.type,
        position: [pos.x, pos.y, pos.z],
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
        scale: [scl.x, scl.y, scl.z],
        color: colorHex,
      };
    });

    // tool: get player position
    registerTool("getPlayerPosition", () => {
      console.log("tool called: getPlayerPosition()");

      if (!playerRef.current) {
        return { success: false, message: "player not available" };
      }

      const playerObj = playerRef.current.getObject3D?.();
      if (!playerObj) {
        return { success: false, message: "player object not available" };
      }

      const pos = new THREE.Vector3();
      playerObj.getWorldPosition(pos);

      return {
        success: true,
        position: [pos.x, pos.y, pos.z],
      };
    });

    // tool: list scene objects
    registerTool("listSceneObjects", () => {
      console.log("tool called: listSceneObjects()");
      const snapshot = World.getSnapshot();
      const namedObjects = snapshot.filter(obj => obj.name && obj.name.length > 0);

      return {
        success: true,
        count: namedObjects.length,
        objects: namedObjects.map(obj => ({
          name: obj.name,
          type: obj.type,
          position: obj.position,
        })),
      };
    });

    // tool: change object color
    registerTool("changeObjectColor", ({ objectName, color }: { objectName: string; color: string }) => {
      console.log(`tool called: changeObjectColor(${objectName}, ${color})`);

      const obj = World.getObjectByLabel(objectName.toLowerCase());
      if (!obj) {
        return { success: false, message: `object '${objectName}' not found in world` };
      }

      const colorValue = getColorHex(color);

      // apply color to mesh material
      if ((obj as any).isMesh && (obj as any).material) {
        const materials = Array.isArray((obj as any).material) ? (obj as any).material : [(obj as any).material];
        materials.forEach((mat: any) => {
          if (mat && mat.color) {
            mat.color.set(colorValue);
          }
        });
        return { success: true, message: `changed ${objectName} to ${color}` };
      }

      // if object is a group, try to find meshes in children
      let changed = false;
      obj.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat && mat.color) {
              mat.color.set(colorValue);
              changed = true;
            }
          });
        }
      });

      if (changed) {
        return { success: true, message: `changed ${objectName} to ${color}` };
      }

      return { success: false, message: `could not change color of ${objectName}` };
    });

    // tool: rotate object
    registerTool("rotateObject", ({ objectName, action }: { objectName: string; action: string }) => {
      console.log(`tool called: rotateObject(${objectName}, ${action})`);

      const obj = World.getObjectByLabel(objectName.toLowerCase());
      if (!obj) {
        return { success: false, message: `object '${objectName}' not found in world` };
      }

      if (action === "flip") {
        obj.rotation.x += Math.PI;
      } else if (action === "spin") {
        obj.rotation.y += Math.PI * 2;
      } else if (action === "reset") {
        obj.rotation.set(0, 0, 0);
      } else {
        return { success: false, message: `unknown action '${action}'` };
      }

      return { success: true, message: `${action} ${objectName}` };
    });

    // tool: move player
    registerTool("movePlayer", ({ target }: { target: string }) => {
      console.log(`tool called: movePlayer(${target})`);

      if (!playerRef.current) {
        return { success: false, message: "player not available" };
      }

      // check if target is coordinates
      const coordMatch = target.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (coordMatch) {
        const x = parseFloat(coordMatch[1]);
        const y = parseFloat(coordMatch[2]);
        const z = parseFloat(coordMatch[3]);
        playerRef.current.moveTo([x, y, z]);
        return { success: true, message: `moving player to coordinates ${x}, ${y}, ${z}` };
      }

      // check if target is an object label
      const targetObj = World.getObjectByLabel(target)
      if (targetObj) {
        const pos = new THREE.Vector3();
        targetObj.getWorldPosition(pos);
        playerRef.current.moveTo([pos.x, pos.y, pos.z]);
        return { success: true, message: `moving player to ${target}` };
      }

      return { success: false, message: `unknown target '${target}'` };
    });

    // tool: inspect object
    registerTool("inspectObject", ({ objectName }: { objectName: string }) => {
      console.log(`tool called: inspectObject(${objectName})`);

      const objectDescriptions: { [key: string]: string } = {
        bed: "an ornate four-poster bed with velvet drapes. the bedding is disturbed, as if someone left in a hurry.",
        desk: "a mahogany writing desk with intricate carvings. several papers are scattered across its surface.",
        drawer: "a tall wooden drawer with brass handles. one drawer is slightly ajar.",
        campfire: inventory.includes("match") && World.getObjectByLabel("campfire")?.visible
          ? "a mystical campfire that burns with an otherworldly glow, casting dancing shadows across the room."
          : "a dark campfire pit, unlit. you would need a match to light it.",
        match: "a simple wooden match. it could be used to light something.",
      };

      const targetLower = objectName.toLowerCase();
      const key = Object.keys(objectDescriptions).find(name => targetLower.includes(name));

      if (key) {
        return {
          success: true,
          objectName: key,
          description: objectDescriptions[key],
        };
      }

      return { success: false, message: `object '${objectName}' not found` };
    });

    // tool: unlock clue
    registerTool("unlockClue", ({ clueId, clueText }: { clueId: string; clueText: string }) => {
      console.log(`tool called: unlockClue(${clueId})`);
      console.log(`🔓 clue unlocked [${clueId}]: ${clueText}`);

      return {
        success: true,
        clueId,
        message: `clue unlocked: ${clueText}`,
      };
    });

    // tool: pickup object
    registerTool("pickupObject", ({ objectName }: { objectName: string }) => {
      console.log(`tool called: pickupObject(${objectName})`);

      const obj = World.getObjectByLabel(objectName.toLowerCase());
      if (!obj) {
        return { success: false, message: `object '${objectName}' not found in world` };
      }

      if (inventory.includes(objectName.toLowerCase())) {
        return { success: false, message: `you already have the ${objectName}` };
      }

      // check proximity
      if (!playerRef.current) {
        return { success: false, message: "player not available" };
      }

      const playerObj = playerRef.current.getObject3D?.();
      if (!playerObj) {
        return { success: false, message: "player object not available" };
      }

      const playerPos = new THREE.Vector3();
      const objPos = new THREE.Vector3();
      playerObj.getWorldPosition(playerPos);
      obj.getWorldPosition(objPos);

      // calculate 2d distance (ignore y-axis) for better pickup detection
      const dx = playerPos.x - objPos.x;
      const dz = playerPos.z - objPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // pickup range should account for player radius (0.5) + small reach distance
      const pickupRange = 2.5;

      if (distance > pickupRange) {
        // calculate a position just outside the collision boundary
        const direction = new THREE.Vector3(dx, 0, dz).normalize();
        const targetDistance = 0.8; // get within 0.8 units
        const targetPos = new THREE.Vector3(
          objPos.x + direction.x * targetDistance,
          objPos.y,
          objPos.z + direction.z * targetDistance
        );

        playerRef.current.moveTo([targetPos.x, targetPos.y, targetPos.z]);
        return {
          success: false,
          message: `moving closer to ${objectName} first. try picking it up again once you're near it.`,
          needsRetry: true,
        };
      }

      obj.visible = false;
      setInventory(prev => [...prev, objectName.toLowerCase()]);

      return {
        success: true,
        message: `picked up ${objectName}`,
        inventory: [...inventory, objectName.toLowerCase()],
      };
    });

    // tool: light campfire
    registerTool("lightCampfire", () => {
      console.log("tool called: lightCampfire()");

      if (!inventory.includes("match") && !inventory.includes("match_object")) {
        return { success: false, message: "you need a match to light the campfire" };
      }

      const campfire = World.getObjectByLabel("campfire");
      const campfireFire = World.getObjectByLabel("campfire_fire");

      if (!campfire || !campfireFire) {
        return { success: false, message: "campfire not found in the scene" };
      }

      // check proximity
      if (!playerRef.current) {
        return { success: false, message: "player not available" };
      }

      const playerObj = playerRef.current.getObject3D?.();
      if (!playerObj) {
        return { success: false, message: "player object not available" };
      }

      const playerPos = new THREE.Vector3();
      const campfirePos = new THREE.Vector3();
      playerObj.getWorldPosition(playerPos);
      campfire.getWorldPosition(campfirePos);

      // calculate 2d distance (ignore y-axis)
      const dx = playerPos.x - campfirePos.x;
      const dz = playerPos.z - campfirePos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // interaction range should account for campfire collision radius (0.6) + player radius (0.5) + reach
      const lightRange = 1.5;

      if (distance > lightRange) {
        // calculate a position just outside the collision boundary
        const direction = new THREE.Vector3(dx, 0, dz).normalize();
        const targetDistance = 1.2; // get within 1.2 units
        const targetPos = new THREE.Vector3(
          campfirePos.x + direction.x * targetDistance,
          campfirePos.y,
          campfirePos.z + direction.z * targetDistance
        );

        playerRef.current.moveTo([targetPos.x, targetPos.y, targetPos.z]);
        return {
          success: false,
          message: `moving closer to the campfire first. try lighting it again once you're near it.`,
          needsRetry: true,
        };
      }

      campfire.visible = true;
      campfireFire.visible = true;

      // trigger lighting animation if available
      if ((World as any).lightCampfireAnimated) {
        (World as any).lightCampfireAnimated();
      }

      return {
        success: true,
        message: "the campfire ignites with a warm, flickering glow",
      };
    });

    // tool: check inventory
    registerTool("checkInventory", () => {
      console.log("tool called: checkInventory()");

      return {
        success: true,
        inventory: inventory,
        itemCount: inventory.length,
        message: inventory.length > 0
          ? `you are carrying: ${inventory.join(", ")}`
          : "your inventory is empty",
      };
    });

    return () => {
      unregisterTool("getSceneSnapshot");
      unregisterTool("getObjectInfo");
      unregisterTool("getPlayerPosition");
      unregisterTool("listSceneObjects");
      unregisterTool("changeObjectColor");
      unregisterTool("rotateObject");
      unregisterTool("movePlayer");
      unregisterTool("inspectObject");
      unregisterTool("unlockClue");
      unregisterTool("pickupObject");
      unregisterTool("lightCampfire");
      unregisterTool("checkInventory");
    };
  }, [isConnected, inventory]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendText(message);
    setMessage("");
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    (window as any).World = World;
  }, [])

  // auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

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
              <div className="text-3xl mb-1"></div>
              <h1 className="text-2xl font-heading font-bold text-yellow-100 tracking-wide mb-1 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)] [text-shadow:_1px_1px_2px_rgb(0_0_0_/_80%)]">
                {currentRoom.name}
              </h1>
              <p className="text-xs text-yellow-200/90 italic font-serif">
                "Every clue hides a whisper of truth."
              </p>
            </header>
          </div>
          <div className="absolute inset-0 border-4 border-yellow-900/40 rounded-lg pointer-events-none" />
          <div className="absolute top-4 right-8 w-12 h-0.5 bg-black/20 rotate-12" />
          <div className="absolute bottom-6 left-6 w-8 h-0.5 bg-black/20 -rotate-6" />
        </div>
        <div className="absolute inset-0 top-2 -z-10 bg-black/40 blur-md rounded-lg" />
      </div>

      {/* Main Scene Area */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#101010] to-[#181818] relative">
        <SceneCanvas playerRef={playerRef} />

        {/* detective thoughts display */}
        {detectiveThought && (
          <div className="absolute top-4 left-4 bg-black/80 border border-yellow-700/40 rounded-lg p-3 md:p-4 max-w-[180px] sm:max-w-[220px] md:max-w-[300px] max-h-[120px] md:max-h-none overflow-y-auto">
            <h3 className="text-yellow-500 font-semibold mb-1 md:mb-2 text-xs md:text-sm flex items-center gap-1 md:gap-2">
              <span className="text-sm md:text-base">💭</span>
              <span>detective's thoughts</span>
            </h3>
            <div className={`text-xs md:text-sm ${
              detectiveThought.priority === 'critical' ? 'text-red-400' :
              detectiveThought.priority === 'high' ? 'text-orange-400' :
              detectiveThought.priority === 'medium' ? 'text-yellow-300' :
              'text-gray-300'
            }`}>
              <p className="italic leading-relaxed">{detectiveThought.thought}</p>
            </div>
          </div>
        )}

        {/* inventory display */}
        {inventory.length > 0 && (
          <div className="absolute top-4 right-4 bg-black/80 border border-yellow-700/40 rounded-lg p-3 md:p-4 min-w-[120px] md:min-w-[200px] max-h-[120px] md:max-h-none overflow-y-auto">
            <h3 className="text-yellow-500 font-semibold mb-1 md:mb-2 text-xs md:text-sm">inventory</h3>
            <div className="space-y-1">
              {inventory.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 md:gap-2 text-gray-300 text-xs md:text-sm">
                  <span className="text-yellow-500">▪</span>
                  <span className="capitalize">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 border border-yellow-500/60 rounded-full px-4 md:px-6 py-2 md:py-3 flex items-center gap-2 md:gap-3 shadow-lg">
            <div className="flex items-center gap-1">
              <span className="w-1 md:w-1.5 h-3 md:h-4 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '800ms' }} />
              <span className="w-1 md:w-1.5 h-4 md:h-5 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '150ms', animationDuration: '800ms' }} />
              <span className="w-1 md:w-1.5 h-3 md:h-4 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '300ms', animationDuration: '800ms' }} />
            </div>
            <span className="text-yellow-500 text-xs md:text-sm font-medium">detective speaking...</span>
          </div>
        )}
      </main>

      {/* Story Text Area */}
      <section ref={chatScrollRef} className="border-t border-yellow-700/40 bg-[#111] p-6 h-48 overflow-y-auto scroll-smooth">
        <h2 className="text-xl font-semibold text-yellow-500 mb-2">
          Case Notes:
        </h2>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-gray-400 italic">
              {isConnected
                ? "AI detective is ready. Start asking questions or use voice..."
                : "Connecting to AI detective..."}
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="leading-relaxed">
                {msg.role === "user" ? (
                  <p className="text-blue-400">
                    <span className="font-semibold">You:</span> {msg.text}
                  </p>
                ) : (
                  <p className="text-gray-300">
                    <span className="font-semibold text-yellow-500">
                      AI Detective:
                    </span>{" "}
                    {msg.text}
                  </p>
                )}
              </div>
            ))
          )}
          {isProcessing && (
            <p className="text-yellow-500 italic animate-pulse">
              AI detective is thinking...
            </p>
          )}
        </div>
      </section>

      {/* Input Box */}
      <footer className="bg-[#1a1a1a] border-t border-yellow-700/40 p-4 flex items-center gap-3">
        <button
          onClick={toggleVoice}
          disabled={!isConnected || isProcessing}
          className={
            "px-4 py-3 rounded-lg font-semibold transition hover:cursor-pointer " +
            (isListening
              ? "bg-red-600 hover:bg-red-700 text-white"
              : isProcessing
              ? "bg-yellow-600 text-black"
              : "bg-blue-600 hover:bg-blue-700 text-white") +
            " disabled:bg-gray-600 disabled:cursor-not-allowed"
          }
        >
          {isProcessing ? "" : isListening ? " Stop" : " Voice"}
        </button>

        <input
          type="text"
          placeholder="Type your observation or ask the AI detective..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-[#0f0f0f] text-gray-200 border border-yellow-700/40 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 placeholder-gray-500 hover:cursor-text"
        />

        <button
          onClick={handleSend}
          disabled={!isConnected || !message.trim()}
          className="bg-yellow-600 hover:bg-yellow-700 transition text-black font-semibold px-6 py-3 rounded-lg shadow-md hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </footer>
    </div>
  );
}