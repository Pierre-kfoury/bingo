"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      label: "Mes jeux",
      icon: Home,
      href: "/",
    },
    {
      label: "+ Créer un jeu",
      icon: Plus,
      href: "/creer",
      isPrimary: true,
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
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Button
                  key={item.href}
                  variant={item.isPrimary ? "default" : active ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "gap-2",
                    item.isPrimary && "gradient-primary"
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
    </nav>
  );
}

