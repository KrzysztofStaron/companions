"use client";

import { useEffect, useState } from "react";

interface ParallaxBackgroundProps {
  /** Camera azimuthal angle (horizontal rotation) */
  azimuthal?: number;
  /** Camera polar angle (vertical rotation) */
  polar?: number;
  /** Custom background image URL (optional) */
  backgroundUrl?: string;
}

export default function ParallaxBackground({ azimuthal = 0, polar = 0, backgroundUrl }: ParallaxBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging for background changes
  useEffect(() => {
    if (backgroundUrl) {
      console.log("🖼️ ParallaxBackground: New background URL received:", backgroundUrl.substring(0, 100) + "...");
    } else {
      console.log("🖼️ ParallaxBackground: No background URL, showing gradient");
    }
  }, [backgroundUrl]);

  if (!mounted) return null;

  // Calculate parallax offset based on camera rotation
  // Convert camera angles to background movement
  const parallaxStrength = 80; // Increased strength for limited camera range
  const rotationStrength = 8; // Slightly increased rotation for limited range

  // Horizontal (azimuthal) movement and rotation enabled, vertical (polar) disabled
  const offsetX = Math.sin(azimuthal) * parallaxStrength; // Horizontal movement as camera pans left/right
  const offsetY = 0; // No vertical movement since polar rotation is locked

  // Background rotation based on horizontal camera panning
  const backgroundRotation = azimuthal * rotationStrength;

  // Only show background if backgroundUrl is provided
  if (!backgroundUrl) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Clean gradient background when no image is set */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main background image with parallax and blur */}
      <div
        className="absolute inset-0 w-[110%] h-[110%] -left-[5%] -top-[5%] 
                   bg-cover bg-center bg-no-repeat
                   transition-all duration-1000 ease-out"
        style={{
          backgroundImage: `url('${backgroundUrl}')`,
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) rotateZ(${backgroundRotation}deg)`,
          filter: "blur(8px) brightness(0.7) contrast(1.1)",
        }}
      />

      {/* Additional blur overlay for extra depth */}
      <div
        className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%]
                   bg-cover bg-center bg-no-repeat opacity-30
                   transition-all duration-1000 ease-out"
        style={{
          backgroundImage: `url('${backgroundUrl}')`,
          transform: `translate(${offsetX * 1.5}px, ${offsetY * 1.5}px) rotate(${backgroundRotation * 0.7}deg)`,
          filter: "blur(20px) brightness(0.4)",
        }}
      />

      {/* Dark overlay to ensure character visibility */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
