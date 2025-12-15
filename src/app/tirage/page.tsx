"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TirageAnimation } from "@/components/TirageAnimation";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBingo } from "@/lib/supabase/context";
import { imagesService } from "@/lib/supabase/images";
import { sessionsService } from "@/lib/supabase/sessions";
import {
  ArrowLeft,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Grid3X3,
  Images as ImagesIcon,
} from "lucide-react";
import type { BingoImage, DrawSession } from "@/lib/supabase/types";

export default function TiragePage() {
  const router = useRouter();
  const { currentBingo, isLoading: bingoLoading } = useBingo();
  const [sessions, setSessions] = useState<DrawSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DrawSession | null>(null);
  const [allImages, setAllImages] = useState<BingoImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentBingo) {
      setSessions([]);
      setAllImages([]);
      setCurrentSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const [sessionsData, imagesData] = await Promise.all([
        sessionsService.getAll(currentBingo.id),
        imagesService.getAll(currentBingo.id),
      ]);

      setSessions(sessionsData);
      setAllImages(imagesData);

      // Auto-select active session
      const activeSession = sessionsData.find((s) => s.is_active);
      if (activeSession) {
        setCurrentSession(activeSession);
      } else if (sessionsData.length > 0) {
        setCurrentSession(sessionsData[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentBingo]);

  useEffect(() => {
    if (!bingoLoading) {
      fetchData();
    }
  }, [fetchData, bingoLoading]);

  const createSession = async () => {
    if (!currentBingo) return;

    try {
      const newSession = await sessionsService.create(
        currentBingo.id,
        newSessionName || `Session ${new Date().toLocaleDateString("fr-FR")}`
      );

      setShowNewSession(false);
      setNewSessionName("");
      setCurrentSession(newSession);
      fetchData();
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleDraw = async (): Promise<BingoImage | null> => {
    if (!currentSession) return null;

    const drawnIds = currentSession.drawn_image_ids;
    const availableImages = allImages.filter((img) => !drawnIds.includes(img.id));

    if (availableImages.length === 0) {
      return null;
    }

    // Pick random image
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];

    try {
      // Update session
      const updatedSession = await sessionsService.addDrawnImage(
        currentSession.id,
        randomImage.id
      );

      setCurrentSession(updatedSession);
      return randomImage;
    } catch (error) {
      console.error("Error drawing image:", error);
      return null;
    }
  };

  const handleReset = async () => {
    if (!currentSession || !confirm("Réinitialiser cette session ?")) return;

    try {
      const updatedSession = await sessionsService.resetDrawnImages(currentSession.id);
      setCurrentSession(updatedSession);
    } catch (error) {
      console.error("Error resetting session:", error);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Supprimer définitivement cette session ?")) return;

    try {
      await sessionsService.delete(id);

      if (currentSession?.id === id) {
        setCurrentSession(null);
      }

      fetchData();
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const handleDeleteAllSessions = async () => {
    if (!currentBingo) return;

    setIsDeletingAll(true);
    try {
      const count = await sessionsService.deleteAll(currentBingo.id);
      setCurrentSession(null);
      fetchData();
      alert(`✅ ${count} sessions supprimées avec succès !`);
    } catch (error) {
      console.error("Error deleting all sessions:", error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const selectSession = async (id: string) => {
    if (!currentBingo) return;

    try {
      const session = await sessionsService.setActive(id, currentBingo.id);
      setCurrentSession(session);
      fetchData();
    } catch (error) {
      console.error("Error selecting session:", error);
    }
  };

  const drawnImages = currentSession
    ? allImages.filter((img) => currentSession.drawn_image_ids.includes(img.id))
    : [];

  const lastDrawn = drawnImages.length > 0
    ? allImages.find(
        (img) =>
          img.id === currentSession?.drawn_image_ids[currentSession.drawn_image_ids.length - 1]
      ) || null
    : null;

  const isComplete = currentSession && drawnImages.length >= allImages.length;

  if (bingoLoading || !currentBingo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          {bingoLoading ? (
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          ) : (
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎯</span>
              <p className="text-xl text-muted-foreground">
                Aucun bingo sélectionné
              </p>
              <p className="text-muted-foreground mt-2">
                Créez ou sélectionnez un bingo depuis la page d&apos;accueil
              </p>
              <Button onClick={() => router.push("/")} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l&apos;accueil
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Tirage</h1>
          <p className="text-muted-foreground">
            {currentSession
              ? `Session: ${currentSession.name}`
              : "Sélectionnez ou créez une session"}
          </p>
        </div>

        <div className="flex gap-2">
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeletingAll ? "..." : "Tout supprimer"}
            </Button>
          )}
          {currentSession && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowNewSession(true)}
            className="gradient-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle session
          </Button>
        </div>
      </div>

      {/* Session selector */}
      {sessions.length > 0 && (
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all border
                ${
                  currentSession?.id === session.id
                    ? "gradient-primary border-transparent text-white"
                    : "bg-card border-border hover:border-primary/50"
                }
              `}
            >
              <button
                onClick={() => selectSession(session.id)}
                className="flex-1 text-sm font-medium"
              >
                {session.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.id);
                }}
                className="text-red-400 hover:text-red-300 transition-colors px-1"
                title="Supprimer cette session"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : allImages.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <span className="text-6xl mb-4 block">📷</span>
            <p className="text-xl text-muted-foreground">Aucune image disponible</p>
            <p className="text-muted-foreground mt-2 mb-6">
              Uploadez des photos pour commencer le tirage
            </p>
            <Button onClick={() => router.push("/images")} className="gradient-primary">
              <ImagesIcon className="w-4 h-4 mr-2" />
              Gérer les images
            </Button>
          </CardContent>
        </Card>
      ) : !currentSession ? (
        <Card className="text-center py-16">
          <CardContent>
            <span className="text-6xl mb-4 block">🎲</span>
            <p className="text-xl text-muted-foreground">Aucune session active</p>
            <Button
              onClick={() => setShowNewSession(true)}
              className="mt-6 gradient-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main tirage area */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <TirageAnimation
              images={allImages}
              onDraw={handleDraw}
              lastDrawn={lastDrawn}
              isComplete={!!isComplete}
            />

            {/* Stats */}
            <div className="mt-8 flex gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {drawnImages.length}
                </p>
                <p className="text-sm text-muted-foreground">Tirés</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">
                  {allImages.length - drawnImages.length}
                </p>
                <p className="text-sm text-muted-foreground">Restants</p>
              </div>
            </div>
          </div>

          {/* History sidebar */}
          <Card className="h-fit">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Historique</h2>
                <Badge variant="secondary">{drawnImages.length}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-[500px] overflow-y-auto">
                {[...drawnImages].reverse().map((image, index) => (
                  <div
                    key={image?.id || index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border"
                  >
                    {image && (
                      <>
                        <Image
                          src={image.url}
                          alt={image.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                        <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                          {drawnImages.length - index}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation shortcuts */}
      <div className="mt-8 flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/grilles">
            <Grid3X3 className="w-4 h-4 mr-2" />
            Voir les grilles
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/images">
            <ImagesIcon className="w-4 h-4 mr-2" />
            Gérer les images
          </Link>
        </Button>
      </div>

      {/* New session modal */}
      {showNewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Nouvelle session</h2>

              <Input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Nom de la session (optionnel)"
                className="mb-4"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewSession(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={createSession}
                  className="flex-1 gradient-primary"
                >
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm delete all sessions modal */}
      <ConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAllSessions}
        title="⚠️ Supprimer toutes les sessions"
        message={`Vous êtes sur le point de supprimer TOUTES les ${sessions.length} sessions de tirage.\n\nCette action est IRRÉVERSIBLE.`}
        confirmText="Supprimer tout"
        requireTyping={true}
        typingText="SUPPRIMER TOUT"
        isDangerous={true}
      />
    </div>
  );
}
