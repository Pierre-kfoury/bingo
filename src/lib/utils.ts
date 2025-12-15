import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeFilename(filename: string): string {
  // Remove file extension if present
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Normalize accented characters (é -> e, à -> a, etc.)
  const normalized = nameWithoutExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  // Replace spaces and special characters with hyphens
  // Keep only alphanumeric, hyphens, and underscores
  const sanitized = normalized
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  
  // Ensure it's not empty and has reasonable length
  return sanitized || "image";
}
