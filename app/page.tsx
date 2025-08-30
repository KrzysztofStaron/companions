"use client";

import ModelViewer from "./components/ModelViewer";
import LiquidGlass from "./components/ui/LiquidGlass";
import { useState } from "react";

export default function Home() {
  const [showDebugUI, setShowDebugUI] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      console.log("Input submitted:", inputValue);

      // Play the specific dance animation
      if ((window as any).playAnimation) {
        // Find the index of "Dance M F_Dances_007" in the animation names
        const danceIndex = (window as any).ANIMATION_NAMES?.findIndex(
          (name: string) => name === "Dance M F_Dances_007"
        );

        if (danceIndex !== -1) {
          // Play the dance animation
          (window as any).playAnimation(danceIndex);

          // Get the animation duration from the global animations array
          const danceDuration = (window as any).animations?.[danceIndex]?.duration || 5;

          // After dance duration, return to specific idle animation
          setTimeout(() => {
            // Find specific idle animation
            const idleIndex = (window as any).ANIMATION_NAMES?.findIndex(
              (name: string) => name === "Idle M F_Standing_Idle_Variations_003"
            );

            if (idleIndex !== -1) {
              (window as any).playAnimation(idleIndex);
            }
          }, danceDuration * 1000); // Convert duration to milliseconds
        }
      }

      // Clear the input
      setInputValue("");
    }
  };

  return (
    <div className="relative w-full h-screen">
      <ModelViewer showDebugUI={showDebugUI} />

      {/* Debug UI Toggle Button */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={() => setShowDebugUI(!showDebugUI)}
          className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg
                   text-white hover:bg-white/30 transition-all duration-200 font-medium"
        >
          {showDebugUI ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {/* Semi-transparent liquid glass input */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
        <LiquidGlass
          borderRadius={50}
          blur={0.5}
          contrast={0.5}
          brightness={0.5}
          saturation={0.5}
          shadowIntensity={0.1}
        >
          <input
            type="text"
            placeholder="Type your message here..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => {
              if (e.key === "Enter") {
                handleInputSubmit();
              }
            }}
            className="w-full px-6 py-4 bg-transparent border-none outline-none
                     text-white placeholder-white/60 text-lg"
          />
        </LiquidGlass>
      </div>
    </div>
  );
}
