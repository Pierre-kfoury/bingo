"use client";

import { type Carte, type JeuImage } from "@/lib/supabase/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarteMiniature } from "./CarteMiniature";
import { Button } from "@/components/ui/button";

interface SectionCartesProps {
  cartes: Carte[];
  images: JeuImage[];
  isLoading: boolean;
  jeuId: string;
}

export function SectionCartes({ cartes, images, isLoading, jeuId }: SectionCartesProps) {
  const router = useRouter();
  const [selectedCartes, setSelectedCartes] = useState<string[]>([]);

  const handleSelectCarte = (carteId: string, selected: boolean) => {
    setSelectedCartes(prev =>
      selected
        ? [...prev, carteId]
        : prev.filter(id => id !== carteId)
    );
  };

  const handleSelectAll = () => {
    if (selectedCartes.length === cartes.length) {
      setSelectedCartes([]);
    } else {
      setSelectedCartes(cartes.map(c => c.id));
    }
  };

  const handlePrint = () => {
    if (selectedCartes.length === 0) return;
    router.push(`/cartes/print?ids=${selectedCartes.join(',')}`);
  };

  if (isLoading) {
    return (
      <div className="border-b bg-white p-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xl font-semibold">📄 Mes cartes</h2>
          <div className="mt-4 text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            📄 Mes cartes ({cartes.length} carte{cartes.length > 1 ? 's' : ''} générée{cartes.length > 1 ? 's' : ''})
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSelectAll}>
              {selectedCartes.length === cartes.length ? '✓ Tout désélectionner' : '✓ Tout sélectionner'}
            </Button>
            <Button
              onClick={handlePrint}
              disabled={selectedCartes.length === 0}
            >
              🖨️ Imprimer ({selectedCartes.length})
            </Button>
          </div>
        </div>

        {cartes.length === 0 ? (
          <div className="mt-4 text-center text-gray-500">
            <p>Aucune carte générée.</p>
            <p className="mt-2 text-sm">Modifiez votre jeu pour en générer.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cartes.map(carte => (
              <CarteMiniature
                key={carte.id}
                carte={carte}
                images={images}
                selected={selectedCartes.includes(carte.id)}
                onSelect={handleSelectCarte}
                onClick={() => router.push(`/cartes/${carte.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
