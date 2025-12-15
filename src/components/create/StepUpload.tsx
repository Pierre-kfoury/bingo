"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Upload, X, Loader2 } from "lucide-react";
import type { BingoImage, CreateBingoInput } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type StepUploadProps = {
  bingoId: string;
  data: CreateBingoInput;
  images: BingoImage[];
  onImagesChange: (images: BingoImage[]) => void;
  onPrevious: () => void;
  onNext: () => void;
};

function getMinImagesForSize(size: number): number {
  const totalCells = size * size;
  const centerIndex = size % 2 !== 0 ? Math.floor(totalCells / 2) : null;
  return centerIndex !== null ? totalCells - 1 : totalCells;
}

export function StepUpload({
  bingoId,
  data,
  images,
  onImagesChange,
  onPrevious,
  onNext,
}: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const minImages = getMinImagesForSize(data.grid_size);
  const hasEnoughImages = images.length >= minImages;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setProgress({ current: 0, total: fileArray.length });

    const uploadedImages: BingoImage[] = [];
    const allErrors: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProgress({ current: i + 1, total: fileArray.length });

      const formData = new FormData();
      formData.append("images", file);
      formData.append("bingoId", bingoId);

      try {
        const response = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.images && result.images.length > 0) {
            uploadedImages.push(...result.images);
          }
          if (result.errors) {
            allErrors.push(...result.errors);
          }
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        allErrors.push(`${file.name}: Erreur d'upload`);
      }
    }

    if (uploadedImages.length > 0) {
      onImagesChange([...uploadedImages, ...images]);
    }

    if (allErrors.length > 0) {
      alert(`Erreurs:\n${allErrors.join('\n')}`);
    }

    setIsUploading(false);
    setProgress({ current: 0, total: 0 });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      uploadFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bingoId, images]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDeleteImage = async (image: BingoImage) => {
    try {
      await fetch(`/api/images?id=${image.id}`, { method: "DELETE" });
      onImagesChange(images.filter((img) => img.id !== image.id));
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1">Uploadez vos photos</h2>
        <p className="text-muted-foreground text-sm">
          Minimum {minImages} photos pour une grille {data.grid_size}×{data.grid_size}
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl transition-all cursor-pointer relative",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="p-8 text-center">
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
              <p className="font-medium">
                Upload {progress.current}/{progress.total}
              </p>
              <div className="w-full max-w-xs mx-auto bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full gradient-primary transition-all"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-xl gradient-primary flex items-center justify-center">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-medium">Glissez vos images ici</p>
                <p className="text-sm text-muted-foreground">
                  ou cliquez pour sélectionner
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              hasEnoughImages ? "bg-green-500" : "gradient-primary"
            )}
            style={{
              width: `${Math.min(100, (images.length / minImages) * 100)}%`,
            }}
          />
        </div>
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            hasEnoughImages ? "text-green-500" : "text-muted-foreground"
          )}
        >
          {images.length}/{minImages}
        </span>
      </div>

      {/* Images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover"
                sizes="80px"
              />
              <button
                onClick={() => handleDeleteImage(image)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={onNext}
          disabled={!hasEnoughImages}
          className="gradient-primary"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
