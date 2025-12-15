"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ImageUploader } from "@/components/ImageUploader";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useBingo } from "@/lib/supabase/context";
import { imagesService } from "@/lib/supabase/images";
import type { BingoImage } from "@/lib/supabase/types";

export default function ImagesPage() {
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-20">
          {bingoLoading ? (
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎯</span>
              <p className="text-xl text-gray-400">Aucun bingo sélectionné</p>
              <p className="text-gray-500 mt-2">
                Créez ou sélectionnez un bingo depuis la page d&apos;accueil
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            🖼️ Galerie d&apos;images
          </h1>
          <p className="text-gray-400">
            {images.length} image{images.length !== 1 ? "s" : ""} • Minimum 8
            pour créer une grille
          </p>
        </div>
        {images.length > 0 && (
          <button
            onClick={() => setShowDeleteAllModal(true)}
            disabled={isDeletingAll}
            className="px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeletingAll ? "Suppression..." : "🗑️ Supprimer tout"}
          </button>
        )}
      </div>

      {/* Uploader */}
      <div className="mb-8">
        <ImageUploader bingoId={currentBingo.id} onUploadComplete={handleUploadComplete} />
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1730] rounded-2xl border border-[#2d2a4a]">
          <span className="text-6xl mb-4 block">📷</span>
          <p className="text-xl text-gray-400">Aucune image pour le moment</p>
          <p className="text-gray-500 mt-2">
            Uploadez des photos pour commencer !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-xl overflow-hidden bg-[#1a1730] border border-[#2d2a4a]"
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 12.5vw"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                <p className="text-white text-xs px-2 text-center truncate w-full mb-2">
                  {image.name}
                </p>
                <button
                  onClick={() => handleDelete(image.id)}
                  disabled={deleteId === image.id}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium transition-colors"
                >
                  {deleteId === image.id ? "..." : "🗑️ Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
