"use client";

import ModelViewer from "./components/ModelViewer";
import LiquidGlass from "./components/ui/LiquidGlass";
import AnimationStateMachine from "./components/AnimationStateMachine";
import VoiceChat from "./components/VoiceChat";
import SubtitleDisplay from "./components/SubtitleDisplay";
import { useState, useEffect, useRef, useMemo } from "react";
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

  // Dynamic border radius based on input lines
  const [inputBorderRadius, setInputBorderRadius] = useState(50);

  // Ref for textarea to access its dimensions
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track current textarea height for reactive updates
  const [textareaHeight, setTextareaHeight] = useState(40);

  // Calculate border radius based on textarea height
  const calculateBorderRadius = () => {
    if (!textareaRef.current) return 50;

    const textarea = textareaRef.current;
    const minHeight = 40; // 2.5rem = 40px (single line)
    const twoLineHeight = 60; // Approximate height for 2 lines
    const currentHeight = textarea.scrollHeight;

    const baseRadius = 50; // Maximum radius for 1-2 lines
    const minRadius = 12; // Minimum radius for 3+ lines

    if (currentHeight <= twoLineHeight) return baseRadius;

    // Jump immediately to 4-line level when 3+ lines
    return minRadius;
  };

  // Determine if input has multiple lines based on height
  const hasMultipleLines = useMemo(() => {
    // Only switch to bottom alignment when textarea is significantly taller
    // This prevents premature switching on first character
    const multiLineThreshold = 50; // 50px instead of 40px
    return textareaHeight > multiLineThreshold;
  }, [textareaHeight]);

  // Update border radius when input value changes
  useEffect(() => {
    setInputBorderRadius(calculateBorderRadius());
  }, [inputValue]);

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
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);

  useEffect(() => {
    setAvailableAnimations(getAvailableAnimationsForLLM());
  }, []);

  // Get available animations for the LLM
  useEffect(() => {
    setAvailableAnimations(getAvailableAnimationsForLLM());
  }, []);

  // No longer using the global background state polling - managing state locally for better control

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
        // Helper to wait for first chunk from stream and show subtitle
        const waitForFirstChunkAndShowSubtitle = async (
          stream: ReadableStream<Uint8Array>,
          text: string
        ): Promise<ReadableStream<Uint8Array>> => {
          const reader = stream.getReader();
          const chunks: Uint8Array[] = [];

          // Read the first chunk
          const firstResult = await reader.read();
          if (firstResult.done) {
            throw new Error("Stream ended before first chunk");
          }

          // Show subtitle when first chunk arrives
          showSubtitle(text);

          // Collect all remaining chunks
          chunks.push(firstResult.value);
          while (true) {
            const result = await reader.read();
            if (result.done) break;
            chunks.push(result.value);
          }

          // Create a new stream with all chunks
          return new ReadableStream({
            start(controller) {
              for (const chunk of chunks) {
                controller.enqueue(chunk);
              }
              controller.close();
            },
          });
        };

        // Helper to play a segment audio URL or stream and wait for completion
        const playAudioAndWait = async (audio: string | ReadableStream<Uint8Array>) => {
          try {
            if (typeof audio === "string") {
              // Handle URL case
              await new Promise<void>((resolve, reject) => {
                const audioElement = new Audio(audio);
                const cleanup = () => {
                  audioElement.removeEventListener("ended", onEnded);
                  audioElement.removeEventListener("error", onError);
                };
                const onEnded = () => {
                  cleanup();
                  resolve();
                };
                const onError = () => {
                  cleanup();
                  resolve();
                };
                audioElement.addEventListener("ended", onEnded);
                audioElement.addEventListener("error", onError);
                // Start playback; if it fails, resolve and continue with estimates
                audioElement.play().catch(() => resolve());
              });
            } else {
              // Handle stream case
              await playStreamAndWait(audio);
            }
          } catch {
            // Ignore; will fallback to estimated delay by caller
          }
        };

        const playStreamAndWait = async (stream: ReadableStream<Uint8Array>): Promise<void> => {
          return new Promise((resolve, reject) => {
            const audioContext = new AudioContext();
            const reader = stream.getReader();
            const chunks: Uint8Array[] = [];

            const processStream = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    // All chunks received, decode and play
                    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                    const audioBuffer = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of chunks) {
                      audioBuffer.set(chunk, offset);
                      offset += chunk.length;
                    }

                    const buffer = await audioContext.decodeAudioData(audioBuffer.buffer.slice());
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.onended = () => resolve();
                    source.start();
                    break;
                  }
                  chunks.push(value);
                }
              } catch (error) {
                reject(error);
              }
            };

            processStream();
          });
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
          const streams = aiResponse.synchronizedSpeechAudioStreams || [];

          console.group("🎬 Synchronized Speech Playback");
          console.log(`📊 Starting playback of ${segments.length} segments`);
          console.table(
            segments.map((seg, i) => ({
              Segment: i + 1,
              Text: seg.text.substring(0, 40) + (seg.text.length > 40 ? "..." : ""),
              "Start Anim": seg.animation_on_start ? `${seg.animation_on_start.type}` : "❌",
              "End Anim": seg.animation_on_end ? `${seg.animation_on_end.type}` : "❌",
              "Has Audio": streams[i] ? "✅" : "❌",
            }))
          );

          // Play segments sequentially, triggering animations at boundaries
          (async () => {
            try {
              for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];

                console.groupCollapsed(`🎬 Segment ${i + 1}/${segments.length}`);
                console.log(`📝 Text: "${seg.text}"`);

                // Handle audio stream with first chunk detection
                const stream = streams[i];
                if (stream) {
                  try {
                    // Wait for first chunk and get the new stream
                    const audioStream = await waitForFirstChunkAndShowSubtitle(stream, seg.text);

                    // Start animation for segment
                    if (seg.animation_on_start) {
                      const cfg = seg.animation_on_start;
                      console.group(`🎭 Starting Animation: ${cfg.type}`);
                      console.log(`🎯 Animation: ${cfg.name}`);
                      try {
                        let success = false;
                        if (cfg.type === "start_loop") {
                          success = (window as any).startLoopByDescription(cfg.name);
                        } else if (cfg.type === "play_once" || cfg.type === "emphasis") {
                          success = (window as any).playOnceByDescription(cfg.name);
                        }
                        console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
                      } catch (error) {
                        console.error("❌ Animation start error:", error);
                      }
                      console.groupEnd();
                    }

                    // Play audio using the new stream
                    console.group("🔊 Audio Playback");
                    console.time(`Audio Segment ${i + 1}`);
                    console.log("🎵 Playing audio stream...");
                    await playAudioAndWait(audioStream);
                    console.timeEnd(`Audio Segment ${i + 1}`);
                    console.groupEnd();
                  } catch (error) {
                    console.error("❌ Error processing segment:", error);
                    // Fallback: show subtitle immediately
                    showSubtitle(seg.text);
                  }
                } else {
                  // No audio stream, show subtitle immediately
                  showSubtitle(seg.text);

                  // Start animation for segment
                  if (seg.animation_on_start) {
                    const cfg = seg.animation_on_start;
                    console.group(`🎭 Starting Animation: ${cfg.type}`);
                    console.log(`🎯 Animation: ${cfg.name}`);
                    try {
                      let success = false;
                      if (cfg.type === "start_loop") {
                        success = (window as any).startLoopByDescription(cfg.name);
                      } else if (cfg.type === "play_once" || cfg.type === "emphasis") {
                        success = (window as any).playOnceByDescription(cfg.name);
                      }
                      console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
                    } catch (error) {
                      console.error("❌ Animation start error:", error);
                    }
                    console.groupEnd();
                  }

                  // Fallback: estimate timing if no stream
                  const estimatedDuration = Math.max(1000, seg.text.length * 50);
                  console.warn(`⚠️ No audio stream, using estimated duration: ${estimatedDuration}ms`);
                  console.group("🔊 Audio Playback");
                  console.time(`Estimated Wait ${i + 1}`);
                  await new Promise(res => setTimeout(res, estimatedDuration));
                  console.timeEnd(`Estimated Wait ${i + 1}`);
                  console.groupEnd();
                }

                // End animation for segment
                if (seg.animation_on_end) {
                  const cfg = seg.animation_on_end;
                  console.group(`🎭 Ending Animation: ${cfg.type}`);
                  if (cfg.name) console.log(`🎯 Animation: ${cfg.name}`);
                  try {
                    let success = false;
                    if (cfg.type === "stop_loop" || cfg.type === "return_idle") {
                      success = (window as any).stopLoopReturnIdle();
                    } else if (cfg.type === "play_once" && cfg.name) {
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

          // Note: Subtitle will be shown when first audio chunk arrives

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
        // Note: Subtitle will be shown when first audio chunk arrives
        if (
          !aiResponse.synchronizedSpeech &&
          !aiResponse.animationRequest &&
          (aiResponse.backgroundRequest?.say || aiResponse.response)
        ) {
          const speechText = aiResponse.backgroundRequest?.say || aiResponse.response;
          console.log("💬 Simple speech:", speechText);
        }

        // Play TTS audio if available with first chunk detection
        if (aiResponse.audioStream) {
          console.log("🔊 Playing TTS audio with first chunk detection");

          // Get the text for subtitle
          const speechText =
            aiResponse.animationRequest?.say || aiResponse.backgroundRequest?.say || aiResponse.response;

          // Wait for first chunk before showing subtitle
          waitForFirstChunkAndShowSubtitle(aiResponse.audioStream, speechText)
            .then(audioStream => {
              // Now play the audio
              playAudio(audioStream);
            })
            .catch(error => {
              console.error("❌ Error waiting for first chunk:", error);
              // Fallback: show subtitle immediately
              if (speechText) {
                showSubtitle(speechText);
              }
            });

          // Estimate subtitle duration based on text length for simple speech
          if (!aiResponse.synchronizedSpeech && speechText) {
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

      // Helper to wait for first chunk from stream and show subtitle
      const waitForFirstChunkAndShowSubtitle = async (
        stream: ReadableStream<Uint8Array>,
        text: string
      ): Promise<ReadableStream<Uint8Array>> => {
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        // Read the first chunk
        const firstResult = await reader.read();
        if (firstResult.done) {
          throw new Error("Stream ended before first chunk");
        }

        // Show subtitle when first chunk arrives
        showSubtitle(text);

        // Collect all remaining chunks
        chunks.push(firstResult.value);
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          chunks.push(result.value);
        }

        // Create a new stream with all chunks
        return new ReadableStream({
          start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(chunk);
            }
            controller.close();
          },
        });
      };

      // Helper to play audio stream and wait for completion
      const playStreamAndWait = async (stream: ReadableStream<Uint8Array>): Promise<void> => {
        return new Promise((resolve, reject) => {
          const audioContext = new AudioContext();
          const reader = stream.getReader();
          const chunks: Uint8Array[] = [];

          const processStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  // All chunks received, decode and play
                  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                  const audioBuffer = new Uint8Array(totalLength);
                  let offset = 0;
                  for (const chunk of chunks) {
                    audioBuffer.set(chunk, offset);
                    offset += chunk.length;
                  }

                  const buffer = await audioContext.decodeAudioData(audioBuffer.buffer.slice());
                  const source = audioContext.createBufferSource();
                  source.buffer = buffer;
                  source.connect(audioContext.destination);
                  source.onended = () => resolve();
                  source.start();
                  break;
                }
                chunks.push(value);
              }
            } catch (error) {
              reject(error);
            }
          };

          processStream();
        });
      };

      // Get AI response with animation request
      const aiResponse = await chatWithAI([userMessage], availableAnimations);

      // Set greeting complete as soon as response generation finishes
      setGreetingComplete(true);

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
        const streams = aiResponse.synchronizedSpeechAudioStreams || [];

        console.group("🎬 Synchronized Speech Playback");
        console.log(`📊 Playing ${segments.length} segments`);

        // Play segments sequentially
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          const stream = streams[i];

          console.groupCollapsed(`🎬 Segment ${i + 1}/${segments.length}`);
          console.log(`📝 Text: "${seg.text}"`);

          // Handle audio stream with first chunk detection
          if (stream) {
            try {
              // Wait for first chunk and get the new stream
              const audioStream = await waitForFirstChunkAndShowSubtitle(stream, seg.text);
              // Replace the stream in the streams array for consistency
              streams[i] = audioStream;

              // Start animation for segment
              if (seg.animation_on_start) {
                const cfg = seg.animation_on_start;
                console.group(`🎭 Starting Animation: ${cfg.type}`);
                console.log(`🎯 Animation: ${cfg.name}`);
                try {
                  let success = false;
                  if (cfg.type === "start_loop") {
                    success = (window as any).startLoopByDescription(cfg.name);
                  } else if (cfg.type === "play_once" || cfg.type === "emphasis") {
                    success = (window as any).playOnceByDescription(cfg.name);
                  }
                  console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
                } catch (error) {
                  console.error("❌ Animation start error:", error);
                }
                console.groupEnd();
              }

              // Play audio using the new stream
              await playStreamAndWait(audioStream);

              // End animation for segment
              if (seg.animation_on_end) {
                const cfg = seg.animation_on_end;
                console.group(`🎭 Ending Animation: ${cfg.type}`);
                if (cfg.name) console.log(`🎯 Animation: ${cfg.name}`);
                try {
                  let success = false;
                  if (cfg.type === "stop_loop" || cfg.type === "return_idle") {
                    success = (window as any).stopLoopReturnIdle();
                  } else if (cfg.type === "play_once" && cfg.name) {
                    success = (window as any).playOnceByDescription(cfg.name);
                  }
                  console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
                } catch (error) {
                  console.error("❌ Animation end error:", error);
                }
                console.groupEnd();
              }
            } catch (error) {
              console.error("❌ Error processing segment:", error);
              // Fallback: show subtitle immediately
              showSubtitle(seg.text);
            }
          } else {
            // No audio stream, show subtitle immediately
            showSubtitle(seg.text);

            // Start animation for segment
            if (seg.animation_on_start) {
              const cfg = seg.animation_on_start;
              console.group(`🎭 Starting Animation: ${cfg.type}`);
              console.log(`🎯 Animation: ${cfg.name}`);
              try {
                let success = false;
                if (cfg.type === "start_loop") {
                  success = (window as any).startLoopByDescription(cfg.name);
                } else if (cfg.type === "play_once" || cfg.type === "emphasis") {
                  success = (window as any).playOnceByDescription(cfg.name);
                }
                console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
              } catch (error) {
                console.error("❌ Animation start error:", error);
              }
              console.groupEnd();
            }

            // Wait based on text length
            const estimatedDuration = Math.max(1000, seg.text.length * 50);
            console.warn(`⚠️ No audio stream, using estimated duration: ${estimatedDuration}ms`);
            await new Promise(resolve => setTimeout(resolve, estimatedDuration));

            // End animation for segment
            if (seg.animation_on_end) {
              const cfg = seg.animation_on_end;
              console.group(`🎭 Ending Animation: ${cfg.type}`);
              if (cfg.name) console.log(`🎯 Animation: ${cfg.name}`);
              try {
                let success = false;
                if (cfg.type === "stop_loop" || cfg.type === "return_idle") {
                  success = (window as any).stopLoopReturnIdle();
                } else if (cfg.type === "play_once" && cfg.name) {
                  success = (window as any).playOnceByDescription(cfg.name);
                }
                console.log(`${success ? "✅" : "❌"} Result: ${success ? "Success" : "Failed"}`);
              } catch (error) {
                console.error("❌ Animation end error:", error);
              }
              console.groupEnd();
            }
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
        const speechText = aiResponse.animationRequest.say;

        // Handle audio stream with first chunk detection
        if (aiResponse.audioStream) {
          console.log("🔊 Playing TTS audio with first chunk detection for animation");

          waitForFirstChunkAndShowSubtitle(aiResponse.audioStream, speechText)
            .then(audioStream => {
              // Now play the audio
              playAudio(audioStream);
            })
            .catch(error => {
              console.error("❌ Error waiting for first chunk in animation:", error);
              // Fallback: show subtitle immediately
              showSubtitle(speechText);
            });

          // Use the global playAnimationByDescription function
          if ((window as any).playAnimationByDescription) {
            const success = (window as any).playAnimationByDescription(
              aiResponse.animationRequest.animationDescription
            );
            console.log("🎯 Animation result:", success);

            if (success) {
              const estimatedDuration = Math.max(2000, speechText.length * 100);
              setTimeout(() => hideSubtitle(), estimatedDuration);
            }
          } else {
            const estimatedDuration = Math.max(2000, speechText.length * 80);
            setTimeout(() => hideSubtitle(), estimatedDuration);
          }
        } else {
          // No audio stream, show subtitle immediately
          showSubtitle(speechText);

          // Use the global playAnimationByDescription function
          if ((window as any).playAnimationByDescription) {
            const success = (window as any).playAnimationByDescription(
              aiResponse.animationRequest.animationDescription
            );
            console.log("🎯 Animation result:", success);

            if (success) {
              const estimatedDuration = Math.max(2000, speechText.length * 100);
              setTimeout(() => hideSubtitle(), estimatedDuration);
            }
          } else {
            const estimatedDuration = Math.max(2000, speechText.length * 80);
            setTimeout(() => hideSubtitle(), estimatedDuration);
          }
        }
      }
      // Handle simple speech
      else {
        const speechText = aiResponse.backgroundRequest?.say || aiResponse.response;
        console.log("💬 Simple speech:", speechText);

        // Play TTS audio if available with first chunk detection
        if (aiResponse.audioStream) {
          console.log("🔊 Playing TTS audio with first chunk detection");

          waitForFirstChunkAndShowSubtitle(aiResponse.audioStream, speechText)
            .then(audioStream => {
              // Now play the audio
              playAudio(audioStream);
            })
            .catch(error => {
              console.error("❌ Error waiting for first chunk in greeting:", error);
              // Fallback: show subtitle immediately
              showSubtitle(speechText);
            });

          const estimatedDuration = Math.max(2000, speechText.length * 80);
          setTimeout(() => hideSubtitle(), estimatedDuration);
        } else {
          // No audio, show subtitle immediately
          showSubtitle(speechText);
          const estimatedDuration = Math.max(2000, speechText.length * 80);
          setTimeout(() => hideSubtitle(), estimatedDuration);
        }
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md">
        <LiquidGlass
          borderRadius={inputBorderRadius}
          blur={0.5}
          contrast={0.5}
          brightness={0.5}
          saturation={0.5}
          shadowIntensity={0.1}
          justifyContent="start"
        >
          <div className={`flex w-full pl-4 pr-2 py-2 ${hasMultipleLines ? "items-end" : "items-center"}`}>
            <textarea
              ref={textareaRef}
              placeholder={
                !animationSystemReady
                  ? "Loading animation system..."
                  : isLoading
                  ? "AI is thinking..."
                  : "Chat with AI to see animations..."
              }
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleInputSubmit();
                }
              }}
              disabled={isLoading || !animationSystemReady}
              spellCheck={false}
              rows={1}
              className="flex-1 min-w-0 py-2 pr-2 bg-transparent border-none outline-none
                       text-white placeholder-white/60 text-lg disabled:opacity-50 resize-none
                       overflow-y-auto min-h-[2.5rem] max-h-32 scrollbar-hide"
              style={{
                height: "auto",
                minHeight: "2.5rem",
                borderRadius: `${inputBorderRadius}px`,
                paddingRight:
                  textareaRef.current && textareaRef.current.scrollHeight > textareaRef.current.clientHeight
                    ? "16px"
                    : "8px",
              }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
                // Update border radius and height based on new dimensions
                setTextareaHeight(target.scrollHeight);
                setInputBorderRadius(calculateBorderRadius());
                // Update scrollbar padding dynamically
                target.style.paddingRight = target.scrollHeight > target.clientHeight ? "16px" : "8px";
              }}
            />
            <button
              onClick={handleInputSubmit}
              disabled={isLoading || !animationSystemReady || !inputValue.trim()}
              className={`
                ${hasMultipleLines ? "p-2" : "p-3"} m-0 shrink-0 transition-all duration-200
                ${hasMultipleLines ? "self-end" : "self-center"}
                ${hasMultipleLines ? "mb-0" : "mr-0.5"}
                ${
                  isLoading || !animationSystemReady || !inputValue.trim()
                    ? "bg-transparent opacity-30 cursor-not-allowed"
                    : "bg-white/20 backdrop-blur-sm opacity-70 hover:opacity-100 hover:scale-105"
                }
              `}
              style={{
                borderRadius: `${inputBorderRadius}px`,
              }}
              title="Send message"
            >
              <svg
                width={hasMultipleLines ? "14" : "18"}
                height={hasMultipleLines ? "14" : "18"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white m-auto"
              >
                <path d="M22 2L11 13" />
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
}
