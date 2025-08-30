"use client";

import ModelViewer from "./components/ModelViewer";
import LiquidGlass from "./components/ui/LiquidGlass";
import { useState, useEffect } from "react";
import { AnimationRequest, chatWithAI, ChatMessage } from "./actions/chat";
import { getAvailableAnimationsForLLM } from "./components/animation-loader";

export default function Home() {
  const [showDebugUI, setShowDebugUI] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [animationSystemReady, setAnimationSystemReady] = useState(false);

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

        // Add AI response to chat
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: aiResponse.response,
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Handle animation request if present
        if (aiResponse.animationRequest) {
          console.log("AI requested animation:", aiResponse.animationRequest);

          // Use the global playAnimationByDescription function
          if ((window as any).playAnimationByDescription) {
            const success = (window as any).playAnimationByDescription(
              aiResponse.animationRequest.animationDescription
            );

            if (success) {
              // Return to idle after animation completes
              setTimeout(() => {
                const idleIndex = (window as any).ANIMATION_NAMES?.findIndex(
                  (name: string) => name.toLowerCase().includes("idle") && name.toLowerCase().includes("masculine")
                );
                if (idleIndex !== -1 && (window as any).playAnimation) {
                  (window as any).playAnimation(idleIndex);
                }
              }, 5000); // Default 5 second animation duration
            }
          }
        }

        // Handle TTS audio if present
        if (aiResponse.audioUrl) {
          const audio = new Audio(aiResponse.audioUrl);
          audio.play().catch(console.error);
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
      </div>

      {/* Animation System Status */}
      <div className="absolute top-8 left-8 z-50">
        <div
          className={`px-4 py-2 rounded-lg text-white text-sm ${
            animationSystemReady ? "bg-green-600" : "bg-yellow-600"
          }`}
        >
          {animationSystemReady ? "Animation System Ready" : "Loading Animation System..."}
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
