"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Bingo } from "./types";
import { bingoService } from "./bingo";

type BingoContextType = {
  currentBingo: Bingo | null;
  setCurrentBingo: (bingo: Bingo | null) => void;
  bingos: Bingo[];
  isLoading: boolean;
  refreshBingos: () => Promise<Bingo[]>;
};

const BingoContext = createContext<BingoContextType | null>(null);

const STORAGE_KEY = "bingo_current_id";

export function BingoProvider({ children }: { children: ReactNode }) {
  const [currentBingo, setCurrentBingoState] = useState<Bingo | null>(null);
  const [bingos, setBingos] = useState<Bingo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBingos = useCallback(async () => {
    try {
      const data = await bingoService.getAll();
      setBingos(data);
      return data;
    } catch (error) {
      console.error("Error fetching bingos:", error);
      return [];
    }
  }, []);

  const setCurrentBingo = useCallback((bingo: Bingo | null) => {
    setCurrentBingoState(bingo);
    if (bingo) {
      localStorage.setItem(STORAGE_KEY, bingo.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const data = await refreshBingos();
      
      // Restore last selected bingo from localStorage
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && data.length > 0) {
        const found = data.find((b) => b.id === savedId);
        if (found) {
          setCurrentBingoState(found);
        } else if (data.length > 0) {
          // Fallback to first bingo if saved one not found
          setCurrentBingoState(data[0]);
        }
      } else if (data.length > 0) {
        setCurrentBingoState(data[0]);
      }
      
      setIsLoading(false);
    };

    init();
  }, [refreshBingos]);

  return (
    <BingoContext.Provider
      value={{
        currentBingo,
        setCurrentBingo,
        bingos,
        isLoading,
        refreshBingos,
      }}
    >
      {children}
    </BingoContext.Provider>
  );
}

export function useBingo() {
  const context = useContext(BingoContext);
  if (!context) {
    throw new Error("useBingo must be used within a BingoProvider");
  }
  return context;
}
