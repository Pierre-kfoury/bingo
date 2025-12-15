import sharp from "sharp";

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation to fix rotated images
    .resize(800, 800, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 90 })
    .toBuffer();
}

export function getContentType(): string {
  return "image/webp";
}

