"use client";

import { useState, useEffect, createContext, useContext } from "react";

interface AudioPermissionContextType {
  hasAudioPermission: boolean;
  requestAudioPermission: () => Promise<boolean>;
  playAudio: (audioUrl: string) => Promise<boolean>;
}

const AudioPermissionContext = createContext<AudioPermissionContextType | null>(null);

export function useAudioPermission() {
  const context = useContext(AudioPermissionContext);
  if (!context) {
    throw new Error("useAudioPermission must be used within AudioPermissionProvider");
  }
  return context;
}

interface AudioPermissionProviderProps {
  children: React.ReactNode;
}

export function AudioPermissionProvider({ children }: AudioPermissionProviderProps) {
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Check if audio permission was previously granted or skipped
  useEffect(() => {
    const savedPermission = localStorage.getItem("audioPermissionGranted");
    const savedSkipped = localStorage.getItem("audioPermissionSkipped");

    if (savedPermission === "true") {
      setHasAudioPermission(true);
    } else if (savedSkipped === "true") {
      // User previously skipped, don't show modal
      setHasAudioPermission(false);
    } else {
      // Show permission modal on first load
      setShowPermissionModal(true);
    }
  }, []);

  const requestAudioPermission = async (): Promise<boolean> => {
    console.log("🔊 Audio permission requested by user");
    setIsRequestingPermission(true);

    try {
      // Since this is called from a user interaction, we can now allow audio
      setHasAudioPermission(true);
      setShowPermissionModal(false);
      localStorage.setItem("audioPermissionGranted", "true");

      console.log("✅ Audio permission granted successfully");

      // Play any pending audio
      if (pendingAudio) {
        try {
          await playAudioInternal(pendingAudio);
          setPendingAudio(null);
        } catch (error) {
          console.warn("Failed to play pending audio:", error);
        }
      }

      return true;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const playAudioInternal = async (audioUrl: string): Promise<boolean> => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
      return true;
    } catch (error) {
      console.error("Failed to play audio:", error);
      return false;
    }
  };

  const playAudio = async (audioUrl: string): Promise<boolean> => {
    if (hasAudioPermission) {
      return await playAudioInternal(audioUrl);
    } else {
      // Store the audio for later playback after permission is granted
      setPendingAudio(audioUrl);
      setShowPermissionModal(true);
      return false;
    }
  };

  const handlePermissionRequest = async () => {
    const granted = await requestAudioPermission();
    if (!granted) {
      // Show error message or handle gracefully
      console.warn("Audio permission was not granted");
    }
  };

  const handleSkipAudio = () => {
    console.log("🔇 User chose to skip audio");
    setShowPermissionModal(false);
    setPendingAudio(null);
    localStorage.setItem("audioPermissionSkipped", "true");
    // Keep hasAudioPermission as false so audio won't play
  };

  return (
    <AudioPermissionContext.Provider
      value={{
        hasAudioPermission,
        requestAudioPermission,
        playAudio,
      }}
    >
      {children}

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="text-center">
              {/* Audio Icon */}
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M12 6l-4 4H5a1 1 0 00-1 1v2a1 1 0 001 1h3l4 4V6z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">Enable Audio Experience</h2>

              <p className="text-gray-600 mb-6 leading-relaxed">
                This companion uses voice and audio for the best interactive experience. Click "Enable Audio" to allow
                audio playback and enjoy full conversations with your AI companion.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handlePermissionRequest}
                  disabled={isRequestingPermission}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {isRequestingPermission ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Enabling Audio...
                    </div>
                  ) : (
                    "Enable Audio"
                  )}
                </button>

                <button
                  onClick={handleSkipAudio}
                  className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors duration-200"
                >
                  Continue without audio
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                You can change this setting anytime in your browser preferences
              </p>
            </div>
          </div>
        </div>
      )}
    </AudioPermissionContext.Provider>
  );
}
