"use client";

import { useState } from "react";
import LiquidGlass from "./ui/LiquidGlass";

interface CharacterSwitcherProps {
  currentCharacter: string;
  onCharacterChange: (character: string) => void;
}

const CHARACTERS = [
  { id: "character", name: "Character 1", color: "White Shirt", modelPath: "/models/character.glb" },
  { id: "character2", name: "Character 2", color: "Black Shirt", modelPath: "/models/character2.glb" },
  { id: "character3", name: "Character 3", color: "Third Shirt", modelPath: "/models/character3.glb" },
];

export default function CharacterSwitcher({ currentCharacter, onCharacterChange }: CharacterSwitcherProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentChar = CHARACTERS.find(char => char.id === currentCharacter) || CHARACTERS[0];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleCharacterSelect = (characterId: string) => {
    onCharacterChange(characterId);
    closeModal();
  };

  return (
    <>
      {/* Square Button with Liquid Glass */}
      <button
        onClick={openModal}
        className="w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-105"
        title={`Change character (Current: ${currentChar.color})`}
      >
        <LiquidGlass
          borderRadius={12}
          blur={0.5}
          contrast={0.5}
          brightness={0.5}
          saturation={0.5}
          shadowIntensity={0.1}
        >
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </LiquidGlass>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal Content */}
          <div className="relative bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 w-80 max-w-sm mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Choose Character</h3>
              <button onClick={closeModal} className="text-white/60 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Character Options */}
            <div className="space-y-3">
              {CHARACTERS.map(character => (
                <button
                  key={character.id}
                  onClick={() => handleCharacterSelect(character.id)}
                  className={`w-full p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                    currentCharacter === character.id
                      ? "border-white/40 bg-white/10"
                      : "border-white/20 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Color Indicator */}
                    <div
                      className={`w-8 h-8 rounded-lg ${
                        character.id === "character"
                          ? "bg-white"
                          : character.id === "character2"
                          ? "bg-gray-800"
                          : "bg-orange-500"
                      }`}
                    ></div>

                    {/* Character Info */}
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{character.name}</div>
                      <div className="text-white/60 text-sm">{character.color}</div>
                    </div>

                    {/* Current Indicator */}
                    {currentCharacter === character.id && (
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="text-center text-white/60 text-sm">Click outside to close</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
