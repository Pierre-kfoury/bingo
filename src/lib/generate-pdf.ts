import jsPDF from "jspdf";
import type { Carte, JeuImage, JeuTheme } from "@/lib/supabase/types";

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

type GeneratePDFOptions = {
  cartes: Carte[];
  images: Map<string, JeuImage>;
  theme: JeuTheme;
  gridsPerPage: number;
  jeuName: string;
};

function getCenterIndex(size: number): number | null {
  if (size % 2 === 0) return null;
  return Math.floor((size * size) / 2);
}

// Load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return "";
  }
}

export async function generatePDF({
  cartes,
  images,
  theme,
  gridsPerPage,
  jeuName,
}: GeneratePDFOptions): Promise<void> {
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
  const imageUrls = Array.from(new Set(
    cartes.flatMap((carte) =>
      carte.cells.filter((id) => id !== "star" && images.has(id)).map((id) => images.get(id)!.url)
    )
  ));

  // Load background images
  const backgroundCache = new Map<string, string>();
  const bgPaths = isChristmas ? NOEL_BACKGROUNDS : isBirthday ? BIRTHDAY_BACKGROUNDS : [];
  for (const bgPath of bgPaths) {
    try {
      const base64 = await loadImageAsBase64(bgPath);
      backgroundCache.set(bgPath, base64);
    } catch (error) {
      console.error(`Error loading background: ${bgPath}`, error);
    }
  }

  // Show loading progress
  console.log(`Loading ${imageUrls.length} images...`);
  for (const url of imageUrls) {
    try {
      const base64 = await loadImageAsBase64(url);
      imageCache.set(url, base64);
    } catch (error) {
      console.error(`Error loading image: ${url}`, error);
    }
  }

  // Generate each page
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage();
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

      // Draw background image if theme has one
      const backgroundIndex = gridsPerPage === 1 ? pageIdx : carteIdx;
      let bgPath = "";
      if (isChristmas) {
        bgPath = NOEL_BACKGROUNDS[backgroundIndex % NOEL_BACKGROUNDS.length];
      } else if (isBirthday) {
        bgPath = BIRTHDAY_BACKGROUNDS[backgroundIndex % BIRTHDAY_BACKGROUNDS.length];
      }

      if (bgPath && backgroundCache.has(bgPath)) {
        try {
          pdf.addImage(backgroundCache.get(bgPath)!, "PNG", x, y, w, h);
        } catch (error) {
          console.error("Error adding background image", error);
        }
      } else if (theme === "birthday") {
        // Pink background for birthday without image
        pdf.setFillColor(253, 242, 248);
        pdf.rect(x, y, w, h, "F");
      }

      // Draw carte title (only for non-background themes)
      if (!hasBackgroundImage) {
        pdf.setFontSize(gridsPerPage === 1 ? 14 : 8);
        pdf.setTextColor(31, 41, 55);
        pdf.text(carte.name, x + w / 2, y + (gridsPerPage === 1 ? 8 : 4), { align: "center" });
      }
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
        pdf.setDrawColor(209, 213, 219);
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

        // Draw cell background
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

        // Draw content
        if (isCenter || isStar) {
          // Draw star emoji
          pdf.setFontSize(gridsPerPage === 1 ? 18 : 10);
          pdf.text("⭐", cellX + cellW / 2, cellY + cellH / 2 + (gridsPerPage === 1 ? 3 : 2), { align: "center" });
        } else {
          const image = images.get(imageId);
          if (image && imageCache.has(image.url)) {
            try {
              const base64 = imageCache.get(image.url)!;
              if (hasBackgroundImage) {
                // Add with rounded corners effect
                pdf.addImage(base64, "JPEG", cellX + 0.5, cellY + 0.5, cellW - 1, cellH - 1);
              } else {
                pdf.addImage(base64, "JPEG", cellX, cellY, cellW, cellH);
              }
            } catch (error) {
              console.error("Error adding cell image", error);
            }
          }
        }
      }
    }
  }

  // Save the PDF
  const fileName = `${jeuName.replace(/[^a-z0-9]/gi, "_")}_cartes.pdf`;
  pdf.save(fileName);
}
