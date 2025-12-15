import type { Metadata } from "next";
import "./globals.css";
import { BingoProvider } from "@/lib/supabase/context";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Bingo Photos",
  description: "Application de bingo avec photos personnalisées",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <BingoProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </BingoProvider>
      </body>
    </html>
  );
}
