import sharp from "sharp";

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation to fix rotated images
    .resize(2000, 2000, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 95 })
    .toBuffer();
}

export function getContentType(): string {
  return "image/webp";
}

