"use client";

import { useState, useEffect, use, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBingo } from "@/lib/supabase/context";
import { imagesService } from "@/lib/supabase/images";
import { gridService } from "@/lib/supabase/grids";
import type { BingoImage, GridWithGroup } from "@/lib/supabase/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getCenterIndex(size: number): number | null {
  if (size % 2 === 0) return null;
  return Math.floor((size * size) / 2);
}

export default function GrillePrintPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const gridId = resolvedParams.id;
  const { currentBingo, isLoading: bingoLoading } = useBingo();

  const [grid, setGrid] = useState<GridWithGroup | null>(null);
  const [images, setImages] = useState<Map<string, BingoImage>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentBingo) {
        setIsLoading(false);
        return;
      }

      try {
        const [gridData, imagesData] = await Promise.all([
          gridService.getByIdWithGroup(gridId),
          imagesService.getAll(currentBingo.id),
        ]);

        setGrid(gridData);
        setImages(new Map(imagesData.map((img) => [img.id, img])));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!bingoLoading) {
      fetchData();
    }
  }, [gridId, currentBingo, bingoLoading]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || bingoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!grid) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block">❌</span>
        <p className="text-xl text-gray-400">Grille introuvable</p>
        <Link
          href="/grilles"
          className="inline-block mt-4 px-6 py-3 bg-purple-600 rounded-xl"
        >
          Retour aux grilles
        </Link>
      </div>
    );
  }

  const centerIndex = getCenterIndex(grid.grid_group.size);

  return (
    <>
      {/* Screen view */}
      <div className="max-w-4xl mx-auto px-4 print:hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/grilles"
              className="text-gray-400 hover:text-white transition-colors text-sm mb-2 inline-block"
            >
              ← Retour aux grilles
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              🖨️ {grid.name}
            </h1>
            <p className="text-gray-400 text-sm">
              {grid.grid_group.name} • {grid.grid_group.size}×{grid.grid_group.size}
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-xl font-medium hover:from-purple-500 hover:to-amber-400 transition-all"
          >
            🖨️ Imprimer
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Aperçu de la grille. Cliquez sur &quot;Imprimer&quot; pour l&apos;imprimer ou la sauvegarder en PDF.
        </p>

        {/* Preview */}
        <div className="bg-white rounded-2xl p-8 flex justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{grid.name}</h2>
              <p className="text-sm text-gray-500">
                {grid.grid_group.name} • {grid.grid_group.size}×{grid.grid_group.size}
              </p>
            </div>
            <div
              className="border-2 border-gray-800"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${grid.grid_group.size}, 1fr)`,
                gap: "1px",
              }}
            >
              {grid.cells.map((imageId, index) => {
                const isCenter = index === centerIndex;
                const isStar = imageId === "star";
                const image = !isStar ? images.get(imageId) : null;

                return (
                  <div
                    key={index}
                    className="aspect-square border border-gray-300 bg-white flex items-center justify-center overflow-hidden"
                  >
                    {isCenter || isStar ? (
                      <span className="text-3xl">⭐</span>
                    ) : image ? (
                      <Image
                        src={image.url}
                        alt={image.name}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">?</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Print view - only visible when printing */}
      <div ref={printRef} className="hidden print:block">
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              background: white !important;
              color: black !important;
            }
            .print\\:block {
              display: block !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black">{grid.name}</h1>
          <p className="text-sm text-gray-600">
            {grid.grid_group.name} • {grid.grid_group.size}×{grid.grid_group.size}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-[190mm] max-w-full">
            <div
              className="border-2 border-black"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${grid.grid_group.size}, 1fr)`,
              }}
            >
              {grid.cells.map((imageId, index) => {
                const isCenter = index === centerIndex;
                const isStar = imageId === "star";
                const image = !isStar ? images.get(imageId) : null;

                return (
                  <div
                    key={index}
                    className="aspect-square border border-gray-400 bg-white flex items-center justify-center overflow-hidden"
                  >
                    {isCenter || isStar ? (
                      <span className="text-4xl">⭐</span>
                    ) : image ? (
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">?</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
