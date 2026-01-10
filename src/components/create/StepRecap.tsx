"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  Grid3X3,
  Loader2,
  Snowflake,
  PartyPopper,
  Play,
  Printer,
  RefreshCw,
  FileDown,
} from "lucide-react";
import type { BingoImage, CreateBingoInput, BingoTheme } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type StepRecapProps = {
  data: CreateBingoInput;
  images: BingoImage[];
  onChange: (data: Partial<CreateBingoInput>) => void;
  onPrevious: () => void;
  onConfirm: () => Promise<string[]>;
  isEditMode?: boolean;
  jeuId?: string;
};

const THEMES: { value: BingoTheme; label: string; icon: React.ElementType; colors: string }[] = [
  {
    value: "standard",
    label: "Standard",
    icon: Grid3X3,
    colors: "from-slate-500 to-slate-600",
  },
  {
    value: "christmas",
    label: "Noël",
    icon: Snowflake,
    colors: "from-red-500 to-green-600",
  },
  {
    value: "birthday",
    label: "Anniversaire",
    icon: PartyPopper,
    colors: "from-pink-500 to-purple-600",
  },
];

export function StepRecap({ data, images, onChange, onPrevious, onConfirm, isEditMode = false, jeuId }: StepRecapProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(isEditMode);
  const [carteIds, setCarteIds] = useState<string[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const totalCells = data.grid_size * data.grid_size;
  const hasCenter = data.grid_size % 2 !== 0;
  const cellsPerGrid = hasCenter ? totalCells - 1 : totalCells;
  const totalGrids = data.player_count * data.grids_per_page;
  const totalPages = data.player_count;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const ids = await onConfirm();
      setCarteIds(ids);
      setHasGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!jeuId || carteIds.length === 0) return;

    setIsGeneratingPDF(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carteIds,
          jeuId,
          gridsPerPage: data.grids_per_page,
          theme: data.theme,
          jeuName: data.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.name.replace(/[^a-z0-9]/gi, "_")}_cartes.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1">Validation</h2>
        <p className="text-muted-foreground text-sm">
          Vérifiez et personnalisez le thème avant de générer
        </p>
      </div>

      {/* Theme selector - modifiable */}
      <div className="space-y-3">
        <Label>Thème des grilles</Label>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((theme) => {
            const Icon = theme.icon;
            const isSelected = data.theme === theme.value;
            return (
              <button
                key={theme.value}
                type="button"
                onClick={() => onChange({ theme: theme.value })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    theme.colors
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{data.name || <span className="text-muted-foreground italic">Sans nom</span>}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Grille</p>
              <p className="font-medium">
                {data.grid_size}×{data.grid_size} ({cellsPerGrid} cases)
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Joueurs</p>
              <p className="font-medium">{data.player_count} joueur{data.player_count > 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Impression</p>
              <p className="font-medium">
                {data.grids_per_page} grille{data.grids_per_page > 1 ? "s" : ""}/page • {totalPages} page{totalPages > 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Photos</p>
              <p className="font-medium text-green-500">{images.length} ✓</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <p className="text-sm text-primary">
          💡 {totalGrids} grilles uniques seront générées : {data.player_count} page{totalPages > 1 ? "s" : ""} avec {data.grids_per_page} grille{data.grids_per_page > 1 ? "s" : ""} chacune.
        </p>
      </div>

      {/* Footer */}
      {hasGenerated ? (
        <div className="space-y-4 pt-4">
          {/* Success message */}
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-green-400 font-medium">
              ✅ {totalGrids} grilles générées avec succès ! ({data.player_count} page{totalPages > 1 ? "s" : ""} × {data.grids_per_page} grille{data.grids_per_page > 1 ? "s" : ""})
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => router.push("/tirage")}
              className="gradient-primary"
            >
              <Play className="w-4 h-4 mr-2" />
              Lancer le tirage
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleDownloadPDF}
              disabled={carteIds.length === 0 || isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </>
              )}
            </Button>
          </div>

          {/* Regenerate button */}
          <Button
            variant="outline"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Régénération...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regénérer les grilles
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex justify-between pt-4">
          <Button variant="secondary" onClick={onPrevious} disabled={isLoading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading}
            className="gradient-primary px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Générer les grilles
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
