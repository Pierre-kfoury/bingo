import { NextRequest, NextResponse } from "next/server";
import { compressImage } from "@/lib/compress-image";
import { supabase } from "@/lib/supabase/client";
import type { BingoImage } from "@/lib/supabase/types";
import { sanitizeFilename } from "@/lib/utils";

const BUCKET_NAME = "bingo-images";

// Upload images to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const bingoId = formData.get("bingoId") as string;

    if (!bingoId) {
      return NextResponse.json({ error: "bingoId is required" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedImages: BingoImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const compressedBuffer = await compressImage(buffer);

        const filename = `${bingoId}/${Date.now()}-${sanitizeFilename(file.name)}.webp`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, compressedBuffer, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          errors.push(`${file.name}: Upload failed`);
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);

        // Create database record
        const { data: imageRecord, error: dbError } = await supabase
          .from("bingo_image")
          .insert({
            bingo_id: bingoId,
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: publicUrl,
          })
          .select()
          .single();

        if (dbError) {
          console.error("Database error:", dbError);
          // Clean up uploaded file
          await supabase.storage.from(BUCKET_NAME).remove([filename]);
          errors.push(`${file.name}: Database error`);
          continue;
        }

        uploadedImages.push(imageRecord as BingoImage);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push(`${file.name}: Format non supporté ou fichier corrompu`);
      }
    }

    return NextResponse.json({ 
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}

// Delete image from Supabase Storage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");
    const bingoId = searchParams.get("bingoId");
    const deleteAll = searchParams.get("all");

    if (deleteAll === "true" && bingoId) {
      // Get all images for this bingo
      const { data: images, error: fetchError } = await supabase
        .from("bingo_image")
        .select("*")
        .eq("bingo_id", bingoId);

      if (fetchError) throw fetchError;

      let deletedCount = 0;
      let failedCount = 0;

      for (const image of (images as BingoImage[]) || []) {
        try {
          // Extract path from URL
          const urlParts = image.url.split(`${BUCKET_NAME}/`);
          if (urlParts.length > 1) {
            const path = urlParts[1];
            await supabase.storage.from(BUCKET_NAME).remove([path]);
          }
          deletedCount++;
        } catch (error) {
          console.warn(`Could not delete file for image ${image.id}:`, error);
          failedCount++;
        }
      }

      // Delete all database records
      const { error: deleteError } = await supabase
        .from("bingo_image")
        .delete()
        .eq("bingo_id", bingoId);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        success: true,
        deleted: deletedCount,
        failed: failedCount,
        total: images?.length || 0,
      });
    }

    // Delete single image
    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from("bingo_image")
      .select("*")
      .eq("id", imageId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const typedImage = image as BingoImage;

    // Delete from storage
    try {
      const urlParts = typedImage.url.split(`${BUCKET_NAME}/`);
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from(BUCKET_NAME).remove([path]);
      }
    } catch {
      console.warn("Could not delete file from storage");
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from("bingo_image")
      .delete()
      .eq("id", imageId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
