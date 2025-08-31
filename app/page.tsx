"use client";

import ModelViewer from "./components/ModelViewer";
import LiquidGlass from "./components/ui/LiquidGlass";
import AnimationStateMachine from "./components/AnimationStateMachine";
import { useState, useEffect, useRef } from "react";
import { chatWithAI, ChatMessage } from "./actions/chat";
import { getAvailableAnimationsForLLM } from "./components/animation-loader";

export default function Home() {
  const [showDebugUI, setShowDebugUI] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [animationSystemReady, setAnimationSystemReady] = useState(false);
  const [isInIdleState, setIsInIdleState] = useState(false);
  const [idleCycleTimer, setIdleCycleTimer] = useState<NodeJS.Timeout | null>(null);
  const [animationState, setAnimationState] = useState<any>(null);
  const [hasSentGreeting, setHasSentGreeting] = useState(false);
  const [greetingComplete, setGreetingComplete] = useState(false);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get available animations for the LLM
  useEffect(() => {
    setAvailableAnimations(getAvailableAnimationsForLLM());
  }, []);

  // Handler for animation state changes
  const handleAnimationStateChange = (state: any) => {
    console.log(`🔄 Animation state changed:`, state);
    setAnimationState(state);
    setIsInIdleState(!state.isPlaying);
    // Don't trigger animations from state changes - AnimationStateMachine handles this
  };

  // Handler for animation changes (kept for compatibility but should be rarely called now)
  const handleAnimationChange = (animationName: string) => {
    console.log(`🎬 Animation changed to: ${animationName}`);
    // This is now mainly used for external animation requests, not internal state changes
    if ((window as any).playAnimationByDescription) {
      console.log(`🎯 Playing animation by description: ${animationName}`);
      (window as any).playAnimationByDescription(animationName);
    } else {
      console.warn(`❌ playAnimationByDescription function not available`);
    }
  };

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

  // Debug: Monitor state changes
  useEffect(() => {
    console.log(`🔄 State changed - animationSystemReady: ${animationSystemReady}, isInIdleState: ${isInIdleState}`);
  }, [animationSystemReady, isInIdleState]);

  // Cleanup greeting timeout on unmount
  useEffect(() => {
    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, []);

  // OLD IDLE CYCLING LOGIC - DISABLED (now using AnimationStateMachine)
  // The AnimationStateMachine handles idle cycling automatically

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
              // Return to idle after animation completes using AnimationStateMachine
              setTimeout(() => {
                if ((window as any).returnToIdle) {
                  (window as any).returnToIdle();
                } else {
                  // Fallback: find and play an idle animation manually
                  const idleIndex = (window as any).ANIMATION_NAMES?.findIndex((name: string) =>
                    name.toLowerCase().includes("idle")
                  );
                  if (idleIndex !== -1 && (window as any).playAnimation) {
                    (window as any).playAnimation(idleIndex);
                  }
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

  // Auto-greet and wave once animations are fully ready
  useEffect(() => {
    if (hasSentGreeting || !animationSystemReady || isLoading) return;

    // Check if animations are actually loaded and ready
    const checkAndSendGreeting = () => {
      const animationsAvailable =
        typeof window !== "undefined" &&
        (window as any).animations &&
        Array.isArray((window as any).animations) &&
        (window as any).animations.length > 0;

      if (!animationsAvailable) {
        console.log("Waiting for animations to load...");
        setTimeout(checkAndSendGreeting, 500);
        return;
      }

      console.log("🎉 Animation system fully ready! Sending greeting...");

      // Wait a bit for idle cycling to stabilize
      setTimeout(() => {
        // Safety timeout - force complete after 15 seconds if something goes wrong
        greetingTimeoutRef.current = setTimeout(() => {
          console.log("🚨 Safety timeout: forcing greeting complete after 15 seconds");
          setGreetingComplete(true);
          greetingTimeoutRef.current = null;
        }, 15000);

        const sendGreeting = async () => {
          setHasSentGreeting(true);

          const userMessage: ChatMessage = {
            role: "user",
            content: "Say hello and wave.",
          };

          console.log("Sending greeting:", userMessage);
          // Surface in debug chat
          setMessages(prev => [...prev, userMessage]);
          setIsLoading(true);

          try {
            const aiResponse = await chatWithAI([userMessage], availableAnimations);

            const assistantMessage: ChatMessage = {
              role: "assistant",
              content: aiResponse.animationRequest?.say || aiResponse.response,
            };
            setMessages(prev => [...prev, assistantMessage]);

            if (aiResponse.animationRequest) {
              console.log("🎭 Greeting animation request:", aiResponse.animationRequest);
              if ((window as any).playAnimationByDescription) {
                const success = (window as any).playAnimationByDescription(
                  aiResponse.animationRequest.animationDescription
                );
                console.log("🎯 Greeting animation result:", success);

                if (success) {
                  setTimeout(() => {
                    if ((window as any).returnToIdle) {
                      (window as any).returnToIdle();
                    }
                  }, 5000);
                }
              }
            }

            if (aiResponse.audioUrl) {
              const audio = new Audio(aiResponse.audioUrl);
              audio.play().catch(console.error);

              // Wait for audio to finish, then mark greeting complete
              audio.onended = () => {
                console.log("🎵 Greeting audio finished");
                setGreetingComplete(true);
                if (greetingTimeoutRef.current) {
                  clearTimeout(greetingTimeoutRef.current);
                  greetingTimeoutRef.current = null;
                }
              };
            } else {
              // No audio, wait for animation timeout then mark complete
              setTimeout(() => {
                console.log("⏰ Greeting animation timeout finished");
                setGreetingComplete(true);
                if (greetingTimeoutRef.current) {
                  clearTimeout(greetingTimeoutRef.current);
                  greetingTimeoutRef.current = null;
                }
              }, 5500);
            }

            // Also set complete after animation timeout as fallback
            setTimeout(() => {
              console.log("⏰ Fallback: marking greeting complete after 6 seconds");
              setGreetingComplete(true);
              if (greetingTimeoutRef.current) {
                clearTimeout(greetingTimeoutRef.current);
                greetingTimeoutRef.current = null;
              }
            }, 6000);
          } catch (error) {
            console.error("Error in initial greeting:", error);
            setGreetingComplete(true); // Mark as complete on error
            if (greetingTimeoutRef.current) {
              clearTimeout(greetingTimeoutRef.current);
              greetingTimeoutRef.current = null;
            }
          } finally {
            setIsLoading(false);
          }
        };

        void sendGreeting();
      }, 500); // Small delay for stabilization
    };

    // Small delay to ensure everything is fully initialized
    setTimeout(checkAndSendGreeting, 1000);
  }, [animationSystemReady, hasSentGreeting, isLoading, availableAnimations]);

  return (
    <div className="relative w-full h-screen">
      {/* Dark Loading Screen */}
      {!greetingComplete && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-8">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
            </div>
            <h2 className="text-2xl font-light mb-4">Initializing AI Companion</h2>
            <p className="text-white/60 text-sm">
              {animationSystemReady
                ? hasSentGreeting
                  ? "Greeting you..."
                  : "Preparing greeting..."
                : "Loading animations..."}
            </p>
          </div>
        </div>
      )}

      <ModelViewer showDebugUI={showDebugUI && isDevelopment} />

      {/* Animation State Machine for managing idle cycling */}
      <AnimationStateMachine
        availableAnimations={availableAnimations}
        onAnimationChange={handleAnimationChange}
        onStateChange={handleAnimationStateChange}
      />

      {/* Debug UI Toggle Button - Only in Development */}
      {isDevelopment && (
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
                if ((window as any).changeToNewRandomIdle) {
                  (window as any).changeToNewRandomIdle();
                }
              }}
              className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-200 font-medium"
            >
              🔄 New Random Idle
            </button>
          )}
        </div>
      )}

      {/* Chat Messages - Only visible in development when debug is enabled */}
      {isDevelopment && showDebugUI && messages.length > 0 && (
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
