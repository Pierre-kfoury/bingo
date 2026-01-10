"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Grid3X3,
  Users,
  FileStack,
  Images,
  Snowflake,
  PartyPopper,
} from "lucide-react";
import type { BingoImage, CreateBingoInput, BingoTheme } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

// Background images for Christmas theme
const NOEL_BACKGROUNDS = [
  "/noel/noel_red.png",
  "/noel/noel_green.png",
  "/noel/noel_golden.png",
  "/noel/noel_gray.png",
];

// Background images for Birthday theme
const BIRTHDAY_BACKGROUNDS = [
  "/birthday/anniv1.png",
  "/birthday/anniv2.png",
  "/birthday/anniv3.png",
  "/birthday/anniv4.png",
];

type LivePreviewProps = {
  data: CreateBingoInput;
  images: BingoImage[];
  currentStep: number;
};

type ThemePreview = {
  pageBg: string;
  gridBg: string;
  border: string;
  titleColor: string;
  cellBorder: string;
};

const THEMES: Record<BingoTheme, { label: string; icon: React.ElementType; colors: string; preview: ThemePreview }> = {
  standard: {
    label: "Standard",
    icon: Grid3X3,
    colors: "from-slate-500 to-slate-600",
    preview: {
      pageBg: "bg-white",
      gridBg: "bg-white",
      border: "border-gray-300",
      titleColor: "text-gray-800",
      cellBorder: "border-gray-300",
    },
  },
  christmas: {
    label: "Noël",
    icon: Snowflake,
    colors: "from-red-500 to-green-600",
    preview: {
      pageBg: "bg-gradient-to-br from-red-50 to-green-50",
      gridBg: "bg-gradient-to-br from-red-100/50 to-green-100/50",
      border: "border-red-400",
      titleColor: "text-red-700",
      cellBorder: "border-red-300",
    },
  },
  birthday: {
    label: "Anniversaire",
    icon: PartyPopper,
    colors: "from-pink-500 to-purple-600",
    preview: {
      pageBg: "bg-gradient-to-br from-pink-50 to-purple-50",
      gridBg: "bg-gradient-to-br from-pink-100/50 to-purple-100/50",
      border: "border-pink-400",
      titleColor: "text-purple-700",
      cellBorder: "border-pink-300",
    },
  },
};

function getCenterIndex(size: number): number | null {
  if (size % 2 === 0) return null;
  return Math.floor((size * size) / 2);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function LivePreview({ data, images, currentStep }: LivePreviewProps) {
  const currentTheme = THEMES[data.theme];
  const ThemeIcon = currentTheme.icon;
  const totalCells = data.grid_size * data.grid_size;
  const hasCenter = data.grid_size % 2 !== 0;
  const cellsPerGrid = hasCenter ? totalCells - 1 : totalCells;
  const totalPages = data.player_count; // One page per player
  const totalGrids = data.player_count * data.grids_per_page;
  const centerIndex = getCenterIndex(data.grid_size);
  const minImages = cellsPerGrid;
  const hasEnoughImages = images.length >= minImages;

  // Generate preview grids
  const previewGrids = useMemo(() => {
    if (images.length === 0) {
      // Return empty placeholder grids
      const emptyGrid: (BingoImage | null)[] = [];
      for (let j = 0; j < totalCells; j++) {
        if (j === centerIndex) {
          emptyGrid.push({ id: "star", name: "star", url: "", bingo_id: "", created_at: "" });
        } else {
          emptyGrid.push(null);
        }
      }
      return Array(data.grids_per_page).fill(emptyGrid);
    }

    const grids: (BingoImage | null)[][] = [];
    for (let i = 0; i < data.grids_per_page; i++) {
      const shuffled = shuffleArray(images);
      const gridImages: (BingoImage | null)[] = [];
      let imageIndex = 0;
      for (let j = 0; j < totalCells; j++) {
        if (j === centerIndex) {
          gridImages.push({ id: "star", name: "star", url: "", bingo_id: "", created_at: "" });
        } else {
          gridImages.push(shuffled[imageIndex % shuffled.length] || null);
          imageIndex++;
        }
      }
      grids.push(gridImages);
    }
    return grids;
  }, [images, data.grids_per_page, totalCells, centerIndex]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
            currentTheme.colors
          )}
        >
          <ThemeIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate">
            {data.name || "Nouveau Bingo"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentTheme.label} • {data.grid_size}×{data.grid_size}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-bold">{data.player_count}</span> page{data.player_count > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
          <Grid3X3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-bold">{totalGrids}</span> grille{totalGrids > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
          <FileStack className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-bold">{data.grids_per_page}</span>/page
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
          <Images className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className={cn("font-bold", hasEnoughImages ? "text-green-500" : "text-amber-500")}>
              {images.length}
            </span>
            /{minImages} photos
          </span>
        </div>
      </div>

      {/* Page Preview */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Aperçu d&apos;une page</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {data.grids_per_page} grille{data.grids_per_page > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Page preview container - A4 ratio */}
          <div
            className={cn(
              "relative w-full rounded-lg border-2 overflow-hidden transition-all duration-300",
              currentTheme.preview.pageBg,
              currentTheme.preview.border
            )}
            style={{ aspectRatio: "210 / 297" }}
          >
            {/* Grids container */}
            <div
              className={cn(
                "absolute inset-2 flex items-center justify-center",
                data.grids_per_page === 1 && "p-3",
                data.grids_per_page === 2 && "p-2",
                data.grids_per_page === 4 && "p-1"
              )}
            >
              <div
                className={cn(
                  "w-full h-full grid gap-2",
                  data.grids_per_page === 1 && "grid-cols-1",
                  (data.grids_per_page === 2 || data.grids_per_page === 4) && "grid-cols-2 grid-rows-2"
                )}
              >
                {previewGrids.map((grid, gridIndex) => {
                  const bgImage = data.theme === "christmas" 
                    ? NOEL_BACKGROUNDS[gridIndex % NOEL_BACKGROUNDS.length]
                    : data.theme === "birthday"
                    ? BIRTHDAY_BACKGROUNDS[gridIndex % BIRTHDAY_BACKGROUNDS.length]
                    : null;
                  const isChristmas = data.theme === "christmas";
                  const isBirthday = data.theme === "birthday";
                  const hasBackgroundImage = isChristmas || isBirthday;

                  return (
                    <div
                      key={gridIndex}
                      className={cn(
                        "relative overflow-hidden w-full h-full flex flex-col",
                        !hasBackgroundImage && currentTheme.preview.gridBg,
                        !hasBackgroundImage && "border",
                        !hasBackgroundImage && currentTheme.preview.border
                      )}
                      style={{ 
                        ...(bgImage && {
                          backgroundImage: `url(${bgImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        })
                      }}
                    >
                      {/* Grid title - only for non-background themes */}
                      {!hasBackgroundImage && (
                        <p
                          className={cn(
                            "text-center font-bold transition-colors pt-1",
                            currentTheme.preview.titleColor,
                            data.grids_per_page === 1 && "text-xs",
                            data.grids_per_page === 2 && "text-[8px]",
                            data.grids_per_page === 4 && "text-[6px]"
                          )}
                        >
                          Grille {gridIndex + 1}
                        </p>
                      )}
                      
                      {/* Cells grid - positioned at bottom for background themes */}
                      <div
                        className={cn(
                          hasBackgroundImage 
                            ? "absolute inset-2 flex items-end justify-center" 
                            : "w-full flex-1 flex items-center justify-center p-1"
                        )}
                      >
                        <div
                          className={cn(
                            "grid",
                            hasBackgroundImage && "w-full"
                          )}
                          style={{
                            gridTemplateColumns: `repeat(${data.grid_size}, 1fr)`,
                            gridTemplateRows: `repeat(${data.grid_size}, 1fr)`,
                            gap: hasBackgroundImage ? "3px" : "1px",
                            width: hasBackgroundImage ? "100%" : "100%",
                            aspectRatio: "1 / 1",
                            maxHeight: hasBackgroundImage ? "68%" : "100%",
                            maxWidth: "100%",
                          }}
                        >
                        {grid.map((image: BingoImage | null, cellIndex: number) => {
                          const isStar = image?.id === "star";
                          return (
                            <div
                              key={cellIndex}
                              className={cn(
                                "flex items-center justify-center overflow-hidden",
                                hasBackgroundImage 
                                  ? "bg-white/95 rounded-lg border border-white/50" 
                                  : cn("border", currentTheme.preview.cellBorder, image ? "bg-white" : "bg-gray-100")
                              )}
                            >
                              {isStar ? (
                                <span className="w-full h-full flex items-center justify-center text-[80%]">
                                  ⭐
                                </span>
                              ) : image?.url ? (
                                <Image
                                  src={image.url}
                                  alt=""
                                  width={300}
                                  height={300}
                                  quality={95}
                                  className={cn(
                                    "w-full h-full object-cover",
                                    hasBackgroundImage && "rounded-lg"
                                  )}
                                />
                              ) : (
                                <div className={cn(
                                  "w-full h-full bg-gray-200/50",
                                  hasBackgroundImage && "rounded-lg"
                                )} />
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress indicator */}
      <div className="text-center text-xs text-muted-foreground">
        {currentStep === 1 && "Configurez les paramètres"}
        {currentStep === 2 && (hasEnoughImages ? "Photos prêtes ✓" : `Encore ${minImages - images.length} photo${minImages - images.length > 1 ? "s" : ""}`)}
        {currentStep === 3 && "Prêt à générer !"}
      </div>
    </div>
  );
}

