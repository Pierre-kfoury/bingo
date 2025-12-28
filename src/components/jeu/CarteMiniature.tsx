"use client";

import { type Carte, type JeuImage } from "@/lib/supabase/types";
import { useState } from "react";
import Image from "next/image";

interface CarteMiniatureProps {
  carte: Carte;
  images: JeuImage[];
  selected?: boolean;
  onSelect?: (carteId: string, selected: boolean) => void;
  onClick?: () => void;
}

export function CarteMiniature({
  carte,
  images,
  selected = false,
  onSelect,
  onClick
}: CarteMiniatureProps) {
  const [isHovered, setIsHovered] = useState(false);

  const imageMap = new Map(images.map(img => [img.id, img.url]));
  const gridSize = Math.sqrt(carte.cells.length);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(carte.id, e.target.checked);
  };

  return (
    <div
      className="relative cursor-pointer rounded-lg border bg-white p-2 transition-shadow hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {onSelect && (
        <div className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>
      )}

      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          aspectRatio: '1',
        }}
      >
        {carte.cells.map((cellId, idx) => {
          if (cellId === "star") {
            return (
              <div key={idx} className="flex items-center justify-center bg-yellow-100 text-xl">
                ⭐
              </div>
            );
          }
          const imageUrl = imageMap.get(cellId);
          return (
            <div key={idx} className="relative bg-gray-100">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="50px"
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-1 text-center text-xs text-gray-600">{carte.name}</p>
    </div>
  );
}
