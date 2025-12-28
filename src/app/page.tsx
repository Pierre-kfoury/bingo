"use client";

import { useRouter } from "next/navigation";
import { useBingo } from "@/lib/supabase/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Loader2,
  Snowflake,
  PartyPopper,
  Grid3X3,
  Plus,
} from "lucide-react";
import type { BingoTheme } from "@/lib/supabase/types";

const THEME_ICONS: Record<BingoTheme, React.ElementType> = {
  standard: Grid3X3,
  christmas: Snowflake,
  birthday: PartyPopper,
};

const THEME_COLORS: Record<BingoTheme, string> = {
  standard: "from-slate-500 to-slate-600",
  christmas: "from-red-500 to-green-600",
  birthday: "from-pink-500 to-purple-600",
};

export default function HomePage() {
  const router = useRouter();
  const { setCurrentJeu, jeux, isLoading } = useBingo();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl mx-auto">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-3 tracking-tight">
            <span className="text-foreground">Bingo</span>{" "}
            <span className="gradient-text">Photos</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Créez des jeux de bingo personnalisés avec vos photos
          </p>
        </div>

        {/* Main CTA */}
        <div className="flex justify-center mb-12">
          <Button
            size="lg"
            onClick={() => router.push("/creer")}
            className="h-14 px-8 text-lg font-bold rounded-2xl gradient-primary hover:opacity-90 transition-all transform hover:scale-105 shadow-xl shadow-primary/25"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un nouveau jeu
          </Button>
        </div>

        {/* Recent Jeux */}
        {jeux.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center text-muted-foreground">
              Ou continuez avec un jeu existant
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bingos.map((bingo) => {
                const ThemeIcon = THEME_ICONS[bingo.theme] || Grid3X3;
                const themeColors = THEME_COLORS[bingo.theme] || THEME_COLORS.standard;

                return (
                  <Card
                    key={jeu.id}
                    className="group cursor-pointer hover:border-primary/50 transition-all duration-300"
                    onClick={() => {
                      setCurrentJeu(jeu);
                      router.push(`/jeu/${jeu.id}`);
                    }}
                  >
                    <CardContent className="p-5 relative">
                      {/* Theme icon */}
                      <div
                        className={`absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${themeColors}`}
                      >
                        <ThemeIcon className="w-4 h-4 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="font-semibold mb-1 pr-10 truncate group-hover:text-primary transition-colors">
                        {jeu.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(jeu.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>

                      {/* Stats */}
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Cartes {jeu.grid_size}×{jeu.grid_size}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {jeu.player_count} joueurs
                        </Badge>
                      </div>

                      {/* Arrow on hover */}
                      <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
