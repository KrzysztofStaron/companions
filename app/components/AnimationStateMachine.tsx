"use client";

import { useEffect, useRef, useState } from "react";
import { getRandomIdleAnimation } from "./animation-loader";

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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleVariationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentIdleAnimationRef = useRef<string | null>(null);

  // Function to get a random idle animation
  const getRandomIdle = (): string => {
    const randomIdle = getRandomIdleAnimation();
    console.log(`🔄 Random idle selected: "${randomIdle.description}"`);
    return randomIdle.description;
  };

  // Function to start automatic idle animation variation
  const startIdleVariation = (intervalMs: number = 10000) => {
    // Default 10 seconds
    if (idleVariationTimerRef.current) {
      clearInterval(idleVariationTimerRef.current);
    }

    idleVariationTimerRef.current = setInterval(() => {
      if (!state.isPlaying) {
        // Only change if not playing another animation
        changeToNewRandomIdle();
      }
    }, intervalMs);
  };

  // Function to stop automatic idle animation variation
  const stopIdleVariation = () => {
    if (idleVariationTimerRef.current) {
      clearInterval(idleVariationTimerRef.current);
      idleVariationTimerRef.current = null;
    }
  };

  // Function to handle idle animation completion
  const onIdleAnimationComplete = () => {
    console.log(`🔄 Idle animation completed, cycling to next`);
    if (!state.isPlaying) {
      changeToNewRandomIdle();
    } else {
      console.log(`🔄 Idle cycling skipped - animation is playing`);
    }
  };

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
    // Don't call onAnimationChange here to avoid recursion - let parent handle playback

    // Set timeout to return to idle
    const animationDuration = duration || 5000; // Default 5 seconds
    timeoutRef.current = setTimeout(() => {
      returnToIdle();
    }, animationDuration);
  };

  // Function to return to idle
  const returnToIdle = () => {
    console.log(`🔄 Returning to idle state`);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const randomIdleAnimation = getRandomIdle();
    const newState: AnimationState = {
      currentAnimation: randomIdleAnimation,
      isPlaying: false,
      queue: [],
    };

    console.log(`🔄 Idle state updated: "${randomIdleAnimation}"`);
    setState(newState);
    onStateChange(newState);
    // Don't call onAnimationChange for idle state changes to avoid recursion
    // The parent component will handle the actual animation playback based on state changes
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

  // Function to change to a new random idle animation
  const changeToNewRandomIdle = () => {
    console.log(`🔄 Changing to new random idle animation`);
    const randomIdleAnimation = getRandomIdle();
    const newState: AnimationState = {
      currentAnimation: randomIdleAnimation,
      isPlaying: false,
      queue: [],
    };

    console.log(`🔄 New idle animation set: "${randomIdleAnimation}"`);
    currentIdleAnimationRef.current = randomIdleAnimation;
    setState(newState);
    onStateChange(newState);
    // Don't call onAnimationChange to avoid recursion - parent will handle based on state
    // But we do want to trigger the actual animation playback for manual idle changes
    if ((window as any).playAnimationByDescription) {
      (window as any).playAnimationByDescription(randomIdleAnimation);
    }

    // Set up completion handling for this idle animation
    // The ModelViewer should call onIdleAnimationComplete when the animation finishes
    console.log(`🔄 Waiting for idle animation to complete before cycling to next`);
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
      if (idleVariationTimerRef.current) {
        clearInterval(idleVariationTimerRef.current);
      }
    };
  }, []);

  // Start idle cycling automatically when component mounts
  useEffect(() => {
    console.log(`🔄 Component mounted - idle cycling enabled (based on animation completion)`);
    // No timer needed - will cycle when idle animations complete
  }, []);

  // Expose functions globally (avoiding conflicts with ModelViewer)
  useEffect(() => {
    // Only expose functions that don't conflict with ModelViewer
    (window as any).returnToIdle = returnToIdle;
    (window as any).stopAnimation = stopAnimation;
    (window as any).queueAnimations = queueAnimations;
    (window as any).changeToNewRandomIdle = changeToNewRandomIdle;
    (window as any).startIdleVariation = startIdleVariation;
    (window as any).stopIdleVariation = stopIdleVariation;
    (window as any).onIdleAnimationComplete = onIdleAnimationComplete;

    // Don't expose playAnimationByName or playAnimationByDescription to avoid conflicts
    // These will be handled directly through the ModelViewer
  }, [
    returnToIdle,
    stopAnimation,
    queueAnimations,
    changeToNewRandomIdle,
    startIdleVariation,
    stopIdleVariation,
    onIdleAnimationComplete,
  ]);

  return null; // This component doesn't render anything, it just manages state
}
