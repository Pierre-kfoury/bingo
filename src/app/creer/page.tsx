"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StepParameters } from "@/components/create/StepParameters";
import { StepUpload } from "@/components/create/StepUpload";
import { StepRecap } from "@/components/create/StepRecap";
import { LivePreview } from "@/components/create/LivePreview";
import { ConfirmModal } from "@/components/ConfirmModal";
import { bingoService } from "@/lib/supabase/bingo";
import { imagesService } from "@/lib/supabase/images";
import { gridGroupService, gridService } from "@/lib/supabase/grids";
import { useBingo } from "@/lib/supabase/context";
import { cn } from "@/lib/utils";
import { Check, Trash2 } from "lucide-react";
import type { BingoImage, CreateBingoInput, Bingo } from "@/lib/supabase/types";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateGridCells(images: BingoImage[], gridSize: number): string[] {
  const totalCells = gridSize * gridSize;
  const hasCenter = gridSize % 2 !== 0;
  const centerIndex = hasCenter ? Math.floor(totalCells / 2) : -1;
  const requiredImages = hasCenter ? totalCells - 1 : totalCells;

  const shuffledImages = shuffleArray(images);
  const selectedImages = shuffledImages.slice(0, requiredImages);

  const cells: string[] = [];
  let imageIndex = 0;

  for (let i = 0; i < totalCells; i++) {
    if (i === centerIndex) {
      cells.push("star");
    } else {
      cells.push(selectedImages[imageIndex % selectedImages.length].id);
      imageIndex++;
    }
  }

  return cells;
}

const STEPS = [
  { number: 1, label: "Paramètres" },
  { number: 2, label: "Photos" },
  { number: 3, label: "Validation" },
];

export default function CreateBingoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <CreateBingoContent />
    </Suspense>
  );
}

function CreateBingoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { setCurrentBingo, refreshBingos } = useBingo();

  const [currentStep, setCurrentStep] = useState(1);
  const [tempBingoId, setTempBingoId] = useState<string | null>(null);
  const [images, setImages] = useState<BingoImage[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<CreateBingoInput>({
    name: "",
    theme: "standard",
    grid_size: 5,
    player_count: 10,
    grids_per_page: 1,
  });

  // Load existing bingo if editing
  useEffect(() => {
    const loadExistingBingo = async () => {
      if (editId) {
        try {
          const bingo = await bingoService.getById(editId);
          if (bingo) {
            setFormData({
              name: bingo.name,
              theme: bingo.theme,
              grid_size: bingo.grid_size,
              player_count: bingo.player_count,
              grids_per_page: bingo.grids_per_page,
            });
            setTempBingoId(bingo.id);
            setIsEditMode(true);
            
            // Load images
            const loadedImages = await imagesService.getAll(bingo.id);
            setImages(loadedImages);
          }
        } catch (error) {
          console.error("Error loading bingo:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadExistingBingo();
  }, [editId]);

  // Create temp bingo when entering step 2 (only for new bingos)
  useEffect(() => {
    const createTempBingo = async () => {
      if (currentStep === 2 && !tempBingoId && !isEditMode) {
        try {
          const defaultName = formData.name || `Bingo ${new Date().toLocaleDateString('fr-FR')}`;
          const tempBingo = await bingoService.create({
            ...formData,
            name: defaultName,
          });
          setTempBingoId(tempBingo.id);
        } catch (error) {
          console.error("Error creating temp bingo:", error);
        }
      }
    };
    createTempBingo();
  }, [currentStep, tempBingoId, formData, isEditMode]);

  // Load images when we have a temp bingo (only for new bingos)
  useEffect(() => {
    const loadImages = async () => {
      if (tempBingoId && !isEditMode) {
        const loadedImages = await imagesService.getAll(tempBingoId);
        setImages(loadedImages);
      }
    };
    loadImages();
  }, [tempBingoId, isEditMode]);

  const handleFormChange = (data: Partial<CreateBingoInput>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleImagesChange = (newImages: BingoImage[]) => {
    setImages(newImages);
  };

  const handleConfirm = async () => {
    if (!tempBingoId) return;

    try {
      // Use default name if empty
      const finalName = formData.name || `Bingo ${new Date().toLocaleDateString('fr-FR')}`;
      
      // Update bingo with form data
      const updatedBingo = await bingoService.update(tempBingoId, {
        ...formData,
        name: finalName,
      });

      // Delete existing grids if in edit mode
      if (isEditMode) {
        await gridGroupService.deleteAll(tempBingoId);
      }

      // Create new grid group
      const gridGroup = await gridGroupService.create(
        tempBingoId,
        `Grilles - ${formData.name}`,
        formData.grid_size
      );

      // Generate grids: player_count pages × grids_per_page grids per page
      const totalGrids = formData.player_count * formData.grids_per_page;
      const gridsToCreate = [];
      for (let i = 0; i < totalGrids; i++) {
        gridsToCreate.push({
          name: `Grille ${i + 1}`,
          cells: generateGridCells(images, formData.grid_size),
        });
      }

      await gridService.createMany(gridGroup.id, gridsToCreate);

      setCurrentBingo(updatedBingo as Bingo);
      setIsEditMode(true);

      // Redirect to the Hub page for the newly created bingo
      router.push(`/jeu/${tempBingoId}`);
    } catch (error) {
      console.error("Error generating grids:", error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!tempBingoId) return;

    setIsDeleting(true);
    try {
      await bingoService.delete(tempBingoId);
      await refreshBingos();
      setCurrentBingo(null);
      router.push("/");
    } catch (error) {
      console.error("Error deleting bingo:", error);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du bingo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">
            {isEditMode ? `Modifier : ${formData.name || 'Sans nom'}` : "Créer un nouveau bingo"}
          </h1>
          {isEditMode && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center gap-2"
              aria-label="Supprimer ce bingo"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Supprimer</span>
            </button>
          )}
        </div>

        {/* Main layout - Left 60% (Stepper + Form), Right 40% (Preview) */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Stepper + Form (60%) */}
          <div className="w-full md:w-[60%] space-y-4 shrink-0">
            {/* Stepper navigation (vertical) */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="space-y-2">
                {STEPS.map((step) => (
                  <button
                    key={step.number}
                    onClick={() => {
                      if (step.number <= currentStep) {
                        setCurrentStep(step.number);
                      }
                    }}
                    disabled={step.number > currentStep}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all text-left",
                      step.number === currentStep &&
                        "bg-primary text-primary-foreground",
                      step.number < currentStep &&
                        "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30",
                      step.number > currentStep &&
                        "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        step.number === currentStep && "bg-white/20",
                        step.number < currentStep && "bg-primary text-white",
                        step.number > currentStep && "bg-muted"
                      )}
                    >
                      {step.number < currentStep ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </span>
                    <span className="text-sm">{step.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form content */}
            <div className="bg-card rounded-2xl border border-border p-5">
              {currentStep === 1 && (
                <StepParameters
                  data={formData}
                  onChange={handleFormChange}
                  onNext={() => setCurrentStep(2)}
                />
              )}

              {currentStep === 2 && tempBingoId && (
                <StepUpload
                  bingoId={tempBingoId}
                  data={formData}
                  images={images}
                  onImagesChange={handleImagesChange}
                  onPrevious={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                />
              )}

              {currentStep === 3 && (
                <StepRecap
                  data={formData}
                  images={images}
                  onChange={handleFormChange}
                  onPrevious={() => setCurrentStep(2)}
                  onConfirm={handleConfirm}
                  isEditMode={isEditMode}
                />
              )}
            </div>
          </div>

          {/* Right side - Live Preview (70%) */}
          <div className="hidden md:block flex-1">
            <div className="sticky top-24">
              <div className="bg-card rounded-2xl border border-border p-6 min-h-[calc(100vh-12rem)]">
                <LivePreview
                  data={formData}
                  images={images}
                  currentStep={currentStep}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile preview toggle */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <MobilePreviewButton
            data={formData}
            images={images}
            currentStep={currentStep}
          />
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer ce bingo ?"
        message={`Êtes-vous sûr de vouloir supprimer "${formData.name || 'ce bingo'}" ?\n\nToutes les images, grilles et sessions de tirage associées seront également supprimées.\n\nCette action est irréversible.`}
        confirmText="Supprimer"
        isDangerous
        isLoading={isDeleting}
      />
    </div>
  );
}

// Mobile preview modal
function MobilePreviewButton({
  data,
  images,
  currentStep,
}: {
  data: CreateBingoInput;
  images: BingoImage[];
  currentStep: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center text-white"
      >
        👁️
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-card rounded-t-2xl w-full max-w-lg p-4 pb-8 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-muted rounded-full" />
            </div>
            <LivePreview data={data} images={images} currentStep={currentStep} />
          </div>
        </div>
      )}
    </>
  );
}
