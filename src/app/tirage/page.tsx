"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { TirageAnimation } from "@/components/TirageAnimation";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useBingo } from "@/lib/supabase/context";
import { imagesService } from "@/lib/supabase/images";
import { sessionsService } from "@/lib/supabase/sessions";
import type { BingoImage, DrawSession } from "@/lib/supabase/types";

export default function TiragePage() {
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-20">
          {bingoLoading ? (
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎯</span>
              <p className="text-xl text-gray-400">Aucun bingo sélectionné</p>
              <p className="text-gray-500 mt-2">
                Créez ou sélectionnez un bingo depuis la page d&apos;accueil
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              🎯 Tirage
            </h1>
            <Link
              href={`/create?id=${currentBingo.id}`}
              className="text-sm px-3 py-1 bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition-colors"
            >
              ← {currentBingo.name}
            </Link>
          </div>
          <p className="text-gray-400">
            {currentSession
              ? `Session: ${currentSession.name}`
              : "Sélectionnez ou créez une session"}
          </p>
        </div>

        <div className="flex gap-2">
          {sessions.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isDeletingAll ? "..." : "🗑️ Supprimer tout"}
            </button>
          )}
          {currentSession && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors"
            >
              🔄 Reset
            </button>
          )}
          <button
            onClick={() => setShowNewSession(true)}
            className="px-4 py-2 bg-[#2d2a4a] rounded-xl hover:bg-[#3d3a5a] transition-colors"
          >
            ➕ Nouvelle session
          </button>
        </div>
      </div>

      {/* Session selector */}
      {sessions.length > 0 && (
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                ${
                  currentSession?.id === session.id
                    ? "bg-gradient-to-r from-purple-600 to-amber-500"
                    : "bg-[#1a1730] border border-[#2d2a4a]"
                }
              `}
            >
              <button
                onClick={() => selectSession(session.id)}
                className="flex-1"
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
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allImages.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1730] rounded-2xl border border-[#2d2a4a]">
          <span className="text-6xl mb-4 block">📷</span>
          <p className="text-xl text-gray-400">Aucune image disponible</p>
          <p className="text-gray-500 mt-2">
            Uploadez des photos pour commencer le tirage
          </p>
        </div>
      ) : !currentSession ? (
        <div className="text-center py-20 bg-[#1a1730] rounded-2xl border border-[#2d2a4a]">
          <span className="text-6xl mb-4 block">🎲</span>
          <p className="text-xl text-gray-400">Aucune session active</p>
          <button
            onClick={() => setShowNewSession(true)}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-xl font-medium"
          >
            Créer une session
          </button>
        </div>
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
                <p className="text-3xl font-bold text-purple-400">
                  {drawnImages.length}
                </p>
                <p className="text-sm text-gray-400">Tirés</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400">
                  {allImages.length - drawnImages.length}
                </p>
                <p className="text-sm text-gray-400">Restants</p>
              </div>
            </div>
          </div>

          {/* History sidebar */}
          <div className="bg-[#1a1730] rounded-2xl border border-[#2d2a4a] p-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              📜 Historique ({drawnImages.length})
            </h2>
            <div className="grid grid-cols-4 gap-2 max-h-[500px] overflow-y-auto">
              {[...drawnImages].reverse().map((image, index) => (
                <div
                  key={image?.id || index}
                  className="relative aspect-square rounded-lg overflow-hidden border border-[#2d2a4a]"
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
                      <span className="absolute top-0.5 left-0.5 bg-black/70 text-[10px] px-1 rounded">
                        {drawnImages.length - index}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New session modal */}
      {showNewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1730] rounded-2xl border border-[#2d2a4a] p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Nouvelle session
            </h2>

            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Nom de la session (optionnel)"
              className="w-full px-4 py-3 bg-[#0c0a1d] border border-[#2d2a4a] rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewSession(false)}
                className="flex-1 px-4 py-3 bg-[#2d2a4a] rounded-xl font-medium hover:bg-[#3d3a5a] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createSession}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-xl font-medium"
              >
                Créer
              </button>
            </div>
          </div>
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
