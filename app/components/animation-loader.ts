import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Comprehensive list of ALL animation files from the animation library
export const ANIMATION_FILES = [
  // Masculine Dance Animations
  "/animation-library/masculine/glb/dance/F_Dances_001.glb",
  "/animation-library/masculine/glb/dance/F_Dances_004.glb",
  "/animation-library/masculine/glb/dance/F_Dances_005.glb",
  "/animation-library/masculine/glb/dance/F_Dances_006.glb",
  "/animation-library/masculine/glb/dance/F_Dances_007.glb",
  "/animation-library/masculine/glb/dance/M_Dances_001.glb",
  "/animation-library/masculine/glb/dance/M_Dances_002.glb",
  "/animation-library/masculine/glb/dance/M_Dances_003.glb",
  "/animation-library/masculine/glb/dance/M_Dances_004.glb",
  "/animation-library/masculine/glb/dance/M_Dances_005.glb",
  "/animation-library/masculine/glb/dance/M_Dances_006.glb",
  "/animation-library/masculine/glb/dance/M_Dances_007.glb",
  "/animation-library/masculine/glb/dance/M_Dances_008.glb",
  "/animation-library/masculine/glb/dance/M_Dances_009.glb",
  "/animation-library/masculine/glb/dance/M_Dances_011.glb",
  
  // Masculine Expression Animations
  "/animation-library/masculine/glb/expression/F_Talking_Variations_001.glb",
  "/animation-library/masculine/glb/expression/F_Talking_Variations_002.glb",
  "/animation-library/masculine/glb/expression/F_Talking_Variations_003.glb",
  "/animation-library/masculine/glb/expression/F_Talking_Variations_004.glb",
  "/animation-library/masculine/glb/expression/F_Talking_Variations_005.glb",
  "/animation-library/masculine/glb/expression/F_Talking_Variations_006.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_001.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_002.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_004.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_005.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_006.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_007.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_008.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_009.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_010.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_011.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_012.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_013.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_014.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_015.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_016.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_017.glb",
  "/animation-library/masculine/glb/expression/M_Standing_Expressions_018.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_001.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_002.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_003.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_004.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_005.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_006.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_007.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_008.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_009.glb",
  "/animation-library/masculine/glb/expression/M_Talking_Variations_010.glb",
  
  // Masculine Idle Animations
  "/animation-library/masculine/glb/idle/F_Standing_Idle_001.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_001.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_002.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_003.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_004.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_005.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_006.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_007.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_008.glb",
  "/animation-library/masculine/glb/idle/F_Standing_Idle_Variations_009.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_001.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_002.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_001.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_002.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_003.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_004.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_005.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_006.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_007.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_008.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_009.glb",
  "/animation-library/masculine/glb/idle/M_Standing_Idle_Variations_010.glb",
  
  // Masculine Locomotion Animations
  "/animation-library/masculine/glb/locomotion/F_Crouch_Strafe_Left.glb",
  "/animation-library/masculine/glb/locomotion/F_Crouch_Strafe_Right.glb",
  "/animation-library/masculine/glb/locomotion/F_Crouch_Walk_001.glb",
  "/animation-library/masculine/glb/locomotion/F_CrouchedWalk_Backwards_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Falling_Idle_000.glb",
  "/animation-library/masculine/glb/locomotion/F_Falling_Idle_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Jog_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Jog_Backwards_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Jog_Jump_Small_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Jog_Strafe_Left_002.glb",
  "/animation-library/masculine/glb/locomotion/F_Jog_Strafe_Right_002.glb",
  "/animation-library/masculine/glb/locomotion/F_Run_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Run_Backwards_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Run_Jump_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Run_Strafe_Left_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Run_Strafe_Right_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Walk_002.glb",
  "/animation-library/masculine/glb/locomotion/F_Walk_003.glb",
  "/animation-library/masculine/glb/locomotion/F_Walk_Backwards_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Walk_Jump_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Walk_Jump_002.glb",
  "/animation-library/masculine/glb/locomotion/F_Walk_Strafe_Left_001.glb",
  "/animation-library/masculine/glb/locomotion/F_Walk_Strafe_Right_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Crouch_Strafe_Left_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Crouch_Strafe_Right_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Crouch_Walk_003.glb",
  "/animation-library/masculine/glb/locomotion/M_CrouchedWalk_Backwards_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Falling_Idle_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Jog_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Jog_003.glb",
  "/animation-library/masculine/glb/locomotion/M_Jog_Backwards_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Jog_Jump_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Jog_Jump_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Jog_Strafe_Left_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Jog_Strafe_Right_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Run_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Run_Backwards_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Run_Jump_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Run_Jump_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Run_Strafe_Left_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Run_Strafe_Right_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_Backwards_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_Jump_001.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_Jump_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_Jump_003.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_Strafe_Left_002.glb",
  "/animation-library/masculine/glb/locomotion/M_Walk_Strafe_Right_002.glb",
  
  // Feminine Dance Animations
  "/animation-library/feminine/glb/dance/F_Dances_001.glb",
  "/animation-library/feminine/glb/dance/F_Dances_004.glb",
  "/animation-library/feminine/glb/dance/F_Dances_005.glb",
  "/animation-library/feminine/glb/dance/F_Dances_006.glb",
  "/animation-library/feminine/glb/dance/F_Dances_007.glb",
  "/animation-library/feminine/glb/dance/M_Dances_001.glb",
  "/animation-library/feminine/glb/dance/M_Dances_002.glb",
  "/animation-library/feminine/glb/dance/M_Dances_003.glb",
  "/animation-library/feminine/glb/dance/M_Dances_004.glb",
  "/animation-library/feminine/glb/dance/M_Dances_005.glb",
  "/animation-library/feminine/glb/dance/M_Dances_006.glb",
  "/animation-library/feminine/glb/dance/M_Dances_007.glb",
  "/animation-library/feminine/glb/dance/M_Dances_008.glb",
  "/animation-library/feminine/glb/dance/M_Dances_009.glb",
  "/animation-library/feminine/glb/dance/M_Dances_011.glb",
  
  // Feminine Expression Animations
  "/animation-library/feminine/glb/expression/F_Talking_Variations_001.glb",
  "/animation-library/feminine/glb/expression/F_Talking_Variations_002.glb",
  "/animation-library/feminine/glb/expression/F_Talking_Variations_003.glb",
  "/animation-library/feminine/glb/expression/F_Talking_Variations_004.glb",
  "/animation-library/feminine/glb/expression/F_Talking_Variations_005.glb",
  "/animation-library/feminine/glb/expression/F_Talking_Variations_006.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_001.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_002.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_004.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_005.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_006.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_007.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_008.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_009.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_010.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_011.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_012.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_013.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_014.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_015.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_016.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_017.glb",
  "/animation-library/feminine/glb/expression/M_Standing_Expressions_018.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_001.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_002.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_003.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_004.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_005.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_006.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_007.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_008.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_009.glb",
  "/animation-library/feminine/glb/expression/M_Talking_Variations_010.glb",
  
  // Feminine Idle Animations
  "/animation-library/feminine/glb/idle/F_Standing_Idle_001.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_001.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_002.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_003.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_004.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_005.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_006.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_007.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_008.glb",
  "/animation-library/feminine/glb/idle/F_Standing_Idle_Variations_009.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_001.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_002.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_001.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_002.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_003.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_004.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_005.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_006.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_007.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_008.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_009.glb",
  "/animation-library/feminine/glb/idle/M_Standing_Idle_Variations_010.glb",
  
  // Feminine Locomotion Animations
  "/animation-library/feminine/glb/locomotion/F_Crouch_Strafe_Left.glb",
  "/animation-library/feminine/glb/locomotion/F_Crouch_Strafe_Right.glb",
  "/animation-library/feminine/glb/locomotion/F_Crouch_Walk_001.glb",
  "/animation-library/feminine/glb/locomotion/F_CrouchedWalk_Backwards_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Falling_Idle_000.glb",
  "/animation-library/feminine/glb/locomotion/F_Falling_Idle_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Jog_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Jog_Backwards_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Jog_Jump_Small_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Jog_Strafe_Left_002.glb",
  "/animation-library/feminine/glb/locomotion/F_Jog_Strafe_Right_002.glb",
  "/animation-library/feminine/glb/locomotion/F_Run_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Run_Backwards_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Run_Jump_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Run_Strafe_Left_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Run_Strafe_Right_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Walk_002.glb",
  "/animation-library/feminine/glb/locomotion/F_Walk_003.glb",
  "/animation-library/feminine/glb/locomotion/F_Walk_Backwards_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Walk_Jump_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Walk_Jump_002.glb",
  "/animation-library/feminine/glb/locomotion/F_Walk_Strafe_Left_001.glb",
  "/animation-library/feminine/glb/locomotion/F_Walk_Strafe_Right_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Crouch_Strafe_Left_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Crouch_Strafe_Right_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Crouch_Walk_003.glb",
  "/animation-library/feminine/glb/locomotion/M_CrouchedWalk_Backwards_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Falling_Idle_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Jog_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Jog_003.glb",
  "/animation-library/feminine/glb/locomotion/M_Jog_Backwards_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Jog_Jump_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Jog_Jump_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Jog_Strafe_Left_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Jog_Strafe_Right_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Run_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Run_Backwards_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Run_Jump_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Run_Jump_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Run_Strafe_Left_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Run_Strafe_Right_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_Backwards_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_Jump_001.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_Jump_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_Jump_003.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_Strafe_Left_002.glb",
  "/animation-library/feminine/glb/locomotion/M_Walk_Strafe_Right_002.glb",
];

// Generate descriptive names for all animations
export const ANIMATION_NAMES = ANIMATION_FILES.map((file, index) => {
  const fileName = file.split('/').pop()?.replace('.glb', '') || '';
  const category = file.includes('/dance/') ? 'Dance' : 
                   file.includes('/expression/') ? 'Expression' : 
                   file.includes('/idle/') ? 'Idle' : 
                   file.includes('/locomotion/') ? 'Locomotion' : 'Other';
  const gender = file.includes('/masculine/') ? 'M' : 'F';
  
  return `${category} ${gender} ${fileName}`;
});

export interface AnimationData {
  name: string;
  clip: THREE.AnimationClip;
  duration: number;
}

// Function to load all animations
export async function loadAllAnimations(): Promise<AnimationData[]> {
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
      loader.load(ANIMATION_FILES[index], resolve, undefined, reject);
    });

    if (gltf.animations && gltf.animations.length > 0) {
      const clip = gltf.animations[0];
      return {
        name: ANIMATION_NAMES[index],
        clip: clip,
        duration: clip.duration,
      };
    }
  } catch (err) {
    console.warn(`Failed to load animation ${ANIMATION_FILES[index]}:`, err);
  }

  return null;
}

// Function to get animation file path by index
export function getAnimationFilePath(index: number): string | null {
  if (index < 0 || index >= ANIMATION_FILES.length) {
    return null;
  }
  return ANIMATION_FILES[index];
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
