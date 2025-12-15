"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBingo } from "@/lib/supabase/context";
import { imagesService } from "@/lib/supabase/images";
import { gridGroupService, gridService } from "@/lib/supabase/grids";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Trash2,
  Plus,
  Grid3X3,
  Loader2,
  ArrowLeft,
  Snowflake,
  PartyPopper,
} from "lucide-react";
import type { BingoImage, GridGroup, GridWithGroup, BingoTheme } from "@/lib/supabase/types";
import { ConfirmModal } from "@/components/ConfirmModal";

const THEME_ICONS: Record<BingoTheme, React.ElementType> = {
  standard: Grid3X3,
  christmas: Snowflake,
  birthday: PartyPopper,
};

function getCenterIndex(size: number): number | null {
  if (size % 2 === 0) return null;
  return Math.floor((size * size) / 2);
}

export default function GrillesPage() {
  const router = useRouter();
  const { currentBingo, isLoading: bingoLoading } = useBingo();
  const [gridGroups, setGridGroups] = useState<GridGroup[]>([]);
  const [grids, setGrids] = useState<GridWithGroup[]>([]);
  const [images, setImages] = useState<Map<string, BingoImage>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "group" | "grid"; id: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentBingo) {
      setGridGroups([]);
      setGrids([]);
      setImages(new Map());
      setIsLoading(false);
      return;
    }

    try {
      const [groupsData, gridsData, imagesData] = await Promise.all([
        gridGroupService.getAll(currentBingo.id),
        gridService.getAllForBingo(currentBingo.id),
        imagesService.getAll(currentBingo.id),
      ]);

      setGridGroups(groupsData);
      setGrids(gridsData);
      setImages(new Map(imagesData.map((img) => [img.id, img])));
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

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "group") {
        await gridGroupService.delete(deleteTarget.id);
      } else {
        await gridService.delete(deleteTarget.id);
      }
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const renderMiniGrid = (cells: string[], size: number) => {
    const centerIndex = getCenterIndex(size);

    return (
      <div
        className="gap-0.5 w-20 h-20"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
        }}
      >
        {cells.map((imageId, index) => {
          const isCenter = index === centerIndex;
          const isStar = imageId === "star";
          const image = !isStar ? images.get(imageId) : null;

          return (
            <div
              key={index}
              className={`aspect-square rounded-sm overflow-hidden ${
                isCenter || isStar ? "bg-amber-400" : "bg-secondary"
              }`}
            >
              {isCenter || isStar ? (
                <div className="w-full h-full flex items-center justify-center text-[6px]">
                  ⭐
                </div>
              ) : image ? (
                <Image
                  src={image.url}
                  alt=""
                  width={16}
                  height={16}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  // Group grids by grid_group
  const gridsByGroup = new Map<string, GridWithGroup[]>();
  grids.forEach((grid) => {
    const groupId = grid.grid_group_id;
    if (!gridsByGroup.has(groupId)) {
      gridsByGroup.set(groupId, []);
    }
    gridsByGroup.get(groupId)!.push(grid);
  });

  if (bingoLoading || !currentBingo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          {bingoLoading ? (
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          ) : (
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎯</span>
              <p className="text-xl text-muted-foreground">
                Aucun bingo sélectionné
              </p>
              <p className="text-muted-foreground mt-2">
                Créez ou sélectionnez un bingo depuis la page d&apos;accueil
              </p>
              <Button onClick={() => router.push("/")} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l&apos;accueil
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const ThemeIcon = THEME_ICONS[currentBingo.theme] || Grid3X3;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <ThemeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{currentBingo.name}</h1>
              <p className="text-muted-foreground text-sm">
                {currentBingo.grid_size}×{currentBingo.grid_size} • {currentBingo.player_count} joueurs
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            {grids.length} grille{grids.length !== 1 ? "s" : ""} dans{" "}
            {gridGroups.length} lot{gridGroups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {grids.length > 0 && (
            <Button variant="secondary" asChild>
              <Link href="/grilles/print">
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Link>
            </Button>
          )}
          <Button onClick={() => router.push("/create")} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau bingo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : gridGroups.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <span className="text-6xl mb-4 block">📋</span>
            <p className="text-xl text-muted-foreground">
              Aucune grille pour le moment
            </p>
            <p className="text-muted-foreground mt-2 mb-6">
              Les grilles sont générées lors de la création du bingo
            </p>
            <Button onClick={() => router.push("/create")} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Créer un nouveau bingo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {gridGroups.map((group) => {
            const groupGrids = gridsByGroup.get(group.id) || [];
            return (
              <Card key={group.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.size}×{group.size} • {groupGrids.length} grille
                        {groupGrids.length !== 1 ? "s" : ""} •{" "}
                        {new Date(group.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ type: "group", id: group.id })}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer le lot
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {groupGrids.map((grid) => (
                      <div
                        key={grid.id}
                        className="p-3 bg-secondary/50 rounded-xl border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {grid.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(grid.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          {renderMiniGrid(grid.cells, group.size)}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 gradient-primary"
                            asChild
                          >
                            <Link href={`/grilles/${grid.id}`}>
                              <Printer className="w-3 h-3 mr-1" />
                              Imprimer
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTarget({ type: "grid", id: grid.id })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Shortcuts to other pages */}
      <div className="mt-8 flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/images">
            📷 Gérer les images
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tirage">
            🎯 Lancer un tirage
          </Link>
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === "group" ? "Supprimer le lot" : "Supprimer la grille"}
        message={
          deleteTarget?.type === "group"
            ? "Êtes-vous sûr de vouloir supprimer ce lot et toutes ses grilles ?"
            : "Êtes-vous sûr de vouloir supprimer cette grille ?"
        }
      />
    </div>
  );
}
