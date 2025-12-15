"use client";

import { useState, useCallback } from "react";
import type { BingoImage } from "@/lib/supabase/types";

type ImageUploaderProps = {
  bingoId: string;
  onUploadComplete: (images: BingoImage[]) => void;
};

export function ImageUploader({ bingoId, onUploadComplete }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState({ current: 0, total: 0 });

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
    setProgress(0);
    setCurrentUpload({ current: 0, total: fileArray.length });

    const uploadedImages: BingoImage[] = [];
    let successCount = 0;
    let errorCount = 0;
    const allErrors: string[] = [];

    try {
      // Upload images one by one
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setCurrentUpload({ current: i + 1, total: fileArray.length });
        
        const formData = new FormData();
        formData.append("images", file);
        formData.append("bingoId", bingoId);

        try {
          const response = await fetch("/api/images", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          const result = await response.json();
          if (result.images && result.images.length > 0) {
            uploadedImages.push(...result.images);
            successCount++;
          }
          if (result.errors) {
            allErrors.push(...result.errors);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          allErrors.push(`${file.name}: Erreur d'upload`);
          errorCount++;
        }

        // Update progress
        setProgress(Math.round(((i + 1) / fileArray.length) * 100));
      }

      // Show results
      if (successCount > 0) {
        onUploadComplete(uploadedImages);
      }
      
      if (allErrors.length > 0) {
        alert(`Erreurs:\n${allErrors.join('\n')}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentUpload({ current: 0, total: 0 });
      }, 1000);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      uploadFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bingoId]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center
        transition-all duration-300 cursor-pointer
        ${
          isDragging
            ? "border-amber-400 bg-amber-400/10"
            : "border-purple-500/50 hover:border-purple-400 bg-[#1a1730]/50"
        }
      `}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />

      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {isUploading ? (
          <div className="space-y-2">
            <p className="text-lg font-medium text-purple-300">
              Envoi de {currentUpload.current}/{currentUpload.total}...
            </p>
            <div className="w-full bg-[#2d2a4a] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              {progress}%
            </p>
          </div>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-200">
              Glissez vos images ici
            </p>
            <p className="text-sm text-gray-400">
              ou cliquez pour sélectionner des fichiers
            </p>
            <p className="text-xs text-purple-400">
              Tous formats acceptés • Optimisation automatique (800x800, WebP)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
