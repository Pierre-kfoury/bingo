import { supabase } from "./client";
import type { BingoImage } from "./types";
import { sanitizeFilename } from "@/lib/utils";

const BUCKET_NAME = "bingo-images";

export const imagesService = {
  async getAll(bingoId: string): Promise<BingoImage[]> {
    const { data, error } = await supabase
      .from("bingo_image")
      .select("*")
      .eq("bingo_id", bingoId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as BingoImage[]) || [];
  },

  async getById(id: string): Promise<BingoImage | null> {
    const { data, error } = await supabase
      .from("bingo_image")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as BingoImage;
  },

  async getByIds(ids: string[]): Promise<BingoImage[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from("bingo_image")
      .select("*")
      .in("id", ids);

    if (error) throw error;
    return (data as BingoImage[]) || [];
  },

  async upload(
    bingoId: string,
    file: File,
    compressedBuffer: ArrayBuffer
  ): Promise<BingoImage> {
    const filename = `${bingoId}/${Date.now()}-${sanitizeFilename(file.name)}.webp`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, compressedBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);

    // Create database record
    const { data, error } = await supabase
      .from("bingo_image")
      .insert({
        bingo_id: bingoId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: publicUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return data as BingoImage;
  },

  async delete(image: BingoImage): Promise<void> {
    // Extract path from URL for storage deletion
    const urlParts = image.url.split(`${BUCKET_NAME}/`);
    if (urlParts.length > 1) {
      const path = urlParts[1];
      await supabase.storage.from(BUCKET_NAME).remove([path]);
    }

    // Delete database record
    const { error } = await supabase
      .from("bingo_image")
      .delete()
      .eq("id", image.id);

    if (error) throw error;
  },

  async deleteAll(bingoId: string): Promise<number> {
    // Get all images for this bingo
    const images = await this.getAll(bingoId);

    // Delete from storage
    const paths = images
      .map((img) => {
        const urlParts = img.url.split(`${BUCKET_NAME}/`);
        return urlParts.length > 1 ? urlParts[1] : null;
      })
      .filter((p): p is string => p !== null);

    if (paths.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(paths);
    }

    // Delete from database
    const { error } = await supabase
      .from("bingo_image")
      .delete()
      .eq("bingo_id", bingoId);

    if (error) throw error;

    return images.length;
  },
};
