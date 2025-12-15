// Database types for Supabase

export type BingoTheme = "standard" | "christmas" | "birthday";

export type Bingo = {
  id: string;
  name: string;
  theme: BingoTheme;
  grid_size: number;
  player_count: number;
  grids_per_page: number;
  created_at: string;
};

export type BingoImage = {
  id: string;
  bingo_id: string;
  name: string;
  url: string;
  created_at: string;
};

export type GridGroup = {
  id: string;
  bingo_id: string;
  name: string;
  size: number;
  created_at: string;
};

export type Grid = {
  id: string;
  grid_group_id: string;
  name: string;
  cells: string[]; // Array of image UUIDs
  created_at: string;
};

export type DrawSession = {
  id: string;
  bingo_id: string;
  name: string;
  is_active: boolean;
  drawn_image_ids: string[]; // Array of drawn image UUIDs
  created_at: string;
};

// Grid with its group info (for display)
export type GridWithGroup = Grid & {
  grid_group: GridGroup;
};

// Bingo with counts (for listing)
export type BingoWithCounts = Bingo & {
  image_count: number;
  grid_count: number;
  session_count: number;
};

// Create bingo input (for stepper)
export type CreateBingoInput = {
  name: string;
  theme: BingoTheme;
  grid_size: number;
  player_count: number;
  grids_per_page: number;
};
