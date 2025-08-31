"use client";

import ModelViewer from "./components/ModelViewer";
import LiquidGlass from "./components/ui/LiquidGlass";
import { useState, useEffect } from "react";
import { chatWithAI, ChatMessage } from "./actions/chat";
import { getAvailableAnimationsForLLM } from "./components/animation-loader";

export default function Home() {
  const [showDebugUI, setShowDebugUI] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [animationSystemReady, setAnimationSystemReady] = useState(false);
  const [isInIdleState, setIsInIdleState] = useState(false);
  const [idleCycleTimer, setIdleCycleTimer] = useState<NodeJS.Timeout | null>(null);

  // Get available animations for the LLM
  useEffect(() => {
    setAvailableAnimations(getAvailableAnimationsForLLM());
  }, []);

  // Wait for animation system to be ready
  useEffect(() => {
    const checkAnimationSystem = () => {
      console.log("Checking animation system...", {
        playAnimationByDescription: !!(window as any).playAnimationByDescription,
        ANIMATION_NAMES: !!(window as any).ANIMATION_NAMES,
        playAnimation: !!(window as any).playAnimation,
      });

      if ((window as any).playAnimationByDescription && (window as any).ANIMATION_NAMES) {
        setAnimationSystemReady(true);
        console.log("Animation system ready");
      } else {
        setTimeout(checkAnimationSystem, 100);
      }
    };
    checkAnimationSystem();
  }, []);

  // Start idle cycling when animation system becomes ready
  useEffect(() => {
    if (animationSystemReady) {
      console.log("🔄 Animation system state updated - starting idle cycling");
      // Start idle cycling after a short delay to ensure state is stable
      setTimeout(() => {
        startIdleCycling();
      }, 1000);
    }
  }, [animationSystemReady]);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log(`🔄 State changed - animationSystemReady: ${animationSystemReady}, isInIdleState: ${isInIdleState}`);
  }, [animationSystemReady, isInIdleState]);

  // Function to start idle cycling
  const startIdleCycling = () => {
    console.log(`🔄 Starting idle cycling - Animation system ready: ${animationSystemReady}`);

    // Double-check that the animation system is actually ready
    if (!(window as any).playAnimation || !(window as any).ANIMATION_NAMES) {
      console.log(`❌ Animation system not ready yet, delaying idle cycling start`);
      setTimeout(startIdleCycling, 1000);
      return;
    }

    // Set the idle state first
    setIsInIdleState(true);
    console.log(`🔄 Idle state set to: true, will update in next render`);

    // Clear any existing timer
    if (idleCycleTimer) {
      clearTimeout(idleCycleTimer);
      console.log(`🔄 Cleared existing idle cycle timer`);
    }

    // Start cycling through idle animations
    const cycleToNextIdle = () => {
      console.log(
        `🔄 cycleToNextIdle called - isInIdleState: ${isInIdleState}, animationSystemReady: ${animationSystemReady}`
      );

      if (isInIdleState && (window as any).playAnimation) {
        // Get all idle animations
        const idleIndices =
          (window as any).ANIMATION_NAMES?.map((name: string, index: number) =>
            name.toLowerCase().includes("idle") ? index : -1
          ).filter((index: number) => index !== -1) || [];

        console.log(`🔄 Found ${idleIndices.length} idle animations:`, idleIndices);

        if (idleIndices.length > 0) {
          // Pick a random idle animation
          const randomIdleIndex = idleIndices[Math.floor(Math.random() * idleIndices.length)];
          console.log(`🔄 Cycling to random idle animation: ${(window as any).ANIMATION_NAMES[randomIdleIndex]}`);
          (window as any).playAnimation(randomIdleIndex);

          // Set up next cycle (random duration between 5-15 seconds)
          const nextCycleDelay = 5000 + Math.random() * 10000;
          console.log(`🔄 Next idle cycle in ${Math.round(nextCycleDelay / 1000)} seconds`);
          const timer = setTimeout(cycleToNextIdle, nextCycleDelay);
          setIdleCycleTimer(timer);
        }
      } else {
        console.log(
          `🔄 Idle cycling skipped - isInIdleState: ${isInIdleState}, playAnimation: ${!!(window as any).playAnimation}`
        );
      }
    };

    // Start first cycle after a short delay
    const timer = setTimeout(cycleToNextIdle, 3000);
    setIdleCycleTimer(timer);
    console.log(`🔄 First idle cycle scheduled in 3 seconds`);
  };

  // Function to stop idle cycling
  const stopIdleCycling = () => {
    console.log(`🔄 Stopping idle cycling`);
    setIsInIdleState(false);
    if (idleCycleTimer) {
      clearTimeout(idleCycleTimer);
      setIdleCycleTimer(null);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (idleCycleTimer) {
        clearTimeout(idleCycleTimer);
      }
    };
  }, [idleCycleTimer]);

  // Expose idle cycling functions globally
  useEffect(() => {
    (window as any).startIdleCycling = startIdleCycling;
    (window as any).stopIdleCycling = stopIdleCycling;
    (window as any).cycleToNextIdle = () => {
      if (isInIdleState && (window as any).playAnimation) {
        const idleIndices =
          (window as any).ANIMATION_NAMES?.map((name: string, index: number) =>
            name.toLowerCase().includes("idle") ? index : -1
          ).filter((index: number) => index !== -1) || [];

        if (idleIndices.length > 0) {
          const randomIdleIndex = idleIndices[Math.floor(Math.random() * idleIndices.length)];
          console.log(`🔄 Manual idle cycle to: ${(window as any).ANIMATION_NAMES[randomIdleIndex]}`);
          (window as any).playAnimation(randomIdleIndex);
        }
      }
    };
  }, [isInIdleState]);

  const handleInputSubmit = async () => {
    if (inputValue.trim() && !isLoading && animationSystemReady) {
      const userMessage: ChatMessage = {
        role: "user",
        content: inputValue.trim(),
      };

      // Add user message to chat
      setMessages(prev => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        // Get AI response with animation request
        const aiResponse = await chatWithAI([...messages, userMessage], availableAnimations);

        // Add AI response to chat - use the "say" parameter if animation is requested, otherwise use the response
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: aiResponse.animationRequest?.say || aiResponse.response,
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Handle animation request if present
        if (aiResponse.animationRequest) {
          console.log("🎭 AI requested animation:", aiResponse.animationRequest);
          console.log("💬 AI says:", aiResponse.animationRequest.say);

          // Use the global playAnimationByDescription function
          if ((window as any).playAnimationByDescription) {
            console.log("✅ playAnimationByDescription function found, calling it...");
            const success = (window as any).playAnimationByDescription(
              aiResponse.animationRequest.animationDescription
            );
            console.log("🎯 Animation result:", success);

            if (success) {
              console.log("🔄 Setting up return to idle...");
              // Stop idle cycling during animation
              stopIdleCycling();

              // Return to idle after animation completes
              setTimeout(() => {
                const idleIndex = (window as any).ANIMATION_NAMES?.findIndex((name: string) =>
                  name.toLowerCase().includes("idle")
                );
                if (idleIndex !== -1 && (window as any).playAnimation) {
                  (window as any).playAnimation(idleIndex);
                  // Start idle cycling after returning to idle
                  startIdleCycling();
                }
              }, 5000); // Default 5 second animation duration
            }
          } else {
            console.error("❌ playAnimationByDescription function not found!");
            console.log(
              "🔍 Available global functions:",
              Object.keys(window as any).filter(key => key.includes("play"))
            );
          }
        }

        // Handle TTS audio if present
        if (aiResponse.audioUrl) {
          const audio = new Audio(aiResponse.audioUrl);
          audio.play().catch(console.error);
        }

        // If no audio URL but we have a "say" message, generate TTS locally
        if (!aiResponse.audioUrl && aiResponse.animationRequest?.say) {
          // For now, we'll just log this. In a real implementation, you might want to use a local TTS solution
          console.log("🎤 No TTS audio generated, but AI said:", aiResponse.animationRequest.say);
        }
      } catch (error) {
        console.error("Error in AI chat:", error);
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
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

        {/* Manual Idle Cycling Test Button */}
        {animationSystemReady && (
          <button
            onClick={() => {
              if (isInIdleState) {
                stopIdleCycling();
              } else {
                startIdleCycling();
              }
            }}
            className={`mt-2 px-4 py-2 rounded-lg text-white transition-all duration-200 font-medium ${
              isInIdleState ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isInIdleState ? "⏸️ Stop Idle Cycling" : "�� Start Idle Cycling"}
          </button>
        )}
      </div>

      {/* Animation System Status */}
      <div className="absolute top-8 left-8 z-50">
        <div
          className={`px-4 py-2 rounded-lg text-white text-sm ${
            animationSystemReady ? "bg-green-600" : "bg-yellow-600"
          }`}
        >
          {animationSystemReady ? "Animation System Ready" : "Loading Animation System..."}

          {/* Idle Cycling Status */}
          {animationSystemReady && (
            <div
              className={`mt-2 px-4 py-2 rounded-lg text-white text-sm ${
                isInIdleState ? "bg-blue-600" : "bg-gray-600"
              }`}
            >
              {isInIdleState ? "🔄 Idle Cycling Active" : "⏸️ Idle Cycling Paused"}
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages - Only visible when debug is enabled */}
      {showDebugUI && messages.length > 0 && (
        <div className="absolute top-20 left-8 right-8 max-h-64 overflow-y-auto bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/20 z-30">
          {messages.map((message, index) => (
            <div key={index} className={`mb-3 ${message.role === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-white/20 text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Beautiful Liquid Glass Input - Always visible */}
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
            placeholder={
              !animationSystemReady
                ? "Loading animation system..."
                : isLoading
                ? "AI is thinking..."
                : "Chat with AI to see animations..."
            }
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => {
              if (e.key === "Enter") {
                handleInputSubmit();
              }
            }}
            disabled={isLoading || !animationSystemReady}
            className="w-full px-6 py-4 bg-transparent border-none outline-none
                     text-white placeholder-white/60 text-lg disabled:opacity-50"
          />
        </LiquidGlass>
      </div>
    </div>
  );
}
