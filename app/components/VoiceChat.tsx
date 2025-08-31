"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, AnimationRequest, chatWithAI } from "../actions/chat";

interface VoiceChatProps {
  availableAnimations: string[];
  onAnimationRequest: (request: AnimationRequest) => void;
  onMessage: (message: ChatMessage) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export default function VoiceChat({
  availableAnimations,
  onAnimationRequest,
  onMessage,
  isListening,
  onListeningChange,
}: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("🎤 Speech recognition started");
        setIsRecording(true);
        onListeningChange(true);
      };

      recognition.onresult = event => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript + interimTranscript;
        setTranscript(currentTranscript);
        console.log("🎤 Transcript:", currentTranscript);
      };

      recognition.onend = () => {
        console.log("🎤 Speech recognition ended");
        setIsRecording(false);
        onListeningChange(false);
        if (transcript.trim()) {
          handleVoiceMessage(transcript);
        }
      };

      recognition.onerror = event => {
        console.error("🎤 Speech recognition error:", event.error);
        setIsRecording(false);
        onListeningChange(false);
      };
    }
  }, [onListeningChange, transcript]);

  // Handle audio playback
  useEffect(() => {
    if (audioElement) {
      audioElement.play().catch(console.error);
    }
  }, [audioElement]);

  const startRecording = async () => {
    if (recognitionRef.current && !isRecording) {
      console.log("🎤 Starting voice recording...");
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("🎤 Error starting recognition:", error);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      console.log("🎤 Stopping voice recording...");
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("🎤 Error stopping recognition:", error);
      }
    }
  };

  const handleVoiceMessage = async (voiceText: string) => {
    if (!voiceText.trim() || isProcessing) return;

    console.log("🎤 Processing voice message:", voiceText);
    setIsProcessing(true);
    setTranscript("");

    const userMessage: ChatMessage = {
      role: "user",
      content: voiceText.trim(),
    };

    onMessage(userMessage);

    try {
      const aiResponse = await chatWithAI([userMessage], availableAnimations);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse.animationRequest?.say || aiResponse.response,
      };
      onMessage(assistantMessage);

      if (aiResponse.animationRequest) {
        onAnimationRequest(aiResponse.animationRequest);
      }

      // Play TTS audio if available
      if (aiResponse.audioUrl) {
        console.log("🔊 Playing TTS audio");
        const audio = new Audio(aiResponse.audioUrl);
        setAudioElement(audio);
      }
    } catch (error) {
      console.error("🎤 Error in voice chat:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      onMessage(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Check if speech recognition is supported
  const isSpeechSupported =
    typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  if (!isSpeechSupported) {
    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-gray-500/30 flex items-center justify-center border border-gray-400/30">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H9a1 1 0 100 2h2a1 1 0 100-2v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-white/50 text-xs text-center">Voice chat not supported</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Clean Voice Recording Button */}
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                   ${
                     isRecording
                       ? "bg-red-500 shadow-lg shadow-red-500/30 scale-105"
                       : "bg-white/20 hover:bg-white/30 border border-white/30 hover:scale-105"
                   } 
                   ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                   backdrop-blur-md`}
      >
        {isRecording ? (
          <div className="w-5 h-5 bg-white rounded-full animate-pulse" />
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H9a1 1 0 100 2h2a1 1 0 100-2v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Minimal Status - Only show when recording */}
      {isRecording && transcript && (
        <div className="text-white/80 text-sm bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg">"{transcript}"</div>
      )}

      {/* Simple Instructions */}
      <div className="text-white/50 text-xs text-center">{isRecording ? "Click to stop" : "Click to speak"}</div>
    </div>
  );
}
