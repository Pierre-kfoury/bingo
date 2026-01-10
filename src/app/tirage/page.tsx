"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TirageAnimation, TirageButton } from "@/components/TirageAnimation";
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
import type { JeuImage, SessionTirage } from "@/lib/supabase/types";

export default function TiragePage() {
  const router = useRouter();
  const { currentJeu, isLoading: jeuLoading } = useBingo();
  const [sessions, setSessions] = useState<SessionTirage[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionTirage | null>(null);
  const [allImages, setAllImages] = useState<JeuImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentJeu) {
      setSessions([]);
      setAllImages([]);
      setCurrentSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const [sessionsData, imagesData] = await Promise.all([
        sessionsService.getAll(currentJeu.id),
        imagesService.getAll(currentJeu.id),
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
  }, [currentJeu]);

  useEffect(() => {
    if (!jeuLoading) {
      fetchData();
    }
  }, [fetchData, jeuLoading]);

  const createSession = async () => {
    if (!currentJeu) return;

    try {
      const newSession = await sessionsService.create(
        currentJeu.id,
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

  const handleDraw = async () => {
    if (!currentSession || isAnimating) return;

    const drawnIds = currentSession.drawn_image_ids;
    const availableImages = allImages.filter((img) => !drawnIds.includes(img.id));

    if (availableImages.length === 0) {
      return;
    }

    setIsAnimating(true);

    // Wait for animation to complete (handled by TirageAnimation component)
    const animationDuration = 2000;
    await new Promise((resolve) => setTimeout(resolve, animationDuration));

    // Pick random image
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];

    try {
      // Update session
      const updatedSession = await sessionsService.addDrawnImage(
        currentSession.id,
        randomImage.id
      );

      setCurrentSession(updatedSession);
    } catch (error) {
      console.error("Error drawing image:", error);
    } finally {
      setIsAnimating(false);
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
    if (!currentJeu) return;

    setIsDeletingAll(true);
    try {
      const count = await sessionsService.deleteAll(currentJeu.id);
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
    if (!currentJeu) return;

    try {
      const session = await sessionsService.setActive(id, currentJeu.id);
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

  if (jeuLoading || !currentJeu) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          {jeuLoading ? (
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
    <div className="min-h-screen px-4 py-4 md:py-6">
      {/* Header - Compact pour TV */}
      <div className="flex items-center justify-between mb-4 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Tirage</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {currentSession
              ? currentSession.name
              : "Sélectionnez ou créez une session"}
          </p>
        </div>

        <div className="flex gap-2">
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              size="default"
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {isDeletingAll ? "..." : "Tout supprimer"}
            </Button>
          )}
          {currentSession && (
            <Button
              variant="secondary"
              size="default"
              onClick={handleReset}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          )}
          <Button
            size="default"
            onClick={() => setShowNewSession(true)}
            className="gradient-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle session
          </Button>
        </div>
      </div>

      {/* Session selector - Compact */}
      {sessions.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 max-w-[1600px] mx-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all border text-base md:text-lg
                ${currentSession?.id === session.id
                  ? "gradient-primary border-transparent text-white"
                  : "bg-card border-border hover:border-primary/50"
                }
              `}
            >
              <button
                onClick={() => selectSession(session.id)}
                className="flex-1 font-medium"
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
                <Trash2 className="w-4 h-4" />
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
        <Card className="text-center py-24 max-w-3xl mx-auto">
          <CardContent>
            <span className="text-9xl mb-6 block">📷</span>
            <p className="text-3xl font-bold text-muted-foreground mb-4">Aucune image disponible</p>
            <p className="text-xl text-muted-foreground mt-2 mb-8">
              Uploadez des photos pour commencer le tirage
            </p>
            <Button
              onClick={() => router.push(`/creer?id=${currentJeu.id}`)}
              className="gradient-primary h-16 px-8 text-xl"
            >
              <ImagesIcon className="w-6 h-6 mr-2" />
              Gérer les images
            </Button>
          </CardContent>
        </Card>
      ) : !currentSession ? (
        <Card className="text-center py-24 max-w-3xl mx-auto">
          <CardContent>
            <span className="text-9xl mb-6 block">🎲</span>
            <p className="text-3xl font-bold text-muted-foreground mb-4">Aucune session active</p>
            <Button
              onClick={() => setShowNewSession(true)}
              className="mt-8 gradient-primary h-16 px-8 text-xl"
            >
              <Plus className="w-6 h-6 mr-2" />
              Créer une session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-[1800px] mx-auto">
          {/* Layout 3 colonnes optimisé pour TV */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-start">
            {/* Colonne gauche - Bouton TIRER + Stats */}
            <div className="flex flex-col gap-8">
              {/* Bouton TIRER */}
              <Card>
                <CardContent className="p-6">
                  <TirageButton
                    onDraw={handleDraw}
                    isAnimating={isAnimating}
                    isComplete={!!isComplete}
                  />
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="flex flex-col gap-6">
                <Card className="bg-card/50 backdrop-blur border-primary/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-6xl md:text-7xl font-bold text-primary mb-3">
                      {drawnImages.length}
                    </p>
                    <p className="text-2xl md:text-3xl text-muted-foreground font-medium">Tirés</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-accent/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-6xl md:text-7xl font-bold text-accent mb-3">
                      {allImages.length - drawnImages.length}
                    </p>
                    <p className="text-2xl md:text-3xl text-muted-foreground font-medium">Restants</p>
                  </CardContent>
                </Card>
              </div>

              {/* Navigation shortcuts */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push(`/creer?id=${currentJeu.id}`)}
                  className="text-lg h-14"
                >
                  <ImagesIcon className="w-5 h-5 mr-2" />
                  Gérer les images
                </Button>
              </div>
            </div>

            {/* Colonne centrale - Image principale */}
            <div className="flex justify-center">
              <TirageAnimation
                images={allImages}
                onDraw={handleDraw}
                lastDrawn={lastDrawn}
                isComplete={!!isComplete}
                isAnimating={isAnimating}
              />
            </div>

            {/* Colonne droite - Historique */}
            <Card className="h-fit max-h-[900px] sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Historique</h2>
                  <Badge variant="secondary" className="text-lg px-4 py-2">{drawnImages.length}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[800px] pr-2">
                  {[...drawnImages].reverse().map((image, index) => (
                    <div
                      key={image?.id || index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-border"
                    >
                      {image && (
                        <>
                          <Image
                            src={image.url}
                            alt={image.name}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                          <span className="absolute top-1 left-1 bg-black/80 text-white text-base font-bold px-2 py-1 rounded">
                            #{drawnImages.length - index}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* New session modal - Plus grand pour TV */}
      {showNewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6">Nouvelle session</h2>

              <Input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Nom de la session (optionnel)"
                className="mb-6 h-14 text-xl"
              />

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNewSession(false)}
                  className="flex-1 h-14 text-lg"
                >
                  Annuler
                </Button>
                <Button
                  onClick={createSession}
                  className="flex-1 h-14 text-lg gradient-primary"
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
