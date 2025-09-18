"use client";

import { useEffect, useState } from "react";

interface SubtitleDisplayProps {
  currentText?: string;
  isVisible?: boolean;
  position?: "bottom" | "center" | "top";
  className?: string;
}

export default function SubtitleDisplay({
  currentText = "",
  isVisible = false,
  position = "bottom",
  className = "",
}: SubtitleDisplayProps) {
  const [displayText, setDisplayText] = useState("");
  const [fadeClass, setFadeClass] = useState("");

  useEffect(() => {
    if (isVisible && currentText) {
      // Fade in new text
      setFadeClass("opacity-0");
      setDisplayText(currentText);

      // Quick fade in
      const fadeInTimer = setTimeout(() => {
        setFadeClass("opacity-100");
      }, 50);

      return () => clearTimeout(fadeInTimer);
    } else if (!isVisible) {
      // Fade out
      setFadeClass("opacity-0");
      const clearTimer = setTimeout(() => {
        setDisplayText("");
      }, 300);

      return () => clearTimeout(clearTimer);
    }
  }, [currentText, isVisible]);

  if (!displayText && !isVisible) return null;

  const positionClasses = {
    bottom: "bottom-24 left-1/2 transform -translate-x-1/2",
    center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
    top: "top-24 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-4xl px-6 ${className}`}>
      <div
        className={`
          bg-black/70 backdrop-blur-lg border border-white/20 rounded-2xl 
          px-6 py-4 shadow-2xl transition-all duration-300 ease-out
          ${fadeClass}
        `}
      >
        <p className="text-white text-lg font-medium text-center leading-relaxed">{displayText}</p>
      </div>
    </div>
  );
}
