"use client";

import { type SessionTirage } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SectionTirageProps {
  sessions: SessionTirage[];
  isLoading: boolean;
  jeuId: string;
  totalImages: number;
  onSessionsChange: () => void;
}

export function SectionTirage({
  sessions,
  isLoading,
  jeuId,
  totalImages,
  onSessionsChange
}: SectionTirageProps) {
  const router = useRouter();

  const handleCreateSession = async () => {
    try {
      const sessionNumber = sessions.length + 1;
      await supabase.from('draw_session').insert({
        bingo_id: jeuId,
        name: `Session ${sessionNumber}`,
        is_active: true,
        drawn_image_ids: [],
      });
      onSessionsChange();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Erreur lors de la création de la session');
    }
  };

  const handleReset = async (sessionId: string) => {
    if (!confirm('Réinitialiser cette session ?')) return;

    try {
      await supabase
        .from('draw_session')
        .update({ drawn_image_ids: [] })
        .eq('id', sessionId);
      onSessionsChange();
    } catch (error) {
      console.error('Error resetting session:', error);
      alert('Erreur lors de la réinitialisation');
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Supprimer cette session ?')) return;

    try {
      await supabase.from('draw_session').delete().eq('id', sessionId);
      onSessionsChange();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xl font-semibold">🎲 Tirage</h2>
          <div className="mt-4 text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">🎲 Tirage</h2>
          <Button onClick={handleCreateSession}>
            + Nouvelle session
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-4 text-center text-gray-500">
            <p>Créez une session pour commencer à jouer.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {sessions.map((session, idx) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border bg-gray-50 p-4"
              >
                <div>
                  <h3 className="font-medium">{session.name}</h3>
                  <p className="text-sm text-gray-600">
                    {session.drawn_image_ids?.length || 0}/{totalImages} images tirées
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/tirage?session=${session.id}`)}
                  >
                    ▶️ Continuer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset(session.id)}
                  >
                    🔄
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(session.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
