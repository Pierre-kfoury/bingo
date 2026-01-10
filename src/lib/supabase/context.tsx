"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Jeu } from "./types";
import { jeuService } from "./jeu";

type JeuContextType = {
  currentJeu: Jeu | null;
  setCurrentJeu: (jeu: Jeu | null) => void;
  jeux: Jeu[];
  isLoading: boolean;
  refreshJeux: () => Promise<Jeu[]>;
};

const JeuContext = createContext<JeuContextType | null>(null);

const STORAGE_KEY = "jeu_current_id";

export function JeuProvider({ children }: { children: ReactNode }) {
  const [currentJeu, setCurrentJeuState] = useState<Jeu | null>(null);
  const [jeux, setJeux] = useState<Jeu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshJeux = useCallback(async () => {
    try {
      const data = await jeuService.getAll();
      setJeux(data);
      return data;
    } catch (error) {
      console.error("Error fetching jeux:", error);
      return [];
    }
  }, []);

  const setCurrentJeu = useCallback((jeu: Jeu | null) => {
    setCurrentJeuState(jeu);
    if (jeu) {
      localStorage.setItem(STORAGE_KEY, jeu.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const data = await refreshJeux();

      // Restore last selected jeu from localStorage
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && data.length > 0) {
        const found = data.find((j) => j.id === savedId);
        if (found) {
          setCurrentJeuState(found);
        } else if (data.length > 0) {
          // Fallback to first jeu if saved one not found
          setCurrentJeuState(data[0]);
        }
      } else if (data.length > 0) {
        setCurrentJeuState(data[0]);
      }

      setIsLoading(false);
    };

    init();
  }, [refreshJeux]);

  return (
    <JeuContext.Provider
      value={{
        currentJeu,
        setCurrentJeu,
        jeux,
        isLoading,
        refreshJeux,
      }}
    >
      {children}
    </JeuContext.Provider>
  );
}

export function useJeu() {
  const context = useContext(JeuContext);
  if (!context) {
    throw new Error("useJeu must be used within a JeuProvider");
  }
  return context;
}

// Legacy exports for gradual migration
export const BingoProvider = JeuProvider;
export const useBingo = useJeu;
