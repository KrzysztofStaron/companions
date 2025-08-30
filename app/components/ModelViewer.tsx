"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Animation files from the animation library - these contain only animations, not models
const ANIMATION_FILES = [
  "/animation-library/masculine/glb/dance/M_Dances_001.glb",
  "/animation-library/masculine/glb/dance/M_Dances_002.glb",
  "/animation-library/masculine/glb/dance/M_Dances_003.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_001.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Run_001.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_001.glb",
];

// Animation names for display
const ANIMATION_NAMES = ["Dance 1", "Dance 2", "Dance 3", "Idle 1", "Idle 2", "Walk", "Run", "Expression 1"];

// Main character model (this should be your base character without animations)
const CHARACTER_MODEL = "/models/character.glb";

interface AnimationData {
  name: string;
  clip: THREE.AnimationClip;
  duration: number;
}

function AvatarAnimator() {
  const { scene: characterScene } = useGLTF(CHARACTER_MODEL);
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  const [animations, setAnimations] = useState<AnimationData[]>([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all animations
  useEffect(() => {
    async function loadAnimations() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedAnimations: AnimationData[] = [];
        const loader = new GLTFLoader();

        // Load each animation file
        for (let i = 0; i < ANIMATION_FILES.length; i++) {
          try {
            const gltf = await new Promise<any>((resolve, reject) => {
              loader.load(ANIMATION_FILES[i], resolve, undefined, reject);
            });

            if (gltf.animations && gltf.animations.length > 0) {
              // Take the first animation clip from each file
              const clip = gltf.animations[0];
              loadedAnimations.push({
                name: ANIMATION_NAMES[i],
                clip: clip,
                duration: clip.duration,
              });
            }
          } catch (err) {
            console.warn(`Failed to load animation ${ANIMATION_FILES[i]}:`, err);
          }
        }

        setAnimations(loadedAnimations);

        // Set up animation mixer
        if (characterScene) {
          mixerRef.current = new THREE.AnimationMixer(characterScene);

          // Play first animation if available
          if (loadedAnimations.length > 0) {
            playAnimation(0);
          }
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

  // Expose animation functions to parent component
  useEffect(() => {
    // This allows the parent component to control animations
    (window as any).playAnimation = playAnimation;
    (window as any).stopAnimation = stopAnimation;
  }, [animations]);

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

  return <primitive ref={modelRef} object={characterScene} scale={[1, 1, 1]} position={[0, 0, 0]} />;
}

export default function ModelViewer() {
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

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

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} style={{ background: "transparent" }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Avatar with Animator */}
        <AvatarAnimator />

        {/* Controls */}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={false} />

        {/* Environment for better reflections */}
        <Environment preset="city" />
      </Canvas>

      {/* Overlay text */}
      <div className="absolute top-4 left-4 text-white z-10">
        <h1 className="text-2xl font-bold mb-2">Avatar Animator</h1>
        <p className="text-sm opacity-80">Drag to rotate • Scroll to zoom • Animations are separated from the model</p>
        <p className="text-sm opacity-80 mt-2">Current: {ANIMATION_NAMES[currentAnimationIndex]}</p>
      </div>

      {/* Animation Controls */}
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
      </div>

      {/* Animation List */}
      <div className="absolute bottom-4 left-4 text-white z-10 max-w-md">
        <h3 className="text-lg font-semibold mb-2">Available Animations:</h3>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {ANIMATION_NAMES.map((name, index) => (
            <div
              key={index}
              className={`p-2 rounded cursor-pointer transition-colors ${
                index === currentAnimationIndex ? "bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600"
              }`}
              onClick={() => {
                setCurrentAnimationIndex(index);
                if ((window as any).playAnimation) {
                  (window as any).playAnimation(index);
                }
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
