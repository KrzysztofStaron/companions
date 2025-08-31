"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ANIMATION_FILES, ANIMATION_NAMES } from "./animation-loader";

// Main character model (this should be your base character without animations)
const CHARACTER_MODEL = "/models/character.glb";

interface AnimationData {
  name: string;
  clip: THREE.AnimationClip;
  duration: number;
  path: string;
}

function AvatarAnimator({
  onError,
  onLoadingChange,
}: {
  onError?: (error: string | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const { scene: characterScene } = useGLTF(CHARACTER_MODEL);
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  const [animations, setAnimations] = useState<AnimationData[]>([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notify parent of error and loading state changes
  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Load all animations
  useEffect(() => {
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

        // Set up animation mixer
        if (characterScene) {
          console.log("Setting up animation mixer...");
          mixerRef.current = new THREE.AnimationMixer(characterScene);

          // Find and play an idle animation by default
          const idleIndex = loadedAnimations.findIndex(anim => anim.name.toLowerCase().includes("idle"));

          if (idleIndex !== -1) {
            console.log(`Playing idle animation: ${loadedAnimations[idleIndex].name}`);
            playAnimation(idleIndex);
            setCurrentAnimationIndex(idleIndex);
          } else if (loadedAnimations.length > 0) {
            // Fallback to first animation if no idle found
            console.log(`Playing first animation: ${loadedAnimations[0].name}`);
            playAnimation(0);
          }
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

  // Function to play a specific animation
  const playAnimation = (index: number) => {
    if (!mixerRef.current || index < 0 || index >= animations.length) return;

    // Stop current animation
    if (currentActionRef.current) {
      currentActionRef.current.stop();
    }

    // Play new animation
    const newAction = mixerRef.current.clipAction(animations[index].clip);
    newAction.setLoop(THREE.LoopRepeat, Infinity);
    newAction.play();

    currentActionRef.current = newAction;
    setCurrentAnimationIndex(index);
  };

  // Function to play animation once with callback
  const playAnimationOnce = (index: number, onEnd?: () => void) => {
    if (!mixerRef.current || index < 0 || index >= animations.length) return;

    // Stop current animation
    if (currentActionRef.current) {
      currentActionRef.current.stop();
    }

    // Play new animation once
    const newAction = mixerRef.current.clipAction(animations[index].clip);
    newAction.setLoop(THREE.LoopOnce, 1);
    newAction.clampWhenFinished = true;

    const onFinish = () => {
      if (onEnd) {
        onEnd();
      }

      mixerRef.current?.removeEventListener("finished", onFinish);
    };

    mixerRef.current.addEventListener("finished", onFinish);

    newAction.play();

    currentActionRef.current = newAction;
    setCurrentAnimationIndex(index);
  };

  // Function to stop all animations
  const stopAnimation = () => {
    if (currentActionRef.current) {
      currentActionRef.current.stop();
      currentActionRef.current = null;
    }
  };

  // Function to play random animation
  const playRandomAnimation = () => {
    if (animations.length === 0) return;
    const randomIndex = Math.floor(Math.random() * animations.length);
    playAnimation(randomIndex);
  };

  // Function to play animation by description
  const playAnimationByDescription = (description: string) => {
    console.log(`🎭 playAnimationByDescription called with: "${description}"`);
    console.log(
      `📚 Available animations:`,
      animations.map(a => a.name)
    );

    // Import the animation descriptions from the loader
    const { getAvailableAnimationsForLLM } = require("./animation-loader");
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
      const pathLower = anim.path.toLowerCase();

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
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
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

    console.log("🌐 Global functions exposed:", {
      playAnimation: !!(window as any).playAnimation,
      playAnimationByDescription: !!(window as any).playAnimationByDescription,
      ANIMATION_NAMES: !!(window as any).ANIMATION_NAMES,
      animations: !!(window as any).animations,
    });
  }, [animations]);

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
          position={[0, -2, 0]}
          rotation={[0, 0, 0]}
        />
      )}
    </>
  );
}

export default function ModelViewer({ showDebugUI = false }: { showDebugUI?: boolean }) {
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cameraDistance, setCameraDistance] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const orbitControlsRef = useRef<any>(null);
  const [animationError, setAnimationError] = useState<string | null>(null);
  const [animationLoading, setAnimationLoading] = useState(true);

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

  const zoomIn = () => {
    if (orbitControlsRef.current) {
      const newDistance = Math.max(1, cameraDistance - 1);
      setCameraDistance(newDistance);
      orbitControlsRef.current.dollyIn(1.5);
      orbitControlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (orbitControlsRef.current) {
      const newDistance = Math.min(20, cameraDistance + 1);
      setCameraDistance(newDistance);
      orbitControlsRef.current.dollyOut(1.5);
      orbitControlsRef.current.update();
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Canvas camera={{ position: [0, 2, cameraDistance], fov: 75 }} style={{ background: "transparent" }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Avatar with Animator */}
        <AvatarAnimator onError={setAnimationError} onLoadingChange={setAnimationLoading} />

        {/* Controls */}
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          minDistance={1}
          maxDistance={20}
        />

        {/* Environment for better reflections */}
        <Environment preset="city" />
      </Canvas>

      {/* Background overlay to hide everything below the model */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>

      {/* Animation System Debug Info - Outside Canvas */}
      {animationError && (
        <div className="absolute top-4 left-4 text-red-500 bg-black/50 p-2 rounded z-50">Error: {animationError}</div>
      )}

      {animationLoading && (
        <div className="absolute top-4 left-4 text-yellow-500 bg-black/50 p-2 rounded z-50">Loading animations...</div>
      )}

      {/* Overlay text - Only visible when debug is enabled */}
      {showDebugUI && (
        <div className="absolute top-4 left-4 text-white z-10">
          <h1 className="text-2xl font-bold mb-2">Avatar Animator</h1>
          <p className="text-sm opacity-80">
            Drag to rotate • Scroll to zoom • Animations are separated from the model
          </p>
          <p className="text-sm opacity-80 mt-2">Current: {ANIMATION_NAMES[currentAnimationIndex]}</p>
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

          {/* Zoom Controls */}
          <div className="border-t border-slate-600 pt-2 mt-2">
            <div className="text-xs text-slate-400 mb-1 text-center">Zoom</div>
            <div className="flex gap-1">
              <button
                onClick={zoomIn}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={zoomOut}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                title="Zoom Out"
              >
                −
              </button>
            </div>
          </div>

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
                (name, index) =>
                  searchTerm === "" ||
                  name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  index === currentAnimationIndex // Always show current animation
              ).map((name, index) => {
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
                      if ((window as any).playAnimation) {
                        (window as any).playAnimation(originalIndex);
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
