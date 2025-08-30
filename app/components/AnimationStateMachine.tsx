"use client";

import { useEffect, useRef, useState } from "react";
import { getAnimationFileByDescription } from "./animation-loader";

export interface AnimationState {
  currentAnimation: string | null;
  isPlaying: boolean;
  queue: string[];
}

interface AnimationStateMachineProps {
  availableAnimations: string[];
  onAnimationChange: (animationName: string) => void;
  onStateChange: (state: AnimationState) => void;
}

export default function AnimationStateMachine({
  availableAnimations,
  onAnimationChange,
  onStateChange,
}: AnimationStateMachineProps) {
  const [state, setState] = useState<AnimationState>({
    currentAnimation: null,
    isPlaying: false,
    queue: [],
  });

  const idleAnimation = "Masculine idle with calm presence and relaxed energy";
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to play an animation
  const playAnimation = (animationName: string, duration?: number) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update state
    const newState: AnimationState = {
      currentAnimation: animationName,
      isPlaying: true,
      queue: [...state.queue],
    };

    setState(newState);
    onStateChange(newState);
    onAnimationChange(animationName);

    // Set timeout to return to idle
    const animationDuration = duration || 5000; // Default 5 seconds
    timeoutRef.current = setTimeout(() => {
      returnToIdle();
    }, animationDuration);
  };

  // Function to return to idle
  const returnToIdle = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const newState: AnimationState = {
      currentAnimation: idleAnimation,
      isPlaying: false,
      queue: [],
    };

    setState(newState);
    onStateChange(newState);
    onAnimationChange(idleAnimation);
  };

  // Function to queue multiple animations
  const queueAnimations = (animations: string[]) => {
    if (animations.length === 0) return;

    const newState: AnimationState = {
      currentAnimation: animations[0],
      isPlaying: true,
      queue: animations.slice(1),
    };

    setState(newState);
    onStateChange(newState);
    onAnimationChange(animations[0]);

    // Play the first animation
    playAnimation(animations[0]);
  };

  // Function to stop current animation and return to idle
  const stopAnimation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    returnToIdle();
  };

  // Function to play animation by description
  const playAnimationByDescription = (description: string, duration?: number) => {
    // Check if the description exists in available animations
    if (availableAnimations.includes(description)) {
      playAnimation(description, duration);
    } else {
      console.warn(`Animation description "${description}" not found in available animations`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Expose functions globally
  useEffect(() => {
    (window as any).playAnimationByName = (name: string, duration?: number) => {
      if (availableAnimations.includes(name)) {
        playAnimation(name, duration);
      } else {
        console.warn(`Animation "${name}" not found`);
      }
    };

    (window as any).playAnimationByDescription = playAnimationByDescription;
    (window as any).returnToIdle = returnToIdle;
    (window as any).stopAnimation = stopAnimation;
    (window as any).queueAnimations = queueAnimations;
  }, [availableAnimations]);

  return null; // This component doesn't render anything, it just manages state
}
