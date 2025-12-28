// Database types for Supabase

export type JeuTheme = "standard" | "christmas" | "birthday";

export type Jeu = {
  id: string;
  name: string;
  theme: JeuTheme;
  grid_size: number;
  player_count: number;
  grids_per_page: number;
  created_at: string;
};

export type JeuImage = {
  id: string;
  bingo_id: string;
  name: string;
  url: string;
  created_at: string;
};

export type GroupeCartes = {
  id: string;
  bingo_id: string;
  name: string;
  size: number;
  created_at: string;
};

export type Carte = {
  id: string;
  grid_group_id: string;
  name: string;
  cells: string[]; // Array of image UUIDs
  created_at: string;
};

export type SessionTirage = {
  id: string;
  bingo_id: string;
  name: string;
  is_active: boolean;
  drawn_image_ids: string[]; // Array of drawn image UUIDs
  created_at: string;
};

// Carte with its group info (for display)
export type CarteWithGroup = Carte & {
  grid_group: GroupeCartes;
};

// Jeu with counts (for listing)
export type JeuWithCounts = Jeu & {
  image_count: number;
  grid_count: number;
  session_count: number;
};

// Create jeu input (for stepper)
export type CreateJeuInput = {
  name: string;
  theme: JeuTheme;
  grid_size: number;
  player_count: number;
  grids_per_page: number;
};

// Legacy type aliases for gradual migration
export type BingoTheme = JeuTheme;
export type Bingo = Jeu;
export type BingoImage = JeuImage;
export type GridGroup = GroupeCartes;
export type Grid = Carte;
export type DrawSession = SessionTirage;
export type GridWithGroup = CarteWithGroup;
export type BingoWithCounts = JeuWithCounts;
export type CreateBingoInput = CreateJeuInput;
