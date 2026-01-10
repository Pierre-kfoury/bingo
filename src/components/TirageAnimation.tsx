"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { JeuImage } from "@/lib/supabase/types";

type TirageAnimationProps = {
  images: JeuImage[];
  onDraw: () => Promise<void>;
  lastDrawn?: JeuImage | null;
  isComplete?: boolean;
  isAnimating?: boolean;
};

export function TirageAnimation({
  images,
  onDraw,
  lastDrawn,
  isComplete = false,
  isAnimating = false,
}: TirageAnimationProps) {
  const [displayImage, setDisplayImage] = useState<JeuImage | null>(lastDrawn || null);
  const [status, setStatus] = useState<string>("");
  const animationInterval = useRef<NodeJS.Timeout | null>(null);

  // Handle animation when isAnimating changes
  useEffect(() => {
    if (isAnimating) {
      setStatus("🎰 Tirage en cours...");

      // Start slot machine animation
      animationInterval.current = setInterval(() => {
        const randomImage = images[Math.floor(Math.random() * images.length)];
        setDisplayImage(randomImage);
      }, 100);
    } else {
      // Stop animation
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }

      // Show the final drawn image
      if (lastDrawn && lastDrawn.id !== displayImage?.id) {
        setDisplayImage(lastDrawn);
        setStatus("✅ Tiré !");
      }
    }

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, [isAnimating, images, lastDrawn, displayImage]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main display - Beaucoup plus grand pour TV */}
      <div
        className={`
          w-[500px] h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] xl:w-[800px] xl:h-[800px]
          rounded-3xl overflow-hidden
          border-8 border-amber-400 bg-[#1a1730]
          ${isAnimating ? "animate-pulse-glow" : ""}
          transition-all duration-300
          shadow-2xl
        `}
      >
        {displayImage ? (
          <div className="relative w-full h-full">
            <Image
              src={displayImage.url}
              alt={displayImage.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 500px, (max-width: 1024px) 600px, (max-width: 1280px) 700px, 800px"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-9xl">🎲</span>
          </div>
        )}
      </div>

      {/* Status - Plus grand pour TV */}
      <p className="text-4xl md:text-5xl font-bold text-amber-400 h-16">{status}</p>
    </div>
  );
}

// Export le bouton séparément pour le layout
export function TirageButton({
  onDraw,
  isAnimating,
  isComplete,
}: {
  onDraw: () => void;
  isAnimating: boolean;
  isComplete: boolean;
}) {
  return (
    <button
      onClick={onDraw}
      disabled={isAnimating || isComplete}
      className={`
        w-full px-12 py-8 md:px-16 md:py-10 rounded-2xl text-3xl md:text-4xl font-bold
        transition-all duration-300 transform
        ${
          isAnimating || isComplete
            ? "bg-gray-600 cursor-not-allowed opacity-50"
            : "bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 hover:scale-105 active:scale-95"
        }
        shadow-2xl hover:shadow-purple-500/25
      `}
    >
      {isAnimating ? "⏳ Tirage..." : isComplete ? "✅ Terminé" : "🎯 TIRER"}
    </button>
  );
}
