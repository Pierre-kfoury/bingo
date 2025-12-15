"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBingo } from "@/lib/supabase/context";
import { imagesService } from "@/lib/supabase/images";
import { gridService } from "@/lib/supabase/grids";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import type { BingoImage, GridWithGroup, BingoTheme } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

// Background images for Christmas theme
const NOEL_BACKGROUNDS = [
  "/noel/noel_red.png",
  "/noel/noel_green.png",
  "/noel/noel_golden.png",
  "/noel/noel_gray.png",
];

function getCenterIndex(size: number): number | null {
  if (size % 2 === 0) return null;
  return Math.floor((size * size) / 2);
}

const THEME_STYLES: Record<BingoTheme, { bg: string; border: string; title: string }> = {
  standard: {
    bg: "bg-white",
    border: "border-gray-300",
    title: "text-gray-800",
  },
  christmas: {
    bg: "bg-gradient-to-br from-red-50 to-green-50",
    border: "border-red-400",
    title: "text-red-700",
  },
  birthday: {
    bg: "bg-gradient-to-br from-pink-50 to-purple-50",
    border: "border-pink-400",
    title: "text-purple-700",
  },
};

export default function PrintAllGrillesPage() {
  const { currentBingo, isLoading: bingoLoading } = useBingo();
  const [grids, setGrids] = useState<GridWithGroup[]>([]);
  const [images, setImages] = useState<Map<string, BingoImage>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const gridsPerPage = currentBingo?.grids_per_page || 1;
  const theme = currentBingo?.theme || "standard";
  const themeStyle = THEME_STYLES[theme];

  const fetchData = useCallback(async () => {
    if (!currentBingo) {
      setGrids([]);
      setImages(new Map());
      setIsLoading(false);
      return;
    }

    try {
      const [gridsData, imagesData] = await Promise.all([
        gridService.getAllForBingo(currentBingo.id),
        imagesService.getAll(currentBingo.id),
      ]);

      setGrids(gridsData);
      setImages(new Map(imagesData.map((img) => [img.id, img])));
      setSelectedIds(new Set(gridsData.map((g) => g.id)));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentBingo]);

  useEffect(() => {
    if (!bingoLoading) {
      fetchData();
    }
  }, [fetchData, bingoLoading]);

  const handlePrint = () => {
    window.print();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(grids.map((g) => g.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const selectedGrids = grids.filter((g) => selectedIds.has(g.id));

  // Group selected grids into pages
  const pages: GridWithGroup[][] = [];
  for (let i = 0; i < selectedGrids.length; i += gridsPerPage) {
    pages.push(selectedGrids.slice(i, i + gridsPerPage));
  }

  if (isLoading || bingoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentBingo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block">🎯</span>
        <p className="text-xl text-muted-foreground">Aucun bingo sélectionné</p>
      </div>
    );
  }

  return (
    <>
      {/* Screen view - selection UI */}
      <div className="max-w-4xl mx-auto px-4 print:hidden py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" asChild>
              <Link href="/grilles">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux grilles
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">
              Imprimer les grilles
            </h1>
          </div>
          <Button
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className="gradient-primary"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer ({pages.length} page{pages.length > 1 ? "s" : ""})
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-muted-foreground">
                  {gridsPerPage} grille{gridsPerPage > 1 ? "s" : ""} par page
                </p>
                <Badge variant="secondary">{theme}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Tout sélectionner
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Tout désélectionner
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {grids.map((grid) => (
                <div
                  key={grid.id}
                  onClick={() => toggleSelect(grid.id)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all cursor-pointer",
                    selectedIds.has(grid.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedIds.has(grid.id)} />
                    <span className="text-sm font-medium truncate">
                      {grid.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {grid.grid_group.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {pages.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-4 text-center">
                Aperçu ({gridsPerPage} grille{gridsPerPage > 1 ? "s" : ""} par page)
              </p>
              <div className="bg-white rounded-xl p-4 space-y-4">
                {pages.slice(0, 2).map((pageGrids, pageIndex) => {
                  const isChristmas = theme === "christmas";
                  
                  return (
                    <div
                      key={pageIndex}
                      className={cn(
                        "border rounded-lg overflow-hidden",
                        themeStyle.border,
                        !isChristmas && themeStyle.bg
                      )}
                    >
                      <p className="text-center text-xs text-gray-500 py-1 bg-white/80">
                        Page {pageIndex + 1}
                      </p>
                      <div
                        className={cn(
                          "grid",
                          gridsPerPage === 1 && "grid-cols-1",
                          gridsPerPage === 2 && "grid-cols-2",
                          gridsPerPage === 4 && "grid-cols-2 grid-rows-2"
                        )}
                        style={{ aspectRatio: gridsPerPage === 4 ? "210 / 297" : undefined }}
                      >
                        {pageGrids.map((grid, gridIndex) => {
                          const centerIndex = getCenterIndex(grid.grid_group.size);
                          const bgImage = isChristmas 
                            ? NOEL_BACKGROUNDS[gridIndex % NOEL_BACKGROUNDS.length]
                            : null;

                          return (
                            <div 
                              key={grid.id}
                              className="relative"
                              style={{
                                ...(bgImage && {
                                  backgroundImage: `url(${bgImage})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }),
                                ...(!bgImage && {
                                  padding: "0.5rem",
                                })
                              }}
                            >
                              {/* Title only for non-christmas */}
                              {!isChristmas && (
                                <p className={cn(
                                  "text-center text-xs font-bold mb-1",
                                  themeStyle.title
                                )}>
                                  {grid.name}
                                </p>
                              )}
                              
                              {/* Grid positioned at bottom for christmas */}
                              <div
                                className={cn(
                                  !isChristmas && "border border-gray-300",
                                  isChristmas && "absolute bottom-1 left-1 right-1"
                                )}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: `repeat(${grid.grid_group.size}, 1fr)`,
                                  gridTemplateRows: `repeat(${grid.grid_group.size}, 1fr)`,
                                  gap: isChristmas ? "2px" : "1px",
                                  aspectRatio: isChristmas ? undefined : "1 / 1",
                                  height: isChristmas ? "65%" : undefined,
                                }}
                              >
                                {grid.cells.map((imageId, index) => {
                                  const isCenter = index === centerIndex;
                                  const isStar = imageId === "star";
                                  const image = !isStar ? images.get(imageId) : null;
                                  return (
                                    <div
                                      key={index}
                                      className={cn(
                                        "flex items-center justify-center overflow-hidden",
                                        isChristmas ? "bg-white/95 rounded" : "bg-white"
                                      )}
                                    >
                                      {isCenter || isStar ? (
                                        <span className="w-full h-full flex items-center justify-center text-[10px]">⭐</span>
                                      ) : image ? (
                                        <img
                                          src={image.url}
                                          alt=""
                                          className={cn(
                                            "w-full h-full object-cover",
                                            isChristmas && "rounded"
                                          )}
                                        />
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {pages.length > 2 && (
                  <p className="text-center text-muted-foreground text-sm">
                    ... et {pages.length - 2} autre{pages.length - 2 > 1 ? "s" : ""} page{pages.length - 2 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print view */}
      <div className="hidden print:block">
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-page {
              page-break-after: always;
              height: 281mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 3mm;
            }
            .print-page:last-child {
              page-break-after: auto;
            }
            .grids-container-1 {
              display: flex;
              flex-direction: column;
              width: 100%;
              height: 100%;
              justify-content: center;
              align-items: center;
            }
            .grids-container-2 {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(2, 1fr);
              gap: 6mm;
              width: 100%;
              height: 100%;
            }
            .grids-container-4 {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(2, 1fr);
              gap: 6mm;
              width: 100%;
              height: 100%;
            }
          }
        `}</style>

        {pages.map((pageGrids, pageIndex) => {
          const isChristmas = theme === "christmas";

          return (
            <div key={pageIndex} className="print-page">
              <div className={`grids-container-${gridsPerPage}`}>
                {pageGrids.map((grid, gridIndex) => {
                  const centerIndex = getCenterIndex(grid.grid_group.size);
                  const bgImage = isChristmas 
                    ? NOEL_BACKGROUNDS[gridIndex % NOEL_BACKGROUNDS.length]
                    : null;

                  return (
                    <div 
                      key={grid.id} 
                      className="relative w-full h-full flex flex-col"
                      style={{
                        ...(bgImage && {
                          backgroundImage: `url(${bgImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }),
                        ...(!bgImage && {
                          backgroundColor: theme === "birthday" ? "#fdf2f8" : "white",
                        })
                      }}
                    >
                      {/* Grid title - only for non-christmas */}
                      {!isChristmas && (
                        <h2 
                          className={cn(
                            "font-bold text-center pt-2",
                            themeStyle.title,
                            gridsPerPage === 1 ? "text-2xl mb-2" : "text-sm mb-1"
                          )}
                        >
                          {grid.name}
                        </h2>
                      )}
                      
                      {/* Grid cells container - positioned at bottom for christmas */}
                      <div
                        className={cn(
                          isChristmas 
                            ? "absolute inset-2 flex items-end justify-center" 
                            : "flex items-center justify-center px-1 pb-1 flex-1"
                        )}
                      >
                        <div
                          className={cn(
                            !isChristmas && "border-2",
                            !isChristmas && themeStyle.border,
                            isChristmas && "h-full"
                          )}
                          style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${grid.grid_group.size}, 1fr)`,
                            gridTemplateRows: `repeat(${grid.grid_group.size}, 1fr)`,
                            width: "100%",
                            maxWidth: isChristmas ? "100%" : gridsPerPage === 1 ? "190mm" : "100%",
                            aspectRatio: isChristmas ? undefined : "1 / 1",
                            gap: isChristmas ? "4px" : "1px",
                            maxHeight: isChristmas ? "68%" : !isChristmas ? "100%" : undefined,
                          }}
                        >
                          {grid.cells.map((imageId, index) => {
                            const isCenter = index === centerIndex;
                            const isStar = imageId === "star";
                            const image = !isStar ? images.get(imageId) : null;
                            return (
                              <div
                                key={index}
                                className={cn(
                                  "flex items-center justify-center overflow-hidden",
                                  isChristmas 
                                    ? "bg-white/95 rounded-lg border border-white/30" 
                                    : "border border-gray-400 bg-white"
                                )}
                              >
                                {isCenter || isStar ? (
                                  <span className={cn(
                                    "w-full h-full flex items-center justify-center",
                                    gridsPerPage === 1 ? "text-5xl" : "text-2xl"
                                  )}>⭐</span>
                                ) : image ? (
                                  <img
                                    src={image.url}
                                    alt=""
                                    className={cn(
                                      "w-full h-full object-cover",
                                      isChristmas && "rounded-lg"
                                    )}
                                  />
                                ) : null}
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
          );
        })}
      </div>
    </>
  );
}
