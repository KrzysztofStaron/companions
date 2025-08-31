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
    path: "/animation-library/masculine/glb/dance/F_Dances_001.glb",
    description: "Dance move with graceful arm movements and hip swaying",
  },
  {
    path: "/animation-library/masculine/glb/dance/F_Dances_004.glb",
    description: "Dance with twirling motion and flowing dress movement",
  },
  {
    path: "/animation-library/masculine/glb/dance/F_Dances_005.glb",
    description: "Dance with rhythmic stepping and arm coordination",
  },
  {
    path: "/animation-library/masculine/glb/dance/F_Dances_006.glb",
    description: "Dance with elegant hand gestures and body isolation",
  },
  {
    path: "/animation-library/masculine/glb/dance/F_Dances_007.glb",
    description: "Backflip",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_001.glb",
    description: "Dance with confident stance and rhythmic movement",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_002.glb",
    description: "Dance with energetic footwork and arm coordination",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_003.glb",
    description: "Idk, just a dance",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_004.glb",
    description: "Dance with powerful movements and strong presence",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_005.glb",
    description: "Dance with complex choreography and style",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_006.glb",
    description: "Dance with fluid motion and artistic expression",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_007.glb",
    description: "idk, just a dance move",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_008.glb",
    description: "Dance with technical precision and rhythm",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_009.glb",
    description: "Dance with creative moves and personality",
  },
  {
    path: "/animation-library/masculine/glb/dance/M_Dances_011.glb",
    description: "Dance with smooth flow and musical timing",
  },

  // Masculine Expression Animations
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_001.glb",
    description: "Talking gesture with hand movements and head nods",
  },
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_002.glb",
    description: "Talking with expressive facial movements and gestures",
  },
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_003.glb",
    description: "Talking with animated hand gestures and body language",
  },
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_004.glb",
    description: "Talking with emphasis and dramatic expression",
  },
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_005.glb",
    description: "Talking with casual gestures and relaxed posture",
  },
  {
    path: "/animation-library/masculine/glb/expression/F_Talking_Variations_006.glb",
    description: "Talking with formal gestures and professional demeanor",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_001.glb",
    description: "Standing expression with confident posture and slight movements",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_002.glb",
    description: "Standing with attentive listening pose and subtle gestures",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_004.glb",
    description: "Standing with casual stance and relaxed expression",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_005.glb",
    description: "Standing with formal posture and professional appearance",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_006.glb",
    description: "Standing with friendly expression and open body language",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_007.glb",
    description: "Standing with thoughtful pose and contemplative expression",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_008.glb",
    description: "Standing with energetic expression and dynamic posture",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_009.glb",
    description: "Standing with calm expression and steady presence",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_010.glb",
    description: "Standing with alert expression and ready stance",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_011.glb",
    description: "Standing with warm expression and welcoming posture",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_012.glb",
    description: "Standing with serious expression and focused attention",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_013.glb",
    description: "Standing with playful expression and relaxed energy",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_014.glb",
    description: "Standing with confident expression and strong presence",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_015.glb",
    description: "Standing with friendly expression and approachable demeanor",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_016.glb",
    description: "Standing with calm expression and steady composure",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_017.glb",
    description: "Standing with attentive expression and listening pose",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Standing_Expressions_018.glb",
    description: "Standing with relaxed expression and comfortable stance",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_001.glb",
    description: "Talking with clear hand gestures and confident speech",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_002.glb",
    description: "Talking with expressive movements and engaging presence",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_003.glb",
    description: "Talking with animated gestures and dynamic expression",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_004.glb",
    description: "Talking with emphasis and powerful communication",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_005.glb",
    description: "Talking with casual gestures and relaxed communication",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_006.glb",
    description: "Talking with formal gestures and professional communication",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_007.glb",
    description: "Talking with friendly gestures and warm communication",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_008.glb",
    description: "Talking with thoughtful gestures and measured speech",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_009.glb",
    description: "Talking with energetic gestures and dynamic speech",
  },
  {
    path: "/animation-library/masculine/glb/expression/M_Talking_Variations_010.glb",
    description: "Talking with calm gestures and steady communication",
  },

  // Masculine Idle Animations
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_001.glb",
    description: "Standing idle with subtle breathing and slight movements",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_001.glb",
    description: "Idle with gentle weight shifting and relaxed posture",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_002.glb",
    description: "Idle with soft movements and natural breathing",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_003.glb",
    description: "Idle with graceful stance and elegant presence",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_004.glb",
    description: "Idle with relaxed energy and comfortable stance",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_005.glb",
    description: "Idle with natural movements and organic presence",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_006.glb",
    description: "Idle with subtle gestures and gentle expression",
  },
  {
    path: "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_007.glb",
    description: "Idle with calm demeanor and steady presence",
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
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_002.glb",
    description: "Idle with strong stance and composed demeanor",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_001.glb",
    description: "Idle with relaxed confidence and natural stance",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_002.glb",
    description: "Idle with steady breathing and subtle movements",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_003.glb",
    description: "Idle with calm presence and relaxed energy",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_004.glb",
    description: "Idle with natural stance and comfortable presence",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_005.glb",
    description: "Idle with steady composure and subtle expression",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_006.glb",
    description: "Idle with relaxed confidence and natural movements",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_007.glb",
    description: "Idle with calm demeanor and steady presence",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_008.glb",
    description: "Idle with natural stance and relaxed energy",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_009.glb",
    description: "Idle with steady breathing and subtle movements",
  },
  {
    path: "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_010.glb",
    description: "Idle with confident presence and natural stance",
  },

  // Masculine Locomotion Animations
  {
    path: "/animation-library/masculine/glb/locomotion/F_Crouch_Strafe_Left.glb",
    description: "Crouching movement to the left with stealthy motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Crouch_Strafe_Right.glb",
    description: "Crouching movement to the right with careful steps",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Crouch_Walk_001.glb",
    description: "Crouched walking with low profile and careful movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_CrouchedWalk_Backwards_001.glb",
    description: "Crouched walking backwards with cautious retreat",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Falling_Idle_000.glb",
    description: "Falling idle pose with relaxed falling animation",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Falling_Idle_001.glb",
    description: "Falling idle with gentle descent and relaxed pose",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Jog_001.glb",
    description: "Jogging with natural running motion and good form",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Jog_Backwards_001.glb",
    description: "Jogging backwards with careful reverse movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Jog_Jump_Small_001.glb",
    description: "Jogging with small jumps and dynamic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Jog_Strafe_Left_002.glb",
    description: "Jogging to the left with side-stepping motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Jog_Strafe_Right_002.glb",
    description: "Jogging to the right with side-stepping motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Run_001.glb",
    description: "Running with full speed and athletic form",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Run_Backwards_001.glb",
    description: "Running backwards with fast reverse movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Run_Jump_001.glb",
    description: "Running with jumping motion and dynamic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Run_Strafe_Left_001.glb",
    description: "Running to the left with fast side movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Run_Strafe_Right_001.glb",
    description: "Running to the right with fast side movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Walk_002.glb",
    description: "Walking with natural gait and relaxed movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Walk_003.glb",
    description: "Walking with confident stride and good posture",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Walk_Backwards_001.glb",
    description: "Walking backwards with careful reverse steps",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Walk_Jump_001.glb",
    description: "Walking with jumping motion and playful movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Walk_Jump_002.glb",
    description: "Walking with jumping motion and energetic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Walk_Strafe_Left_001.glb",
    description: "Walking to the left with side-stepping motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/F_Walk_Strafe_Right_001.glb",
    description: "Walking to the right with side-stepping motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Crouch_Strafe_Left_002.glb",
    description: "Crouching movement to the left with stealthy motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Crouch_Strafe_Right_002.glb",
    description: "Crouching movement to the right with careful steps",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Crouch_Walk_003.glb",
    description: "Crouched walking with low profile and careful movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_CrouchedWalk_Backwards_002.glb",
    description: "Crouched walking backwards with cautious retreat",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Falling_Idle_002.glb",
    description: "Falling idle pose with relaxed falling animation",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Jog_001.glb",
    description: "Jogging with natural running motion and good form",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Jog_003.glb",
    description: "Jogging with steady pace and consistent movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Jog_Backwards_001.glb",
    description: "Jogging backwards with careful reverse movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Jog_Jump_001.glb",
    description: "Jogging with jumping motion and dynamic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Jog_Jump_002.glb",
    description: "Jogging with jumping motion and energetic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Jog_Strafe_Left_001.glb",
    description: "Jogging to the left with side-stepping motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Jog_Strafe_Right_001.glb",
    description: "Jogging to the right with side-stepping motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Run_001.glb",
    description: "Running with full speed and athletic form",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Run_Backwards_002.glb",
    description: "Running backwards with fast reverse movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Run_Jump_001.glb",
    description: "Running with jumping motion and dynamic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Run_Jump_002.glb",
    description: "Running with jumping motion and energetic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Run_Strafe_Left_002.glb",
    description: "Running to the left with fast side movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Run_Strafe_Right_002.glb",
    description: "Running to the right with fast side movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_001.glb",
    description: "Walking with natural gait and relaxed movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_002.glb",
    description: "Walking with confident stride and good posture",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_Backwards_001.glb",
    description: "Walking backwards with careful reverse steps",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_Jump_001.glb",
    description: "Walking with jumping motion and playful movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_Jump_002.glb",
    description: "Walking with jumping motion and energetic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_Jump_003.glb",
    description: "Walking with jumping motion and dynamic movement",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_Strafe_Left_002.glb",
    description: "Walking to the left with side-stepping motion",
  },
  {
    path: "/animation-library/masculine/glb/locomotion/M_Walk_Strafe_Right_002.glb",
    description: "Walking to the right with side-stepping motion",
  },
];

// Generate descriptive names for all animations (for backward compatibility)
export const ANIMATION_NAMES = ANIMATION_FILES.map((file, index) => {
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
