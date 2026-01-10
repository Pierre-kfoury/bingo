"use client";

import { type JeuImage } from "@/lib/supabase/types";
import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

interface SectionImagesProps {
  images: JeuImage[];
  isLoading: boolean;
  jeuId: string;
  minRequired: number;
  onImagesChange: () => void;
}

export function SectionImages({
  images,
  isLoading,
  jeuId,
  minRequired,
  onImagesChange
}: SectionImagesProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!confirm("Supprimer cette image ?")) return;

    setIsDeleting(imageId);
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage.from('bingo').remove([filePath]);

      // Delete from database
      await supabase.from('bingo_image').delete().eq('id', imageId);

      onImagesChange();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Supprimer toutes les ${images.length} images ?`)) return;

    try {
      for (const img of images) {
        const urlParts = img.url.split('/');
        const filePath = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;
        await supabase.storage.from('bingo').remove([filePath]);
      }

      await supabase.from('bingo_image').delete().eq('bingo_id', jeuId);
      onImagesChange();
    } catch (error) {
      console.error('Error deleting all images:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="border-b bg-white p-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xl font-semibold">🖼️ Mes images</h2>
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
            🖼️ Mes images ({images.length} image{images.length > 1 ? 's' : ''})
          </h2>
          <div className="flex gap-2">
            <ImageUploader bingoId={jeuId} onUploadComplete={onImagesChange} />
            {images.length > 0 && (
              <Button variant="outline" onClick={handleDeleteAll}>
                🗑️ Tout supprimer
              </Button>
            )}
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Minimum requis : {images.length}/{minRequired} {images.length >= minRequired && '✓'}
        </div>

        {images.length === 0 ? (
          <div className="mt-4 text-center text-gray-500">
            <p>Ajoutez au moins {minRequired} images pour générer des cartes.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {images.map(image => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100"
              >
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
                <button
                  onClick={() => handleDelete(image.id, image.url)}
                  disabled={isDeleting === image.id}
                  className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                >
                  {isDeleting === image.id ? '...' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
