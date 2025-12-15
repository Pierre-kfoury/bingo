"use client";

import Image from "next/image";

type ImageData = {
  id: number;
  name: string;
  url: string;
};

type BingoGridProps = {
  cells: number[];
  images: Map<number, ImageData> | Record<number, ImageData>;
  markedCells?: Set<number>;
  onCellClick?: (cellIndex: number, imageId: number) => void;
  size?: "sm" | "md" | "lg";
};

export function BingoGrid({
  cells,
  images,
  markedCells = new Set(),
  onCellClick,
  size = "md",
}: BingoGridProps) {
  const sizeClasses = {
    sm: "w-12 h-12 md:w-16 md:h-16",
    md: "w-16 h-16 md:w-20 md:h-20",
    lg: "w-20 h-20 md:w-24 md:h-24",
  };

  const getImage = (id: number): ImageData | undefined => {
    if (images instanceof Map) {
      return images.get(id);
    }
    return images[id];
  };

  return (
    <div className="inline-block p-3 bg-[#1a1730] rounded-xl border border-[#2d2a4a]">
      <div className="grid grid-cols-5 gap-1.5">
        {cells.map((imageId, index) => {
          const isCenter = index === 12;
          const isMarked = markedCells.has(index);
          const image = imageId !== 0 ? getImage(imageId) : null;

          return (
            <button
              key={index}
              onClick={() => onCellClick?.(index, imageId)}
              disabled={isCenter || !onCellClick}
              className={`
                ${sizeClasses[size]}
                bingo-cell rounded-lg overflow-hidden
                border-2 transition-all duration-200
                ${isCenter ? "star-cell border-amber-400" : "border-[#2d2a4a]"}
                ${isMarked && !isCenter ? "marked border-green-400" : ""}
                ${!isCenter && onCellClick ? "hover:border-purple-400 cursor-pointer" : ""}
                ${!isCenter && !isMarked ? "bg-[#0c0a1d]" : ""}
                relative
              `}
            >
              {isCenter ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl md:text-3xl">⭐</span>
                </div>
              ) : image ? (
                <>
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80px, 96px"
                  />
                  {isMarked && (
                    <div className="absolute inset-0 bg-green-500/60 flex items-center justify-center">
                      <span className="text-xl text-white">✓</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                  ?
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


