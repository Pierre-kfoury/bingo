"use client";

import { type Jeu } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

interface JeuHeaderProps {
  jeu: Jeu;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function JeuHeader({ jeu, onEdit, onDelete }: JeuHeaderProps) {
  const statsText = `${jeu.grid_size}×${jeu.grid_size} • ${jeu.player_count} joueur${jeu.player_count > 1 ? 's' : ''} • ${jeu.grids_per_page} carte${jeu.grids_per_page > 1 ? 's' : ''}/page`;

  return (
    <div className="border-b bg-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{jeu.name}</h1>
            <p className="mt-2 text-sm text-gray-600">{statsText}</p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                ✏️ Modifier
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" onClick={onDelete}>
                🗑️ Supprimer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
