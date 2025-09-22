"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, AnimationRequest, chatWithAI } from "../actions/chat";
import { useAudioPermission } from "./AudioPermissionManager";
import { AnimationState } from "./AnimationStateMachine";

interface ChatInterfaceProps {
  availableAnimations: string[];
  onAnimationRequest: (request: AnimationRequest) => void;
  animationState: AnimationState;
}

export default function ChatInterface({ availableAnimations, onAnimationRequest, animationState }: ChatInterfaceProps) {
  const { playAudio } = useAudioPermission();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Audio playback is now handled by the AudioPermissionManager

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue.trim(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Get AI response
      const aiResponse = await chatWithAI([...messages, userMessage], availableAnimations);

      // Add AI response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse.response,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Handle animation request if present
      if (aiResponse.animationRequest) {
        onAnimationRequest(aiResponse.animationRequest);
      }

      // Handle audio if present
      if (aiResponse.audioUrl) {
        playAudio(aiResponse.audioUrl);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-40">
      {/* Chat Messages */}
      <div className="mb-4 max-h-64 overflow-y-auto bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/20">
        {messages.length === 0 && (
          <div className="text-white/60 text-center py-4">Start a conversation with your AI companion...</div>
        )}

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

        {isLoading && (
          <div className="text-left">
            <div className="inline-block max-w-xs px-3 py-2 rounded-lg bg-white/20 text-white">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          spellCheck={false}
          className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl
                   text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30
                   focus:border-white/40 transition-all duration-300 ease-out
                   hover:bg-white/15 hover:border-white/30 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-white/20 
                   hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed
                   backdrop-blur-md border border-white/30 rounded-lg text-white 
                   transition-all duration-200 font-medium"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>

      {/* Animation State Indicator */}
      {animationState.currentAnimation && (
        <div className="mt-2 text-center">
          <span
            className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 
                         rounded-lg text-white text-sm"
          >
            Playing: {animationState.currentAnimation}
          </span>
        </div>
      )}
    </div>
  );
}
