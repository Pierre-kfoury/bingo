"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Snowflake, PartyPopper, Grid3X3 } from "lucide-react";
import type { BingoTheme, CreateBingoInput } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type StepParametersProps = {
  data: CreateBingoInput;
  onChange: (data: Partial<CreateBingoInput>) => void;
  onNext: () => void;
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

const GRID_SIZES = [
  { value: 3, label: "3×3", cells: 9 },
  { value: 4, label: "4×4", cells: 16 },
  { value: 5, label: "5×5", cells: 25 },
  { value: 6, label: "6×6", cells: 36 },
  { value: 7, label: "7×7", cells: 49 },
];

const GRIDS_PER_PAGE = [
  { value: 1, label: "1", description: "Grand" },
  { value: 2, label: "2", description: "Moyen" },
  { value: 4, label: "4", description: "Petit" },
];

export function StepParameters({ data, onChange, onNext }: StepParametersProps) {
  const cellsCount = data.grid_size * data.grid_size;
  const hasCenter = data.grid_size % 2 !== 0;
  const minImages = hasCenter ? cellsCount - 1 : cellsCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1">Paramètres du bingo</h2>
        <p className="text-muted-foreground text-sm">
          Configurez les paramètres de base de votre bingo
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Nom du bingo */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom du bingo <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ex: Bingo Noël 2024"
            className="h-11"
          />
        </div>

        {/* Thème */}
        <div className="space-y-2">
          <Label>Thème</Label>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              const isSelected = data.theme === theme.value;
              return (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => onChange({ theme: theme.value })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      theme.colors
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Taille de la grille */}
        <div className="space-y-2">
          <Label>Taille de la grille</Label>
          <div className="flex gap-2">
            {GRID_SIZES.map((size) => (
              <Button
                key={size.value}
                type="button"
                variant={data.grid_size === size.value ? "default" : "secondary"}
                className={cn(
                  "flex-1",
                  data.grid_size === size.value && "gradient-primary"
                )}
                onClick={() => onChange({ grid_size: size.value })}
              >
                {size.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {minImages} photos requises{hasCenter && " (étoile au centre)"}
          </p>
        </div>

        {/* Nombre de joueurs et Grilles par page - même ligne */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="players">Nombre de pages</Label>
            <Input
              id="players"
              type="number"
              min={1}
              max={100}
              value={data.player_count}
              onChange={(e) =>
                onChange({
                  player_count: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                })
              }
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Une page par joueur
            </p>
          </div>

          <div className="space-y-2">
            <Label>Grilles par page</Label>
            <div className="flex gap-2">
              {GRIDS_PER_PAGE.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={data.grids_per_page === option.value ? "default" : "secondary"}
                  className={cn(
                    "flex-1",
                    data.grids_per_page === option.value && "gradient-primary"
                  )}
                  onClick={() => onChange({ grids_per_page: option.value })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={onNext}
          className="gradient-primary"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
