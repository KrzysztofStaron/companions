// Client-side background state management
// This file is NOT marked with "use server" so functions can be synchronous

export interface BackgroundState {
  backgroundUrl: string | null;
  isGenerating: boolean;
  description: string | null;
}

// Client-side state management functions - no server actions needed
export function getBackgroundStateSync(): BackgroundState {
  if (typeof window !== "undefined") {
    return {
      backgroundUrl: (window as any).__backgroundState?.backgroundUrl || null,
      isGenerating: (window as any).__backgroundState?.isGenerating || false,
      description: (window as any).__backgroundState?.description || null,
    };
  }
  return { backgroundUrl: null, isGenerating: false, description: null };
}

export function setBackgroundStateSync(state: {
  backgroundUrl?: string | null;
  isGenerating?: boolean;
  description?: string | null;
}) {
  if (typeof window !== "undefined") {
    (window as any).__backgroundState = {
      ...(window as any).__backgroundState,
      ...state,
    };
  }
}
