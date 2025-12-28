"use client";

import { usePathname, useRouter } from "next/navigation";
import { useBingo } from "@/lib/supabase/context";
import { Button } from "@/components/ui/button";
import { Home, Plus, Grid3X3, Images, Play, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentJeu } = useBingo();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      label: "Accueil",
      icon: Home,
      href: "/",
      show: true,
    },
    {
      label: "Créer",
      icon: Plus,
      href: "/creer",
      show: true,
    },
    {
      label: "Grilles",
      icon: Grid3X3,
      href: "/grilles",
      show: !!currentJeu,
    },
    {
      label: "Images",
      icon: Images,
      href: "/images",
      show: !!currentJeu,
    },
    {
      label: "Tirage",
      icon: Play,
      href: "/tirage",
      show: !!currentJeu,
    },
    {
      label: "Imprimer",
      icon: Printer,
      href: "/grilles/print",
      show: !!currentJeu,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white text-xl">B</span>
            </div>
            <span className="hidden sm:inline">
              <span className="text-foreground">Bingo</span>{" "}
              <span className="gradient-text">Photos</span>
            </span>
          </button>

          {/* Navigation items */}
          <div className="flex items-center gap-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Button
                    key={item.href}
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "gap-2",
                      active && "gradient-primary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Current Bingo indicator */}
      {currentJeu && pathname !== "/" && (
        <div className="border-t border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <p className="text-xs text-muted-foreground">
              Bingo actuel :{" "}
              <span className="font-semibold text-foreground">
                {currentJeu.name}
              </span>{" "}
              <span className="text-muted-foreground">
                ({currentJeu.grid_size}×{currentJeu.grid_size} •{" "}
                {currentJeu.player_count} pages)
              </span>
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}

