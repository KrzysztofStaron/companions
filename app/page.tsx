"use client";

import ModelViewer from "./components/ModelViewer";
import LiquidGlass from "./components/ui/LiquidGlass";
import AnimationStateMachine from "./components/AnimationStateMachine";
import VoiceChat from "./components/VoiceChat";
import SubtitleDisplay from "./components/SubtitleDisplay";
import { useState, useEffect } from "react";
import { chatWithAI, ChatMessage, AnimationRequest, SynchronizedSpeech } from "./actions/chat";
import { BackgroundRequest, startBackgroundGeneration } from "./actions/background";
import { getAvailableAnimationsForLLM } from "./components/animation-loader";
import { useAudioPermission } from "./components/AudioPermissionManager";

export default function Home() {
  const { playAudio } = useAudioPermission();
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

  // Subtitle state management
  const [currentSubtitleText, setCurrentSubtitleText] = useState("");
  const [isSubtitleVisible, setIsSubtitleVisible] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  // Helper functions for subtitle management
  const showSubtitle = (text: string) => {
    if (!subtitlesEnabled) return;
    console.log("📖 Showing subtitle:", text);
    setCurrentSubtitleText(text);
    setIsSubtitleVisible(true);
  };

  const hideSubtitle = () => {
    console.log("📖 Hiding subtitle");
    setIsSubtitleVisible(false);
    // Clear text after fade out animation
    setTimeout(() => {
      setCurrentSubtitleText("");
    }, 300);
  };

  // Get available animations for the LLM
  useEffect(() => {
    setAvailableAnimations(getAvailableAnimationsForLLM());
  }, []);

  // No longer using the global background state polling - managing state locally for better control

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

    // Show subtitle for voice chat
    showSubtitle(request.say);

    // Play the requested animation
    if ((window as any).playAnimationByDescription) {
      const success = (window as any).playAnimationByDescription(request.animationDescription);
      console.log("🎯 Voice animation result:", success);

      if (success) {
        // Hide subtitle after estimated duration
        const estimatedDuration = Math.max(2000, request.say.length * 100);
        setTimeout(() => {
          hideSubtitle();
        }, estimatedDuration);

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
    } else {
      // Hide subtitle even if animation fails
      const estimatedDuration = Math.max(2000, request.say.length * 80);
      setTimeout(() => {
        hideSubtitle();
      }, estimatedDuration);
    }
  };

  // Wait for animation system to be ready
  useEffect(() => {
    console.group("🎮 Animation System Initialization");

    const checkAnimationSystem = () => {
      const systemState = {
        playAnimationByDescription: !!(window as any).playAnimationByDescription,
        ANIMATION_NAMES: !!(window as any).ANIMATION_NAMES,
        playAnimation: !!(window as any).playAnimation,
        startLoopByDescription: !!(window as any).startLoopByDescription,
        stopLoopReturnIdle: !!(window as any).stopLoopReturnIdle,
        playOnceByDescription: !!(window as any).playOnceByDescription,
      };

      console.table([
        {
          "Core Functions": systemState.playAnimationByDescription ? "✅" : "❌",
          "Animation Names": systemState.ANIMATION_NAMES ? "✅" : "❌",
          "Loop Control": systemState.startLoopByDescription ? "✅" : "❌",
          "Stop/Idle": systemState.stopLoopReturnIdle ? "✅" : "❌",
          "Play Once": systemState.playOnceByDescription ? "✅" : "❌",
        },
      ]);

      if (Object.values(systemState).every(Boolean)) {
        console.log("✅ Animation system ready - all functions loaded");
        console.groupEnd();
        setAnimationSystemReady(true);
      } else {
        console.log("⏳ Waiting for animation system...");
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
      console.group("💬 User Input Processing");
      console.log(`📝 User message: "${inputValue.trim()}"`);
      console.time("AI Response Time");

      const userMessage: ChatMessage = {
        role: "user",
        content: inputValue.trim(),
      };

      // Add user message to chat
      setMessages(prev => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        // Helper to play a segment audio URL and wait for completion
        const playAudioAndWait = async (url: string) => {
          try {
            await new Promise<void>((resolve, reject) => {
              const audio = new Audio(url);
              const cleanup = () => {
                audio.removeEventListener("ended", onEnded);
                audio.removeEventListener("error", onError);
              };
              const onEnded = () => {
                cleanup();
                resolve();
              };
              const onError = () => {
                cleanup();
                resolve();
              };
              audio.addEventListener("ended", onEnded);
              audio.addEventListener("error", onError);
              // Start playback; if it fails, resolve and continue with estimates
              audio.play().catch(() => resolve());
            });
          } catch {
            // Ignore; will fallback to estimated delay by caller
          }
        };
        // Get AI response with animation request
        const aiResponse = await chatWithAI([...messages, userMessage], availableAnimations);

        // Add AI response to chat - use the "say" parameter if animation/background is requested, otherwise use the response
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: aiResponse.synchronizedSpeech
            ? aiResponse.synchronizedSpeech.segments.map(s => s.text).join(" ")
            : aiResponse.animationRequest?.say || aiResponse.backgroundRequest?.say || aiResponse.response,
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Handle background request if present
        if (aiResponse.backgroundRequest) {
          console.log("🎨 AI requested background change:", aiResponse.backgroundRequest);
          console.log("💬 AI says:", aiResponse.backgroundRequest.say);

          // Update client-side state to show generation started
          console.log("🎨 Setting generation popup to visible");
          setIsGeneratingBackground(true);
          setBackgroundGenerationDescription(aiResponse.backgroundRequest.description);

          // Start background generation asynchronously
          startBackgroundGeneration(aiResponse.backgroundRequest.description)
            .then(result => {
              if (result.success && result.backgroundUrl) {
                console.log(`✅ Background generated successfully`);
                setCurrentBackgroundUrl(result.backgroundUrl);
              } else {
                console.error(`❌ Background generation failed:`, result.error);
              }
              console.log("🎨 Hiding generation popup - generation completed");
              setIsGeneratingBackground(false);
              setBackgroundGenerationDescription(null);
            })
            .catch(error => {
              console.error(`❌ Background generation error:`, error);
              console.log("🎨 Hiding generation popup - generation failed");
              setIsGeneratingBackground(false);
              setBackgroundGenerationDescription(null);
            });
        }

        // Handle synchronized speech if present
        if (aiResponse.synchronizedSpeech && aiResponse.synchronizedSpeech.segments.length > 0) {
          const segments = aiResponse.synchronizedSpeech.segments;
          const urls = aiResponse.synchronizedSpeechAudioUrls || [];

          console.group("🎬 Synchronized Speech Playback");
          console.log(`📊 Starting playback of ${segments.length} segments`);
          console.table(
            segments.map((seg, i) => ({
              Segment: i + 1,
              Text: seg.text.substring(0, 40) + (seg.text.length > 40 ? "..." : ""),
              "Start Anim": seg.animation_on_start ? `${seg.animation_on_start.type}` : "❌",
              "End Anim": seg.animation_on_end ? `${seg.animation_on_end.type}` : "❌",
              "Has Audio": urls[i] ? "✅" : "❌",
            }))
          );

          // Play segments sequentially, triggering animations at boundaries
          (async () => {
            try {
              for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];

                console.groupCollapsed(`🎬 Segment ${i + 1}/${segments.length}`);
                console.log(`📝 Text: "${seg.text}"`);

                // Show subtitle for this segment
                showSubtitle(seg.text);

                // Start animation for segment
                if (seg.animation_on_start) {
                  const cfg = seg.animation_on_start;
                  console.group(`🎭 Starting Animation: ${cfg.type}`);
                  console.log(`🎯 Animation: ${cfg.name}`);
                  try {
                    let success = false;
                    if (cfg.type === "start_loop" && (window as any).startLoopByDescription) {
                      success = (window as any).startLoopByDescription(cfg.name);
                    } else if (cfg.type === "play_once" && (window as any).playOnceByDescription) {
                      success = (window as any).playOnceByDescription(cfg.name);
                    } else if (cfg.type === "emphasis" && (window as any).playOnceByDescription) {
                      success = (window as any).playOnceByDescription(cfg.name);
                    }
                    console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
                  } catch (error) {
                    console.error("❌ Animation start error:", error);
                  }
                  console.groupEnd();
                }

                // Play audio for this segment
                const url = urls[i];
                console.group("🔊 Audio Playback");
                if (url) {
                  console.time(`Audio Segment ${i + 1}`);
                  console.log("🎵 Playing audio...");
                  await playAudioAndWait(url);
                  console.timeEnd(`Audio Segment ${i + 1}`);
                } else {
                  // Fallback: estimate timing if no URL
                  const estimatedDuration = Math.max(1000, segments[i].text.length * 50);
                  console.warn(`⚠️ No audio URL, using estimated duration: ${estimatedDuration}ms`);
                  console.time(`Estimated Wait ${i + 1}`);
                  await new Promise(res => setTimeout(res, estimatedDuration));
                  console.timeEnd(`Estimated Wait ${i + 1}`);
                }
                console.groupEnd();

                // End animation for segment
                if (seg.animation_on_end) {
                  const cfg = seg.animation_on_end;
                  console.group(`🎭 Ending Animation: ${cfg.type}`);
                  if (cfg.name) console.log(`🎯 Animation: ${cfg.name}`);
                  try {
                    let success = false;
                    if (cfg.type === "stop_loop" && (window as any).stopLoopReturnIdle) {
                      success = (window as any).stopLoopReturnIdle();
                    } else if (cfg.type === "return_idle" && (window as any).stopLoopReturnIdle) {
                      success = (window as any).stopLoopReturnIdle();
                    } else if (cfg.type === "play_once" && cfg.name && (window as any).playOnceByDescription) {
                      success = (window as any).playOnceByDescription(cfg.name);
                    }
                    console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
                  } catch (error) {
                    console.error("❌ Animation end error:", error);
                  }
                  console.groupEnd();
                }

                console.groupEnd(); // End segment group
              }
              console.log("✅ Synchronized speech playback completed successfully");

              // Hide subtitle when all segments are done
              hideSubtitle();
              console.groupEnd(); // End main playback group
            } catch (error) {
              console.error("❌ Segment playback error:", error);

              // Hide subtitle on error
              hideSubtitle();
              console.groupEnd(); // End main playback group on error
            }
          })();
        }

        // Handle simple animation request if present (legacy)
        if (!aiResponse.synchronizedSpeech && aiResponse.animationRequest) {
          console.log("🎭 AI requested animation:", aiResponse.animationRequest);
          console.log("💬 AI says:", aiResponse.animationRequest.say);

          // Show subtitle for simple speech
          showSubtitle(aiResponse.animationRequest.say);

          // Use the global playAnimationByDescription function
          if ((window as any).playAnimationByDescription) {
            console.log("✅ playAnimationByDescription function found, calling it...");
            const success = (window as any).playAnimationByDescription(
              aiResponse.animationRequest.animationDescription
            );
            console.log("🎯 Animation result:", success);

            // Non-idle animations will crossfade back to an idle internally
          } else {
            console.error("❌ playAnimationByDescription function not found!");
            console.log(
              "🔍 Available global functions:",
              Object.keys(window as any).filter(key => key.includes("play"))
            );
          }
        }

        // Handle simple speech without animation (background requests, etc.)
        if (
          !aiResponse.synchronizedSpeech &&
          !aiResponse.animationRequest &&
          (aiResponse.backgroundRequest?.say || aiResponse.response)
        ) {
          const speechText = aiResponse.backgroundRequest?.say || aiResponse.response;
          console.log("💬 Simple speech:", speechText);
          showSubtitle(speechText);
        }

        // Play TTS audio if available
        if (aiResponse.audioUrl) {
          console.log("🔊 Playing TTS audio");
          playAudio(aiResponse.audioUrl);

          // Estimate subtitle duration based on text length for simple speech
          if (!aiResponse.synchronizedSpeech) {
            const speechText =
              aiResponse.animationRequest?.say || aiResponse.backgroundRequest?.say || aiResponse.response;
            const estimatedDuration = Math.max(2000, speechText.length * 100); // ~100ms per character
            setTimeout(() => {
              hideSubtitle();
            }, estimatedDuration);
          }
        } else if (!aiResponse.synchronizedSpeech) {
          // No audio, hide subtitle after a shorter delay for simple speech
          const speechText =
            aiResponse.animationRequest?.say || aiResponse.backgroundRequest?.say || aiResponse.response;
          const estimatedDuration = Math.max(2000, speechText.length * 80); // ~80ms per character without audio
          setTimeout(() => {
            hideSubtitle();
          }, estimatedDuration);
        }

        console.timeEnd("AI Response Time");
        console.groupEnd();
      } catch (error) {
        console.error("❌ Error in AI chat:", error);
        console.timeEnd("AI Response Time");
        console.groupEnd();
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

  // Helper function to send greeting directly without input manipulation
  const sendGreeting = async () => {
    const greetingMessage = "hello";
    console.log("🚀 Sending greeting directly...");
    setHasSentGreeting(true);
    setIsLoading(true);

    try {
      console.group("💬 Greeting");
      console.log(`📝 Greeting message: "${greetingMessage}"`);
      console.time("AI Response Time");

      const userMessage: ChatMessage = {
        role: "user",
        content: greetingMessage,
      };

      // Get AI response with animation request
      const aiResponse = await chatWithAI([userMessage], availableAnimations);

      // Add AI response to chat
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse.synchronizedSpeech
          ? aiResponse.synchronizedSpeech.segments.map(s => s.text).join(" ")
          : aiResponse.animationRequest?.say || aiResponse.backgroundRequest?.say || aiResponse.response,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Handle background requests
      if (aiResponse.backgroundRequest) {
        console.log("🎨 Background change requested:", aiResponse.backgroundRequest);
        setIsGeneratingBackground(true);
        setBackgroundGenerationDescription(aiResponse.backgroundRequest.description);

        try {
          const result = await startBackgroundGeneration(aiResponse.backgroundRequest.description);
          if (result.success && result.backgroundUrl) {
            setCurrentBackgroundUrl(result.backgroundUrl);
            console.log("✅ Background generation completed");
          }
        } catch (error) {
          console.error("❌ Background generation failed:", error);
        } finally {
          setIsGeneratingBackground(false);
          setBackgroundGenerationDescription(null);
        }
      }

      // Handle synchronized speech
      if (aiResponse.synchronizedSpeech && aiResponse.synchronizedSpeech.segments.length > 0) {
        const segments = aiResponse.synchronizedSpeech.segments;
        const urls = aiResponse.synchronizedSpeechAudioUrls || [];

        console.group("🎬 Synchronized Speech Playback");
        console.log(`📊 Playing ${segments.length} segments`);

        // Play segments sequentially
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          const url = urls[i];

          console.groupCollapsed(`🎬 Segment ${i + 1}/${segments.length}`);
          console.log(`📝 Text: "${seg.text}"`);

          // Show subtitle for this segment
          showSubtitle(seg.text);

          // Start animation for segment
          if (seg.animation_on_start) {
            const cfg = seg.animation_on_start;
            console.group(`🎭 Starting Animation: ${cfg.type}`);
            console.log(`🎯 Animation: ${cfg.name}`);
            try {
              let success = false;
              if (cfg.type === "start_loop" && (window as any).startLoopByDescription) {
                success = (window as any).startLoopByDescription(cfg.name);
              } else if (cfg.type === "play_once" && (window as any).playOnceByDescription) {
                success = (window as any).playOnceByDescription(cfg.name);
              } else if (cfg.type === "emphasis" && (window as any).playOnceByDescription) {
                success = (window as any).playOnceByDescription(cfg.name);
              }
              console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
            } catch (error) {
              console.error("❌ Animation start error:", error);
            }
            console.groupEnd();
          }

          // Play audio or wait based on text length
          if (url) {
            await new Promise<void>(resolve => {
              const audio = new Audio(url);
              const cleanup = () => {
                audio.removeEventListener("ended", () => resolve());
                audio.removeEventListener("error", () => resolve());
              };
              audio.addEventListener("ended", () => {
                cleanup();
                resolve();
              });
              audio.addEventListener("error", () => {
                cleanup();
                resolve();
              });
              audio.play().catch(() => resolve());
            });
          } else {
            const estimatedDuration = Math.max(1000, seg.text.length * 50);
            console.warn(`⚠️ No audio URL, using estimated duration: ${estimatedDuration}ms`);
            await new Promise(resolve => setTimeout(resolve, estimatedDuration));
          }

          // End animation for segment
          if (seg.animation_on_end) {
            const cfg = seg.animation_on_end;
            console.group(`🎭 Ending Animation: ${cfg.type}`);
            if (cfg.name) console.log(`🎯 Animation: ${cfg.name}`);
            try {
              let success = false;
              if (cfg.type === "stop_loop" && (window as any).stopLoopReturnIdle) {
                success = (window as any).stopLoopReturnIdle();
              } else if (cfg.type === "return_idle" && (window as any).stopLoopReturnIdle) {
                success = (window as any).stopLoopReturnIdle();
              } else if (cfg.type === "play_once" && cfg.name && (window as any).playOnceByDescription) {
                success = (window as any).playOnceByDescription(cfg.name);
              }
              console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
            } catch (error) {
              console.error("❌ Animation end error:", error);
            }
            console.groupEnd();
          }

          console.groupEnd();
        }

        console.log("✅ Synchronized speech playback completed successfully");
        setTimeout(() => hideSubtitle(), 1000);
        console.groupEnd();
      }
      // Handle simple animation request
      else if (aiResponse.animationRequest) {
        console.log("🎭 Animation request:", aiResponse.animationRequest);
        showSubtitle(aiResponse.animationRequest.say);

        if ((window as any).playAnimationByDescription) {
          const success = (window as any).playAnimationByDescription(aiResponse.animationRequest.animationDescription);
          console.log("🎯 Animation result:", success);

          if (success) {
            const estimatedDuration = Math.max(2000, aiResponse.animationRequest.say.length * 100);
            setTimeout(() => hideSubtitle(), estimatedDuration);
          }
        } else {
          const estimatedDuration = Math.max(2000, aiResponse.animationRequest.say.length * 80);
          setTimeout(() => hideSubtitle(), estimatedDuration);
        }
      }
      // Handle simple speech
      else {
        const speechText = aiResponse.backgroundRequest?.say || aiResponse.response;
        console.log("💬 Simple speech:", speechText);
        showSubtitle(speechText);

        // Play TTS audio if available
        if (aiResponse.audioUrl) {
          console.log("🔊 Playing TTS audio");
          playAudio(aiResponse.audioUrl);
        }

        const estimatedDuration = Math.max(2000, speechText.length * 80);
        setTimeout(() => hideSubtitle(), estimatedDuration);
      }

      console.timeEnd("AI Response Time");
      console.groupEnd();
    } catch (error) {
      console.error("❌ Error in greeting:", error);
    } finally {
      setIsLoading(false);
      setGreetingComplete(true);
    }
  };

  // Auto-greet once animations are fully ready - RUNS ONLY ONCE
  useEffect(() => {
    // Early return if already sent greeting or not ready
    if (hasSentGreeting || !animationSystemReady) return;

    console.log("🎉 Animation system ready! Preparing to send greeting...");

    // Simple delay then call greeting function directly
    const greetingTimer = setTimeout(() => {
      sendGreeting();
    }, 2000);

    return () => clearTimeout(greetingTimer);
  }, [animationSystemReady, hasSentGreeting]);

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
      {false && isDevelopment && (
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
      {false && isDevelopment && showDebugUI && messages.length > 0 && (
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
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40 hidden">
        <VoiceChat
          availableAnimations={availableAnimations}
          onAnimationRequest={handleVoiceAnimationRequest}
          onMessage={handleVoiceMessage}
          isListening={isListening}
          onListeningChange={setIsListening}
        />
      </div>

      {/* Subtitle Display */}
      <SubtitleDisplay currentText={currentSubtitleText} isVisible={isSubtitleVisible} position="bottom" />

      {/* Subtitle Toggle Button */}
      <div className="absolute top-8 right-8 z-40">
        <button
          onClick={() => {
            setSubtitlesEnabled(!subtitlesEnabled);
            if (!subtitlesEnabled) {
              // If enabling subtitles and there's current text, show it
              if (currentSubtitleText) {
                setIsSubtitleVisible(true);
              }
            } else {
              // If disabling subtitles, hide them immediately
              setIsSubtitleVisible(false);
            }
          }}
          className={`
            px-4 py-3 backdrop-blur-md border rounded-xl
            transition-all duration-200 font-medium text-sm
            ${
              subtitlesEnabled
                ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                : "bg-black/20 border-white/10 text-white/40 hover:bg-black/30"
            }
          `}
          title={subtitlesEnabled ? "Hide Subtitles" : "Show Subtitles"}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">💬</span>
            <span>{subtitlesEnabled ? "Hide" : "Show"}</span>
          </div>
        </button>
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
