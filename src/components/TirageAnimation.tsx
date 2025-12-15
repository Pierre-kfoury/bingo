"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { BingoImage } from "@/lib/supabase/types";

type TirageAnimationProps = {
  images: BingoImage[];
  onDraw: () => Promise<BingoImage | null>;
  lastDrawn?: BingoImage | null;
  isComplete?: boolean;
};

export function TirageAnimation({
  images,
  onDraw,
  lastDrawn,
  isComplete = false,
}: TirageAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayImage, setDisplayImage] = useState<BingoImage | null>(lastDrawn || null);
  const [status, setStatus] = useState<string>("");

  // Sync displayImage when lastDrawn changes (from parent)
  const currentLastDrawnId = lastDrawn?.id;
  const displayImageId = displayImage?.id;

  if (currentLastDrawnId && currentLastDrawnId !== displayImageId && !isAnimating) {
    setDisplayImage(lastDrawn);
  }

  const handleDraw = useCallback(async () => {
    if (isAnimating || isComplete) return;

    setIsAnimating(true);
    setStatus("🎰 Tirage en cours...");

    // Slot machine animation
    const animationDuration = 2000;
    const interval = 100;
    const iterations = animationDuration / interval;

    for (let i = 0; i < iterations; i++) {
      const randomImage = images[Math.floor(Math.random() * images.length)];
      setDisplayImage(randomImage);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Final draw
    const result = await onDraw();
    
    if (result) {
      setDisplayImage(result);
      setStatus("✅ Tiré !");
    } else {
      setStatus("✅ Tous les visages ont été tirés !");
    }

    setIsAnimating(false);
  }, [images, onDraw, isAnimating, isComplete]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main display */}
      <div
        className={`
          w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden
          border-4 border-amber-400 bg-[#1a1730]
          ${isAnimating ? "animate-pulse-glow" : ""}
          transition-all duration-300
        `}
      >
        {displayImage ? (
          <div className="relative w-full h-full">
            <Image
              src={displayImage.url}
              alt={displayImage.name}
              fill
              className="object-cover"
              sizes="320px"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🎲</span>
          </div>
        )}
      </div>

      {/* Status */}
      <p className="text-xl font-medium text-amber-400 h-8">{status}</p>

      {/* Draw button */}
      <button
        onClick={handleDraw}
        disabled={isAnimating || isComplete}
        className={`
          px-12 py-4 rounded-xl text-xl font-bold
          transition-all duration-300 transform
          ${
            isAnimating || isComplete
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 hover:scale-105 active:scale-95"
          }
          shadow-lg hover:shadow-purple-500/25
        `}
      >
        {isAnimating ? "⏳ Tirage..." : isComplete ? "✅ Terminé" : "🎯 TIRER"}
      </button>
    </div>
  );
}
