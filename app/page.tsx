"use client";

import ModelViewer from "./components/ModelViewer";
import LiquidGlass from "./components/ui/LiquidGlass";
import AnimationStateMachine from "./components/AnimationStateMachine";
import VoiceChat from "./components/VoiceChat";
import { useState, useEffect } from "react";
import { chatWithAI, ChatMessage, AnimationRequest } from "./actions/chat";
import { getCurrentBackground, getBackgroundGenerationStatus, BackgroundRequest } from "./actions/background";
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
  const [isListening, setIsListening] = useState(false);
  const [voiceChatReady, setVoiceChatReady] = useState(false);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(null);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [backgroundGenerationDescription, setBackgroundGenerationDescription] = useState<string | null>(null);

  // Get available animations for the LLM
  useEffect(() => {
    setAvailableAnimations(getAvailableAnimationsForLLM());
  }, []);

  // Check for background updates and generation status periodically
  useEffect(() => {
    const checkBackgroundUpdates = async () => {
      try {
        const [backgroundUrl, generationStatus] = await Promise.all([
          getCurrentBackground(),
          getBackgroundGenerationStatus(),
        ]);

        if (backgroundUrl !== currentBackgroundUrl) {
          setCurrentBackgroundUrl(backgroundUrl);
        }

        if (generationStatus.isGenerating !== isGeneratingBackground) {
          setIsGeneratingBackground(generationStatus.isGenerating);
        }

        if (generationStatus.description !== backgroundGenerationDescription) {
          setBackgroundGenerationDescription(generationStatus.description);
        }
      } catch (error) {
        console.error("Error checking background updates:", error);
      }
    };

    // Check immediately and then every 2 seconds
    checkBackgroundUpdates();
    const interval = setInterval(checkBackgroundUpdates, 2000);

    return () => clearInterval(interval);
  }, [currentBackgroundUrl, isGeneratingBackground, backgroundGenerationDescription]);

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

  // Handler for voice chat messages
  const handleVoiceMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  // Handler for voice chat animation requests
  const handleVoiceAnimationRequest = (request: AnimationRequest) => {
    console.log("🎭 Voice chat animation request:", request);

    // Add AI response to chat
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: request.say,
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Play the requested animation
    if ((window as any).playAnimationByDescription) {
      const success = (window as any).playAnimationByDescription(request.animationDescription);
      console.log("🎯 Voice animation result:", success);

      if (success) {
        // Return to idle after animation completes
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
        }, 5000);
      }
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

  // Check if voice chat is supported
  useEffect(() => {
    const checkVoiceChat = () => {
      const hasSpeechRecognition =
        typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

      if (hasSpeechRecognition) {
        setVoiceChatReady(true);
        console.log("🎤 Voice chat supported and ready");
      } else {
        console.warn("🎤 Voice chat not supported in this browser");
        setVoiceChatReady(false);
      }
    };

    checkVoiceChat();
  }, []);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log(
      `🔄 State changed - animationSystemReady: ${animationSystemReady}, isInIdleState: ${isInIdleState}, voiceChatReady: ${voiceChatReady}, isListening: ${isListening}`
    );
  }, [animationSystemReady, isInIdleState, voiceChatReady, isListening]);

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

        // Add AI response to chat - use the "say" parameter if animation/background is requested, otherwise use the response
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: aiResponse.animationRequest?.say || aiResponse.backgroundRequest?.say || aiResponse.response,
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Handle background request if present
        if (aiResponse.backgroundRequest) {
          console.log("🎨 AI requested background change:", aiResponse.backgroundRequest);
          console.log("💬 AI says:", aiResponse.backgroundRequest.say);
          // Background generation started asynchronously, URL will be updated by periodic check
        }

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

        // Play TTS audio if available
        if (aiResponse.audioUrl) {
          console.log("🔊 Playing TTS audio");
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

  // Auto-greet and wave once animations are fully ready - RUNS ONLY ONCE
  useEffect(() => {
    // Early return if already sent greeting or not ready
    if (hasSentGreeting || !animationSystemReady || isLoading) return;

    console.log("🎉 Animation system ready! Preparing to send greeting...");

    // Single timeout to send greeting after everything stabilizes
    const greetingTimer = setTimeout(async () => {
      // Double-check we haven't sent greeting yet (race condition protection)
      if (hasSentGreeting) {
        console.log("Greeting already sent, skipping...");
        return;
      }

      console.log("🚀 Sending greeting now...");
      setHasSentGreeting(true);

      const userMessage: ChatMessage = {
        role: "user",
        content: "Say hello and wave. Do not change the background during greeting.",
      };

      // Surface in debug chat
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const aiResponse = await chatWithAI([userMessage], availableAnimations);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: aiResponse.animationRequest?.say || aiResponse.backgroundRequest?.say || aiResponse.response,
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (aiResponse.backgroundRequest) {
          console.log("🎨 Greeting background request:", aiResponse.backgroundRequest);
        }

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

        // Play TTS audio for greeting if available
        if (aiResponse.audioUrl) {
          console.log("🔊 Playing greeting TTS audio");
          const audio = new Audio(aiResponse.audioUrl);
          audio.play().catch(console.error);

          // Mark complete when audio finishes
          audio.onended = () => {
            console.log("🔊 Greeting audio finished");
            setGreetingComplete(true);
          };

          // Fallback timeout in case audio fails
          setTimeout(() => {
            setGreetingComplete(true);
          }, 10000);
        } else {
          // No audio, mark complete after animation timeout
          setTimeout(() => {
            console.log("⏰ Greeting animation timeout finished");
            setGreetingComplete(true);
          }, 3000);
        }
      } catch (error) {
        console.error("Error in initial greeting:", error);
        setGreetingComplete(true); // Mark as complete on error
      } finally {
        setIsLoading(false);
      }
    }, 2000); // Single delay for everything to stabilize

    // Cleanup function to clear the timer if component unmounts
    return () => {
      clearTimeout(greetingTimer);
    };
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

      <ModelViewer
        showDebugUI={showDebugUI && isDevelopment}
        isListening={isListening}
        backgroundUrl={currentBackgroundUrl}
      />

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

      {/* Background Generation Status */}
      {isGeneratingBackground && backgroundGenerationDescription && (
        <div className="absolute top-20 right-8 z-30 bg-black/20 backdrop-blur-md rounded-lg p-3 border border-white/20 max-w-xs">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <div className="text-white text-sm">
              <div className="font-medium">Generating background...</div>
              <div className="text-white/60 text-xs mt-1">{backgroundGenerationDescription}</div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Chat - Above the text input */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
        <VoiceChat
          availableAnimations={availableAnimations}
          onAnimationRequest={handleVoiceAnimationRequest}
          onMessage={handleVoiceMessage}
          isListening={isListening}
          onListeningChange={setIsListening}
        />
      </div>

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
