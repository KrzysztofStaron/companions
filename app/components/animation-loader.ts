import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Structured animation data with descriptions for the LLM
export interface AnimationFile {
  path: string;
  description: string;
}

// Comprehensive list of ALL animation files with descriptions
export const ANIMATION_FILES: AnimationFile[] = [
  // Masculine Dance Animations

  {
    path: "/animation-library/masculine/glb/dance/F_Dances_004.glb",
    description: "cartwheel",
  },
  {
    path: "/animation-library/masculine/glb/dance/F_Dances_007.glb",
    description: "Backflip",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_008.glb",
    description: "Dance",
  },
  // Masculine Expression Animations
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_001.glb",
    description: "Nervous talking",
  },
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_003.glb",
    description: "Pretentious talking",
  },
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_006.glb",
    description: "Silly talking",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_001.glb",
    description: "Hand waving ( hello )",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_002.glb",
    description: "Pointing out something",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_004.glb",
    description: "Nodding ( yes )",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_005.glb",
    description: "Confused",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_008.glb",
    description: "Come here",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_011.glb",
    description: "shaking your head ( no )",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_012.glb",
    description: "thumbs up",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_014.glb",
    description: "Looking side to side",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_017.glb",
    description: "Thumbs down",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_018.glb",
    description: "angry",
  },

  // Masculine Idle Animations
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_001.glb",
    description: "Standing idle with subtle breathing and slight movements",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_003.glb",
    description: "Idle with graceful stance and elegant presence",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_006.glb",
    description: "Idle with subtle gestures and gentle expression",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_008.glb",
    description: "Idle with relaxed posture and natural stance",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_009.glb",
    description: "Idle with gentle breathing and subtle movements",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_001.glb",
    description: "Standing idle with confident posture and steady presence",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_002.glb",
    description: "Idle with steady breathing and subtle movements",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_005.glb",
    description: "Idle with steady composure and subtle expression",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_007.glb",
    description: "Idle with calm demeanor and steady presence",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_010.glb",
    description: "Idle with confident presence and natural stance",
  },
];

// Generate descriptive names for all animations (for backward compatibility)
export const ANIMATION_NAMES = ANIMATION_FILES.map(file => {
  const fileName = file.path.split("/").pop()?.replace(".glb", "") || "";
  const category = file.path.includes("/dance/")
    ? "Dance"
    : file.path.includes("/expression/")
    ? "Expression"
    : file.path.includes("/idle/")
    ? "Idle"
    : file.path.includes("/locomotion/")
    ? "Locomotion"
    : "Other";
  const gender = file.path.includes("/masculine/") ? "M" : "F";

  return `${category} ${gender} ${fileName}`;
});

// Get available animations for the LLM (just the descriptions)
export function getAvailableAnimationsForLLM(): string[] {
  return ANIMATION_FILES.map(file => file.description);
}

// Get animation file by description
export function getAnimationFileByDescription(description: string): AnimationFile | null {
  return ANIMATION_FILES.find(file => file.description === description) || null;
}

// Get animation file by path
export function getAnimationFileByPath(path: string): AnimationFile | null {
  return ANIMATION_FILES.find(file => file.path === path) || null;
}

export interface AnimationData {
  name: string;
  clip: THREE.AnimationClip;
  duration: number;
  path: string;
}

// Function to load all animations
export async function loadAllAnimations(): Promise<AnimationData[]> {
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

  return loadedAnimations;
}

// Function to load a specific animation by index
export async function loadAnimationByIndex(index: number): Promise<AnimationData | null> {
  if (index < 0 || index >= ANIMATION_FILES.length) {
    return null;
  }

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(ANIMATION_FILES[index].path, resolve, undefined, reject);
    });

    if (gltf.animations && gltf.animations.length > 0) {
      const clip = gltf.animations[0];
      return {
        name: ANIMATION_NAMES[index],
        clip: clip,
        duration: clip.duration,
        path: ANIMATION_FILES[index].path,
      };
    }
  } catch (err) {
    console.warn(`Failed to load animation ${ANIMATION_FILES[index].path}:`, err);
  }

  return null;
}

// Function to load animation by description
export async function loadAnimationByDescription(description: string): Promise<AnimationData | null> {
  const animationFile = getAnimationFileByDescription(description);
  if (!animationFile) return null;

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(animationFile.path, resolve, undefined, reject);
    });

    if (gltf.animations && gltf.animations.length > 0) {
      const clip = gltf.animations[0];
      return {
        name: description,
        clip: clip,
        duration: clip.duration,
        path: animationFile.path,
      };
    }
  } catch (err) {
    console.warn(`Failed to load animation ${animationFile.path}:`, err);
  }

  return null;
}

// Function to get animation file path by index
export function getAnimationFilePath(index: number): string | null {
  if (index < 0 || index >= ANIMATION_FILES.length) {
    return null;
  }
  return ANIMATION_FILES[index].path;
}

// Function to get animation name by index
export function getAnimationName(index: number): string | null {
  if (index < 0 || index >= ANIMATION_NAMES.length) {
    return null;
  }
  return ANIMATION_NAMES[index];
}

// Function to get total number of animations
export function getTotalAnimationCount(): number {
  return ANIMATION_FILES.length;
}

/**
 * Gets a random idle animation from the available idle animations
 * @returns A random idle animation file
 * @example
 * const randomIdle = getRandomIdleAnimation();
 * console.log(randomIdle.description); // "Standing idle with subtle breathing and slight movements"
 */
export function getRandomIdleAnimation(): AnimationFile {
  const idleAnimations = ANIMATION_FILES.filter(file => file.path.includes("/idle/"));

  if (idleAnimations.length === 0) {
    // Fallback to a default idle if no idle animations are found
    return (
      ANIMATION_FILES.find(file => file.path.includes("/idle/") && file.path.includes("M_Standing_Idle_001")) ||
      ANIMATION_FILES[0]
    );
  }

  const randomIndex = Math.floor(Math.random() * idleAnimations.length);
  return idleAnimations[randomIndex];
}

/**
 * Gets all available idle animations
 * @returns Array of all idle animation files
 * @example
 * const idleAnims = getIdleAnimations();
 * console.log(`Found ${idleAnims.length} idle animations`);
 */
export function getIdleAnimations(): AnimationFile[] {
  return ANIMATION_FILES.filter(file => file.path.includes("/idle/"));
}
