"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { type Jeu, type Carte, type JeuImage, type SessionTirage } from "@/lib/supabase/types";
import { JeuHeader } from "@/components/jeu/JeuHeader";
import { SectionCartes } from "@/components/jeu/SectionCartes";
import { SectionImages } from "@/components/jeu/SectionImages";
import { SectionTirage } from "@/components/jeu/SectionTirage";

export default function JeuHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jeuId } = use(params);
  const router = useRouter();

  // State for all data
  const [jeu, setJeu] = useState<Jeu | null>(null);
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [images, setImages] = useState<JeuImage[]>([]);
  const [sessions, setSessions] = useState<SessionTirage[]>([]);

  // Loading states
  const [jeuLoading, setJeuLoading] = useState(true);
  const [cartesLoading, setCartesLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Load jeu
  const loadJeu = async () => {
    setJeuLoading(true);
    try {
      const { data, error } = await supabase
        .from('bingo')
        .select('*')
        .eq('id', jeuId)
        .single();
      if (error) throw error;
      setJeu(data);
    } catch (error) {
      console.error('Error loading jeu:', error);
      setJeu(null);
    } finally {
      setJeuLoading(false);
    }
  };

  // Load cartes
  const loadCartes = async () => {
    setCartesLoading(true);
    try {
      const { data: groups } = await supabase
        .from('grid_group')
        .select('id')
        .eq('bingo_id', jeuId);

      if (!groups || groups.length === 0) {
        setCartes([]);
        setCartesLoading(false);
        return;
      }

      const groupIds = groups.map(g => g.id);
      const { data, error } = await supabase
        .from('grid')
        .select('*')
        .in('grid_group_id', groupIds)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCartes(data || []);
    } catch (error) {
      console.error('Error loading cartes:', error);
      setCartes([]);
    } finally {
      setCartesLoading(false);
    }
  };

  // Load images
  const loadImages = async () => {
    setImagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('bingo_image')
        .select('*')
        .eq('bingo_id', jeuId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  // Load sessions
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('draw_session')
        .select('*')
        .eq('bingo_id', jeuId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Load all data on mount
  useEffect(() => {
    loadJeu();
    loadCartes();
    loadImages();
    loadSessions();
  }, [jeuId]);

  // Handlers
  const handleEdit = () => {
    router.push(`/creer?id=${jeuId}`);
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce jeu ?')) return;

    try {
      await supabase.from('bingo').delete().eq('id', jeuId);
      router.push('/');
    } catch (error) {
      console.error('Error deleting jeu:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleImagesChange = () => {
    loadImages();
    loadCartes(); // Cartes may need regeneration
  };

  const handleSessionsChange = () => {
    loadSessions();
  };

  // Loading state
  if (jeuLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white p-6">
          <div className="mx-auto max-w-7xl">
            <div className="h-20 animate-pulse bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!jeu) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Jeu introuvable</h1>
          <p className="mt-2 text-gray-600">Ce jeu n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const minImagesRequired = jeu.grid_size * jeu.grid_size;

  return (
    <div className="min-h-screen bg-gray-50">
      <JeuHeader jeu={jeu} onEdit={handleEdit} onDelete={handleDelete} />
      <SectionCartes cartes={cartes} images={images} isLoading={cartesLoading} jeuId={jeuId} />
      <SectionImages
        images={images}
        isLoading={imagesLoading}
        jeuId={jeuId}
        minRequired={minImagesRequired}
        onImagesChange={handleImagesChange}
      />
      <SectionTirage
        sessions={sessions}
        isLoading={sessionsLoading}
        jeuId={jeuId}
        totalImages={images.length}
        onSessionsChange={handleSessionsChange}
      />
    </div>
  );
}
