"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ANIMATION_FILES, ANIMATION_NAMES, getAvailableAnimationsForLLM } from "./animation-loader";
import CharacterSwitcher from "./CharacterSwitcher";
import ParallaxBackground from "./ParallaxBackground";
import { AnimationController } from "../lib/animation-controller";

// Character models with different shirt colors
const CHARACTER_MODELS = {
  character: "/models/character.glb",
  character2: "/models/character2.glb",
  character3: "/models/character3.glb",
};

interface AnimationData {
  name: string;
  clip: THREE.AnimationClip;
  duration: number;
  path: string;
}

function AvatarAnimator({
  character = "character",
  onError,
  onLoadingChange,
}: {
  character?: string;
  onError?: (error: string | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const { scene: characterScene } = useGLTF(
    CHARACTER_MODELS[character as keyof typeof CHARACTER_MODELS] || CHARACTER_MODELS.character
  );
  const modelRef = useRef<THREE.Group>(null);
  const controllerRef = useRef<AnimationController | null>(null);

  const [animations, setAnimations] = useState<AnimationData[]>([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const idleCycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent of error and loading state changes
  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Function to play a specific animation
  const playAnimation = (index: number) => {
    if (!controllerRef.current || index < 0 || index >= animations.length) return;

    console.log(`🎬 playAnimation called with index: ${index}, animation: ${animations[index]?.name || "undefined"}`);
    const animName = animations[index].name;
    const isIdleAnimation = animName.toLowerCase().includes("idle");

    // Clear any scheduled idle cycle to avoid mid-crossfade changes
    if (idleCycleTimerRef.current) {
      clearTimeout(idleCycleTimerRef.current);
      idleCycleTimerRef.current = null;
    }

    if (isIdleAnimation) {
      controllerRef.current.play(animName, THREE.LoopRepeat, Infinity);

      // Schedule gentle idle variation after a dwell time
      idleCycleTimerRef.current = setTimeout(() => {
        if ((window as any).changeToNewRandomIdle) {
          (window as any).changeToNewRandomIdle();
        }
      }, 12000);
    } else {
      controllerRef.current.playOnce(animName, () => {
        // Return to an idle with a crossfade when the non-idle action ends
        const idleIndex = animations.findIndex(a => a.name.toLowerCase().includes("idle"));
        if (idleIndex !== -1) {
          playAnimation(idleIndex);
        }
      });
    }

    setCurrentAnimationIndex(index);
    console.log(`🎬 Animation started: ${animName}, new current index: ${index}`);
  };

  // Load animations when character scene is ready
  useEffect(() => {
    if (!characterScene) return;

    async function loadAnimations() {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Starting to load animations...");
        const loadedAnimations: AnimationData[] = [];
        const loader = new GLTFLoader();

        // Load each animation file
        for (let i = 0; i < ANIMATION_FILES.length; i++) {
          try {
            const gltf = await new Promise<any>((resolve, reject) => {
              loader.load(ANIMATION_FILES[i].path, resolve, undefined, reject);
            });

            if (gltf.animations && gltf.animations.length > 0) {
              // Take the first animation clip from each file
              const clip = gltf.animations[0];
              loadedAnimations.push({
                name: ANIMATION_NAMES[i],
                clip: clip,
                duration: clip.duration,
                path: ANIMATION_FILES[i].path,
              });
            }
          } catch (err) {
            console.warn(`Failed to load animation ${ANIMATION_FILES[i].path}:`, err);
          }
        }

        console.log(`Loaded ${loadedAnimations.length} animations`);
        setAnimations(loadedAnimations);

        // Set up animation controller
        if (characterScene) {
          console.log("Setting up animation controller...");
          controllerRef.current = new AnimationController(characterScene, loadedAnimations, { crossFadeMs: 350 });

          // Start with a default idle
          const idleIndex = loadedAnimations.findIndex(a => a.name.toLowerCase().includes("idle"));
          if (idleIndex !== -1) {
            playAnimation(idleIndex);
          }

          // Idle variation is handled locally via idleCycleTimerRef
        } else {
          console.error("Character scene is null!");
          setError("Character scene failed to load");
        }
      } catch (err) {
        setError("Failed to load animations");
        console.error("Animation loading error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnimations();
  }, [characterScene]);

  // Function to play animation once with callback
  const playAnimationOnce = (index: number, onEnd?: () => void) => {
    if (!controllerRef.current || index < 0 || index >= animations.length) return;
    controllerRef.current.playOnce(animations[index].name, onEnd);
    setCurrentAnimationIndex(index);
  };

  // Function to stop all animations
  const stopAnimation = () => {
    controllerRef.current?.stop();
  };

  // Function to play animation by description
  const playAnimationByDescription = (description: string) => {
    console.log(`🎭 playAnimationByDescription called with: "${description}"`);
    console.log(
      `📚 Available animations:`,
      animations.map(a => a.name)
    );

    // Import the animation descriptions from the loader
    const availableDescriptions = getAvailableAnimationsForLLM();

    console.log(`🔍 Available descriptions:`, availableDescriptions);

    // First, try to find the exact description match
    const exactMatch = availableDescriptions.find((desc: string) => desc === description);
    if (exactMatch) {
      console.log(`✅ Found exact match: "${exactMatch}"`);
      // Find the corresponding animation by index
      const descriptionIndex = availableDescriptions.indexOf(exactMatch);
      if (descriptionIndex !== -1 && descriptionIndex < animations.length) {
        console.log(`🎯 Playing animation at index ${descriptionIndex}: ${animations[descriptionIndex].name}`);
        playAnimation(descriptionIndex);
        return true;
      }
    }

    // Fallback to keyword matching if no exact match
    console.log(`🔍 No exact match, trying keyword matching...`);
    const descriptionLower = description.toLowerCase();

    // Find animation by matching key words
    const animationIndex = animations.findIndex(anim => {
      const nameLower = anim.name.toLowerCase();

      console.log(`🔍 Checking animation: "${anim.name}" against description: "${description}"`);

      // Check if the description contains key words that match the animation
      if (descriptionLower.includes("idle") && nameLower.includes("idle")) {
        console.log(`✅ Matched idle: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("dance") && nameLower.includes("dance")) {
        console.log(`✅ Matched dance: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("run") && nameLower.includes("run")) {
        console.log(`✅ Matched run: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("walk") && nameLower.includes("walk")) {
        console.log(`✅ Matched walk: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("jog") && nameLower.includes("jog")) {
        console.log(`✅ Matched jog: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("talk") && nameLower.includes("talk")) {
        console.log(`✅ Matched talk: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("expression") && nameLower.includes("expression")) {
        console.log(`✅ Matched expression: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("crouch") && nameLower.includes("crouch")) {
        console.log(`✅ Matched crouch: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("falling") && nameLower.includes("falling")) {
        console.log(`✅ Matched falling: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("jump") && nameLower.includes("jump")) {
        console.log(`✅ Matched jump: "${anim.name}"`);
        return true;
      }
      if (descriptionLower.includes("strafe") && nameLower.includes("strafe")) {
        console.log(`✅ Matched strafe: "${anim.name}"`);
        return true;
      }

      return false;
    });

    if (animationIndex !== -1) {
      console.log(`🎯 SUCCESS: Found animation for description "${description}": ${animations[animationIndex].name}`);
      playAnimation(animationIndex);
      return true;
    } else {
      console.warn(`❌ FAILED: Animation with description "${description}" not found`);
      console.log(
        "📚 Available animations:",
        animations.map(a => a.name)
      );
      console.log(`🔍 Available descriptions:`, availableDescriptions);
      return false;
    }
  };

  // Update animation mixer on each frame
  useFrame((state, delta) => {
    controllerRef.current?.update(delta);
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleCycleTimerRef.current) {
        clearTimeout(idleCycleTimerRef.current);
      }
      controllerRef.current?.dispose();
    };
  }, []);

  // Expose animation functions to parent component
  useEffect(() => {
    // This allows the parent component to control animations
    (window as any).playAnimation = playAnimation;
    (window as any).playAnimationOnce = playAnimationOnce;
    (window as any).stopAnimation = stopAnimation;
    (window as any).playAnimationByDescription = playAnimationByDescription;
    (window as any).ANIMATION_NAMES = ANIMATION_NAMES;
    (window as any).animations = animations;
    (window as any).currentAnimationIndex = currentAnimationIndex;
  }, [animations, playAnimation, playAnimationOnce, stopAnimation, playAnimationByDescription, currentAnimationIndex]);

  return (
    <>
      {/* Invisible ground plane to create clean cutoff */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Character model with proper positioning and scaling */}
      {characterScene && (
        <primitive
          ref={modelRef}
          object={characterScene}
          scale={[1, 1, 1]}
          position={[0, -1.3, 0]}
          rotation={[0, 0, 0]}
        />
      )}
    </>
  );
}

export default function ModelViewer({
  showDebugUI = false,
  isListening = false,
  backgroundUrl = null,
}: {
  showDebugUI?: boolean;
  isListening?: boolean;
  backgroundUrl?: string | null;
}) {
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCharacter, setCurrentCharacter] = useState("character");
  const orbitControlsRef = useRef<any>(null);
  const [animationError, setAnimationError] = useState<string | null>(null);
  const [animationLoading, setAnimationLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const returnToCenterRef = useRef<number | null>(null);
  const [cameraRotation, setCameraRotation] = useState({ azimuthal: 0, polar: 0 });

  const nextAnimation = () => {
    const nextIndex = (currentAnimationIndex + 1) % ANIMATION_NAMES.length;
    setCurrentAnimationIndex(nextIndex);
    if ((window as any).playAnimation) {
      (window as any).playAnimation(nextIndex);
    }
  };

  const previousAnimation = () => {
    const prevIndex = currentAnimationIndex === 0 ? ANIMATION_NAMES.length - 1 : currentAnimationIndex - 1;
    setCurrentAnimationIndex(prevIndex);
    if ((window as any).playAnimation) {
      (window as any).playAnimation(prevIndex);
    }
  };

  const randomAnimation = () => {
    const randomIndex = Math.floor(Math.random() * ANIMATION_NAMES.length);
    setCurrentAnimationIndex(randomIndex);
    if ((window as any).playAnimation) {
      (window as any).playAnimation(randomIndex);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if ((window as any).playAnimation) {
      if (isPlaying) {
        // Pause - stop current animation
        if ((window as any).stopAnimation) {
          (window as any).stopAnimation();
        }
      } else {
        // Play - resume current animation
        (window as any).playAnimation(currentAnimationIndex);
      }
    }
  };

  // Function to smoothly return to center
  const returnToCenter = () => {
    if (!orbitControlsRef.current) return;

    const controls = orbitControlsRef.current;
    const currentAzimuth = controls.getAzimuthalAngle();

    // Cancel any existing return animation
    if (returnToCenterRef.current) {
      cancelAnimationFrame(returnToCenterRef.current);
      returnToCenterRef.current = null;
    }

    const startTime = Date.now();
    const duration = 1000; // 1 second

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const newAzimuth = currentAzimuth * (1 - easeOut);
      controls.setAzimuthalAngle(newAzimuth);

      if (progress < 1) {
        returnToCenterRef.current = requestAnimationFrame(animate);
      } else {
        controls.setAzimuthalAngle(0);
        returnToCenterRef.current = null;
      }
    };

    returnToCenterRef.current = requestAnimationFrame(animate);
  };

  // Handle rotation start
  const handleRotationStart = () => {
    setIsRotating(true);
    // Cancel any return to center animation
    if (returnToCenterRef.current) {
      cancelAnimationFrame(returnToCenterRef.current);
      returnToCenterRef.current = null;
    }
  };

  // Handle rotation end
  const handleRotationEnd = () => {
    setIsRotating(false);
    // Start return to center after a short delay
    setTimeout(() => {
      if (!isRotating) {
        returnToCenter();
      }
    }, 500);
  };

  // Handle character change
  const handleCharacterChange = (character: string) => {
    setCurrentCharacter(character);
  };

  // Camera rotation tracking for background movement
  useEffect(() => {
    const updateCameraRotation = () => {
      if (orbitControlsRef.current) {
        const controls = orbitControlsRef.current;
        setCameraRotation({
          azimuthal: controls.getAzimuthalAngle(),
          polar: controls.getPolarAngle(),
        });
      }
    };

    // Update camera rotation on animation frame for smooth tracking
    let animationId: number;
    const animate = () => {
      updateCameraRotation();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Cleanup return to center animation on unmount
  useEffect(() => {
    return () => {
      if (returnToCenterRef.current) {
        cancelAnimationFrame(returnToCenterRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* Parallax Background */}
      <ParallaxBackground
        azimuthal={cameraRotation.azimuthal}
        polar={cameraRotation.polar}
        backgroundUrl={backgroundUrl || undefined}
      />

      <Canvas camera={{ position: [0, 8, 2], fov: 75 }} style={{ background: "transparent" }}>
        {/* Global Lighting Setup */}
        {/* Main ambient light for overall illumination */}
        <ambientLight intensity={0.2} color="#ffffff" />

        {/* Key light - main directional light from top-left */}
        <directionalLight
          position={[5, 4, 3]}
          intensity={0.8}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={20}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Front face light - direct illumination for the face */}
        <directionalLight position={[0, 1, 4]} intensity={0.3} color="#ffffff" />

        {/* Avatar with Animator */}
        <AvatarAnimator
          key={currentCharacter}
          character={currentCharacter}
          onError={setAnimationError}
          onLoadingChange={setAnimationLoading}
        />

        {/* Controls */}
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          minDistance={1.5}
          maxDistance={3.5}
          minAzimuthAngle={-Math.PI / 18} // -10 degrees horizontal rotation
          maxAzimuthAngle={Math.PI / 18} // +10 degrees horizontal rotation
          minPolarAngle={Math.PI / 6} // Allow looking down from above (30 degrees)
          maxPolarAngle={Math.PI / 2.2} // Allow slight upward look (about 80 degrees)
          rotateSpeed={0.3} // Reduced sensitivity (default is 1.0)
          onStart={handleRotationStart}
          onEnd={handleRotationEnd}
        />

        {/* Environment for better reflections */}
        <Environment preset="city" />
      </Canvas>

      {/* Voice Chat Indicator */}
      {isListening && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 w-32 h-32 border-4 border-red-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 w-32 h-32 border-4 border-red-500 rounded-full animate-pulse"></div>

            {/* Microphone icon */}
            <div className="relative w-32 h-32 bg-red-500/80 backdrop-blur-md rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H9a1 1 0 100 2h2a1 1 0 100-2v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* "Listening..." text */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white text-lg font-medium bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
              Listening...
            </div>
          </div>
        </div>
      )}

      {/* Animation System Debug Info - Outside Canvas */}
      {animationError && (
        <div className="absolute top-4 left-4 text-red-500 bg-black/50 p-2 rounded z-50">Error: {animationError}</div>
      )}

      {animationLoading && (
        <div className="absolute top-4 left-4 text-yellow-500 bg-black/50 p-2 rounded z-50">Loading animations...</div>
      )}

      {/* Character Switcher - Always visible */}
      <div className="absolute top-4 left-4 z-10">
        <CharacterSwitcher currentCharacter={currentCharacter} onCharacterChange={handleCharacterChange} />
      </div>

      {/* Overlay text - Only visible when debug is enabled */}
      {showDebugUI && (
        <div className="absolute top-20 left-4 text-white z-10">
          <h1 className="text-2xl font-bold mb-2">Avatar Animator</h1>
          <p className="text-sm opacity-80">
            Drag to rotate • Scroll to zoom • Animations are separated from the model
          </p>
          <p className="text-sm opacity-80 mt-2">Animation: {ANIMATION_NAMES[currentAnimationIndex]}</p>
          <p className="text-sm opacity-80">Character: {currentCharacter}</p>
        </div>
      )}

      {/* Animation Controls - Only visible when debug is enabled */}
      {showDebugUI && (
        <div className="absolute top-4 right-4 text-white z-10 flex flex-col gap-2">
          <button
            onClick={previousAnimation}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Previous
          </button>
          <button
            onClick={nextAnimation}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Next
          </button>
          <button
            onClick={randomAnimation}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Random
          </button>
          <button
            onClick={togglePlayPause}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          {/* Test Animation System */}
          <div className="border-t border-slate-600 pt-2 mt-2">
            <div className="text-xs text-slate-400 mb-1 text-center">Test</div>
            <button
              onClick={() => {
                if ((window as any).playAnimationByDescription) {
                  const success = (window as any).playAnimationByDescription(
                    "Idle with gentle weight shifting and relaxed posture"
                  );
                  console.log("Test animation result:", success);
                }
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              title="Test Animation System"
            >
              Test Animation
            </button>
          </div>
        </div>
      )}

      {/* Animation List - Only visible when debug is enabled */}
      {showDebugUI && (
        <div className="absolute bottom-4 left-4 text-white z-10 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Available Animations:</h3>

          {/* Search Input */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search animations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-48 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-1 text-sm">
              {ANIMATION_NAMES.filter(
                name =>
                  searchTerm === "" ||
                  name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  ANIMATION_NAMES.indexOf(name) === currentAnimationIndex // Always show current animation
              ).map(name => {
                const originalIndex = ANIMATION_NAMES.indexOf(name);
                return (
                  <div
                    key={originalIndex}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      originalIndex === currentAnimationIndex
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    onClick={() => {
                      setCurrentAnimationIndex(originalIndex);
                      const playAnimation = (window as any).playAnimation;
                      if (typeof playAnimation === "function") {
                        playAnimation(originalIndex);
                      }
                    }}
                  >
                    {name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
