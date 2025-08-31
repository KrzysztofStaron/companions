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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
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

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        setIsRecording(false);
        onListeningChange(false);
        if (transcript.trim()) {
          handleVoiceMessage(transcript);
        }
      };

      recognition.onerror = event => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        onListeningChange(false);
      };
    }
  }, [onListeningChange]);

  // Handle audio playback
  useEffect(() => {
    if (audioElement) {
      audioElement.play().catch(console.error);
    }
  }, [audioElement]);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceMessage = async (voiceText: string) => {
    if (!voiceText.trim() || isProcessing) return;

    setIsProcessing(true);
    setTranscript("");

    const userMessage: ChatMessage = {
      role: "user",
      content: voiceText.trim(),
    };

    // Add user message
    onMessage(userMessage);

    try {
      // Get AI response
      const aiResponse = await chatWithAI([userMessage], availableAnimations);

      // Add AI response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse.response,
      };
      onMessage(assistantMessage);

      // Handle animation request if present
      if (aiResponse.animationRequest) {
        onAnimationRequest(aiResponse.animationRequest);
      }

      // Handle audio if present
      if (aiResponse.audioUrl) {
        const audio = new Audio(aiResponse.audioUrl);
        setAudioElement(audio);
      }
    } catch (error) {
      console.error("Error in voice chat:", error);
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

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Voice Recording Button */}
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-out
                   ${
                     isRecording
                       ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                       : "bg-white/20 hover:bg-white/30 border border-white/30"
                   } 
                   ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                   backdrop-blur-md`}
      >
        {isRecording ? (
          <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
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

      {/* Recording Status */}
      {isRecording && (
        <div className="text-white text-sm bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
          Listening... {transcript && `"${transcript}"`}
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="text-white text-sm bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
          Processing your message...
        </div>
      )}

      {/* Instructions */}
      <div className="text-white/60 text-xs text-center max-w-xs">
        {isRecording ? "Speak now... Click again to stop" : "Click to start voice chat"}
      </div>
    </div>
  );
}
