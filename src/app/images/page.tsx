"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ImageUploader";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBingo } from "@/lib/supabase/context";
import { imagesService } from "@/lib/supabase/images";
import { ArrowLeft, Loader2, Trash2, Grid3X3, Play } from "lucide-react";
import type { BingoImage } from "@/lib/supabase/types";

export default function ImagesPage() {
  const router = useRouter();
  const { currentBingo, isLoading: bingoLoading } = useBingo();
  const [images, setImages] = useState<BingoImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!currentBingo) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await imagesService.getAll(currentBingo.id);
      setImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentBingo]);

  useEffect(() => {
    if (!bingoLoading) {
      fetchImages();
    }
  }, [fetchImages, bingoLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette image ?")) return;

    setDeleteId(id);
    try {
      await fetch(`/api/images?id=${id}`, {
        method: "DELETE",
      });
      fetchImages();
    } catch (error) {
      console.error("Error deleting image:", error);
    }
    setDeleteId(null);
  };

  const handleDeleteAll = async () => {
    if (!currentBingo) return;

    setIsDeletingAll(true);
    try {
      const response = await fetch(`/api/images?all=true&bingoId=${currentBingo.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        fetchImages();
        alert(`✅ ${result.deleted} images supprimées avec succès !${result.failed > 0 ? `\n⚠️ ${result.failed} fichiers n'ont pas pu être supprimés.` : ""}`);
      } else {
        throw new Error("Failed to delete all images");
      }
    } catch (error) {
      console.error("Error deleting all images:", error);
      alert("❌ Erreur lors de la suppression des images");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleUploadComplete = async (uploadedImages: BingoImage[]) => {
    setImages((prev) => [...uploadedImages, ...prev]);
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Galerie d&apos;images
          </h1>
          <p className="text-muted-foreground">
            {images.length} image{images.length !== 1 ? "s" : ""} • Minimum 8
            pour créer une grille
          </p>
        </div>
        {images.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAllModal(true)}
            disabled={isDeletingAll}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeletingAll ? "Suppression..." : "Supprimer tout"}
          </Button>
        )}
      </div>

      {/* Uploader */}
      <div className="mb-8">
        <ImageUploader bingoId={currentBingo.id} onUploadComplete={handleUploadComplete} />
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : images.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <span className="text-6xl mb-4 block">📷</span>
            <p className="text-xl text-muted-foreground">
              Aucune image pour le moment
            </p>
            <p className="text-muted-foreground mt-2">
              Uploadez des photos pour commencer !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 12.5vw"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <p className="text-white text-xs px-2 text-center truncate w-full">
                  {image.name}
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(image.id)}
                  disabled={deleteId === image.id}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {deleteId === image.id ? "..." : "Supprimer"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation shortcuts */}
      <div className="mt-8 flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/grilles">
            <Grid3X3 className="w-4 h-4 mr-2" />
            Voir les grilles
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tirage">
            <Play className="w-4 h-4 mr-2" />
            Lancer un tirage
          </Link>
        </Button>
      </div>

      {/* Confirm delete all modal */}
      <ConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAll}
        title="⚠️ Supprimer toutes les images"
        message={`Vous êtes sur le point de supprimer TOUTES les ${images.length} images.\n\nCela supprimera aussi les fichiers de Supabase Storage.\n\nCette action est IRRÉVERSIBLE.`}
        confirmText="Supprimer tout"
        requireTyping={true}
        typingText="SUPPRIMER TOUT"
        isDangerous={true}
      />
    </div>
  );
}
