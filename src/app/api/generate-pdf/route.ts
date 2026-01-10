import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { supabase } from "@/lib/supabase/client";
import type { Carte, JeuImage } from "@/lib/supabase/types";

// Background images paths
const NOEL_BACKGROUNDS = [
  "/noel/noel_red.png",
  "/noel/noel_green.png",
  "/noel/noel_golden.png",
  "/noel/noel_gray.png",
];

const BIRTHDAY_BACKGROUNDS = [
  "/birthday/anniv1.png",
  "/birthday/anniv2.png",
  "/birthday/anniv3.png",
  "/birthday/anniv4.png",
];

function getCenterIndex(size: number): number | null {
  if (size % 2 === 0) return null;
  return Math.floor((size * size) / 2);
}

// Load image with both base64 and dimensions, with compression and cropping to square
async function loadImageWithDimensions(
  url: string,
  maxSize: number = 400
): Promise<{
  base64: string;
  dimensions: { width: number; height: number };
}> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize and crop to square using sharp (cover mode)
    const resizedBuffer = await sharp(buffer)
      .resize(maxSize, maxSize, {
        fit: "cover", // This will crop to fill the square
        position: "center",
      })
      .jpeg({
        quality: 95, // Increased from 85 to 95 for better quality
        mozjpeg: true,
      })
      .toBuffer();

    const base64String = resizedBuffer.toString("base64");
    const base64 = `data:image/jpeg;base64,${base64String}`;

    // Return square dimensions since we cropped
    return {
      base64,
      dimensions: { width: maxSize, height: maxSize }
    };
  } catch (error) {
    console.error("Error loading image:", error);
    return {
      base64: "",
      dimensions: { width: 100, height: 100 },
    };
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { carteIds, jeuId, gridsPerPage, theme, jeuName } = body;

    if (!carteIds || !Array.isArray(carteIds) || carteIds.length === 0) {
      return NextResponse.json({ error: "Carte IDs are required" }, { status: 400 });
    }

    if (!jeuId) {
      return NextResponse.json({ error: "Jeu ID is required" }, { status: 400 });
    }

    // Fetch cartes from database
    const { data: cartesData, error: cartesError } = await supabase
      .from("grid")
      .select("*")
      .in("id", carteIds);

    if (cartesError) {
      console.error("Error fetching cartes:", cartesError);
      return NextResponse.json({ error: "Failed to fetch cartes" }, { status: 500 });
    }

    const cartes = cartesData as Carte[];

    // Fetch images from database
    const { data: imagesData, error: imagesError } = await supabase
      .from("bingo_image")
      .select("*")
      .eq("bingo_id", jeuId);

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    const images = new Map<string, JeuImage>(
      (imagesData as JeuImage[]).map((img) => [img.id, img])
    );

    // Generate PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 8;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;

    const isChristmas = theme === "christmas";
    const isBirthday = theme === "birthday";
    const hasBackgroundImage = isChristmas || isBirthday;

    // Group cartes into pages
    const pages: Carte[][] = [];
    for (let i = 0; i < cartes.length; i += gridsPerPage) {
      pages.push(cartes.slice(i, i + gridsPerPage));
    }

    // Load all images as base64
    const imageCache = new Map<string, string>();
    const imageDimensionsCache = new Map<string, { width: number; height: number }>();

    const imageUrls = Array.from(
      new Set(
        cartes.flatMap((carte) =>
          carte.cells
            .filter((id) => id !== "star" && images.has(id))
            .map((id) => images.get(id)!.url)
        )
      )
    );

    // Load background images
    const backgroundCache = new Map<string, string>();
    const bgPaths = isChristmas
      ? NOEL_BACKGROUNDS
      : isBirthday
      ? BIRTHDAY_BACKGROUNDS
      : [];

    for (const bgPath of bgPaths) {
      try {
        // Load background from public folder using file system
        const filePath = path.join(process.cwd(), "public", bgPath);
        const buffer = await readFile(filePath);

        // Compress background image with higher quality for A4 print (210 DPI)
        // A4 at 210mm x 297mm at 210 DPI = 1754 x 2480 pixels
        const compressedBuffer = await sharp(buffer)
          .resize(1754, 2480, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 95, // Increased from 75 to 95 for better print quality
            mozjpeg: true,
          })
          .toBuffer();

        const base64String = compressedBuffer.toString("base64");
        const base64 = `data:image/jpeg;base64,${base64String}`;
        backgroundCache.set(bgPath, base64);
      } catch (error) {
        console.error(`Error loading background: ${bgPath}`, error);
      }
    }

    // Load all images with dimensions
    console.log(`Loading ${imageUrls.length} images...`);
    for (const url of imageUrls) {
      try {
        const { base64, dimensions } = await loadImageWithDimensions(url);
        imageCache.set(url, base64);
        imageDimensionsCache.set(url, dimensions);
      } catch (error) {
        console.error(`Error loading image: ${url}`, error);
      }
    }

    // Generate each page
    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
      if (pageIdx > 0) {
        pdf.addPage();
      }

      // Fill page with white background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Draw background image on entire page if theme has one
      if (hasBackgroundImage) {
        const backgroundIndex = pageIdx;
        let bgPath = "";
        if (isChristmas) {
          bgPath = NOEL_BACKGROUNDS[backgroundIndex % NOEL_BACKGROUNDS.length];
        } else if (isBirthday) {
          bgPath = BIRTHDAY_BACKGROUNDS[backgroundIndex % BIRTHDAY_BACKGROUNDS.length];
        }

        if (bgPath && backgroundCache.has(bgPath)) {
          try {
            pdf.addImage(backgroundCache.get(bgPath)!, "JPEG", 0, 0, pageWidth, pageHeight);
          } catch (error) {
            console.error("Error adding background image", error);
          }
        }
      } else if (theme === "birthday") {
        // Pink background for birthday without image
        pdf.setFillColor(253, 242, 248);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
      }

      const pageCartes = pages[pageIdx];

      // Calculate grid layout
      let cols = 1;
      let rows = 1;
      if (gridsPerPage === 2 || gridsPerPage === 4) {
        cols = 2;
        rows = gridsPerPage === 4 ? 2 : 1;
      }

      const gridWidth = contentWidth / cols;
      const gridHeight = contentHeight / rows;
      const gridGap = 6;

      // Draw each carte on the page
      for (let carteIdx = 0; carteIdx < pageCartes.length; carteIdx++) {
        const carte = pageCartes[carteIdx];
        const col = carteIdx % cols;
        const row = Math.floor(carteIdx / cols);

        const x = margin + col * gridWidth + (col > 0 ? gridGap / 2 : 0);
        const y = margin + row * gridHeight + (row > 0 ? gridGap / 2 : 0);
        const w = gridWidth - (col > 0 || cols > 1 ? gridGap / 2 : 0);
        const h = gridHeight - (row > 0 || rows > 1 ? gridGap / 2 : 0);

        // Draw carte title (only for non-background themes)
        if (!hasBackgroundImage) {
          pdf.setFontSize(gridsPerPage === 1 ? 14 : 8);
          pdf.setTextColor(
            theme === "birthday" ? 126 : 31,
            theme === "birthday" ? 34 : 41,
            theme === "birthday" ? 131 : 55
          );
          pdf.text(carte.name, x + w / 2, y + (gridsPerPage === 1 ? 8 : 4), {
            align: "center",
          });
        }

        // Calculate cells grid position and size
        const gridSize = Math.sqrt(carte.cells.length);
        const centerIndex = getCenterIndex(gridSize);

        let cellsY = y + (hasBackgroundImage ? 0 : gridsPerPage === 1 ? 10 : 5);
        const cellsX = x + 2;
        const cellsW = w - 4;
        const cellsH = hasBackgroundImage ? h * 0.68 : h - (gridsPerPage === 1 ? 12 : 6);

        if (hasBackgroundImage) {
          cellsY = y + h - cellsH - 2;
        }

        const cellSize = Math.min(cellsW / gridSize, cellsH / gridSize);
        const actualGridW = cellSize * gridSize;
        const actualGridH = cellSize * gridSize;
        const gridX = cellsX + (cellsW - actualGridW) / 2;
        const gridY = cellsY + (cellsH - actualGridH) / 2;

        // Draw border around grid (only for non-background themes)
        if (!hasBackgroundImage) {
          pdf.setDrawColor(
            theme === "birthday" ? 219 : 209,
            theme === "birthday" ? 39 : 213,
            theme === "birthday" ? 119 : 219
          );
          pdf.setLineWidth(0.5);
          pdf.rect(gridX, gridY, actualGridW, actualGridH);
        }

        // Draw each cell
        const cellGap = hasBackgroundImage ? 0.5 : 0.1;
        for (let i = 0; i < carte.cells.length; i++) {
          const cellRow = Math.floor(i / gridSize);
          const cellCol = i % gridSize;
          const cellX = gridX + cellCol * cellSize + (cellCol > 0 ? cellGap * cellCol : 0);
          const cellY = gridY + cellRow * cellSize + (cellRow > 0 ? cellGap * cellRow : 0);
          const cellW = cellSize - cellGap;
          const cellH = cellSize - cellGap;

          const imageId = carte.cells[i];
          const isCenter = i === centerIndex;
          const isStar = imageId === "star";

          // Draw content
          if (isCenter || isStar) {
            // Draw cell background first
            if (hasBackgroundImage) {
              pdf.setFillColor(255, 255, 255, 0.95);
              pdf.roundedRect(cellX, cellY, cellW, cellH, 1, 1, "F");
            } else {
              pdf.setFillColor(255, 255, 255);
              pdf.rect(cellX, cellY, cellW, cellH, "F");
              pdf.setDrawColor(156, 163, 175);
              pdf.setLineWidth(0.1);
              pdf.rect(cellX, cellY, cellW, cellH);
            }

            // Draw star emoji
            pdf.setFontSize(gridsPerPage === 1 ? 18 : 10);
            pdf.text(
              "⭐",
              cellX + cellW / 2,
              cellY + cellH / 2 + (gridsPerPage === 1 ? 3 : 2),
              { align: "center" }
            );
          } else {
            const image = images.get(imageId);
            if (image && imageCache.has(image.url)) {
              try {
                const base64 = imageCache.get(image.url)!;

                // Configuration for padding and border
                const borderWidth = hasBackgroundImage ? 0.5 : 0.3;
                const borderRadius = hasBackgroundImage ? 2 : 1;
                const imagePadding = borderWidth;

                // Draw white border/background for the cell
                if (hasBackgroundImage) {
                  // White border with rounded corners
                  pdf.setFillColor(255, 255, 255);
                  pdf.roundedRect(cellX, cellY, cellW, cellH, borderRadius, borderRadius, "F");
                } else {
                  pdf.setFillColor(255, 255, 255);
                  pdf.rect(cellX, cellY, cellW, cellH, "F");
                }

                // Calculate image dimensions (smaller than cell to show white border)
                const imageX = cellX + imagePadding;
                const imageY = cellY + imagePadding;
                const imageW = cellW - imagePadding * 2;
                const imageH = cellH - imagePadding * 2;

                // Add the image with rounded corners
                if (hasBackgroundImage) {
                  // For themes with background, draw image with rounded corners
                  pdf.addImage(base64, "JPEG", imageX, imageY, imageW, imageH);

                  // Draw white rounded border on top
                  pdf.setDrawColor(255, 255, 255);
                  pdf.setLineWidth(borderWidth);
                  pdf.roundedRect(cellX, cellY, cellW, cellH, borderRadius, borderRadius, "S");
                } else {
                  // For standard theme
                  pdf.addImage(base64, "JPEG", imageX, imageY, imageW, imageH);

                  // Draw gray border
                  pdf.setDrawColor(156, 163, 175);
                  pdf.setLineWidth(0.1);
                  pdf.rect(cellX, cellY, cellW, cellH);
                }
              } catch (error) {
                console.error("Error adding cell image", error);
              }
            }
          }
        }
      }
    }

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));
    const fileName = `${jeuName.replace(/[^a-z0-9]/gi, "_")}_cartes.pdf`;

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
