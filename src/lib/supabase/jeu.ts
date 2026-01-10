import { supabase } from "./client";
import type { Jeu, JeuWithCounts, CreateJeuInput } from "./types";

export const jeuService = {
  async getAll(): Promise<Jeu[]> {
    const { data, error } = await supabase
      .from("bingo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Jeu[]) || [];
  },

  async getAllWithCounts(): Promise<JeuWithCounts[]> {
    const { data: jeux, error } = await supabase
      .from("bingo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!jeux) return [];

    const result: JeuWithCounts[] = [];

    for (const jeu of jeux as Jeu[]) {
      const [imageCount, , sessionCount] = await Promise.all([
        supabase
          .from("bingo_image")
          .select("id", { count: "exact", head: true })
          .eq("bingo_id", jeu.id),
        supabase
          .from("grid_group")
          .select("id", { count: "exact", head: true })
          .eq("bingo_id", jeu.id),
        supabase
          .from("draw_session")
          .select("id", { count: "exact", head: true })
          .eq("bingo_id", jeu.id),
      ]);

      // Get total grid count from all grid groups
      const { data: gridGroups } = await supabase
        .from("grid_group")
        .select("id")
        .eq("bingo_id", jeu.id);

      let gridCount = 0;
      if (gridGroups && gridGroups.length > 0) {
        const { count } = await supabase
          .from("grid")
          .select("id", { count: "exact", head: true })
          .in(
            "grid_group_id",
            gridGroups.map((g: { id: string }) => g.id)
          );
        gridCount = count || 0;
      }

      result.push({
        ...jeu,
        image_count: imageCount.count || 0,
        grid_count: gridCount,
        session_count: sessionCount.count || 0,
      });
    }

    return result;
  },

  async getById(id: string): Promise<Jeu | null> {
    const { data, error } = await supabase
      .from("bingo")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Jeu;
  },

  async create(input: CreateJeuInput): Promise<Jeu> {
    const { data, error } = await supabase
      .from("bingo")
      .insert({
        name: input.name,
        theme: input.theme,
        grid_size: input.grid_size,
        player_count: input.player_count,
        grids_per_page: input.grids_per_page,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Jeu;
  },

  async update(
    id: string,
    input: Partial<CreateJeuInput>
  ): Promise<Jeu> {
    const { data, error } = await supabase
      .from("bingo")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Jeu;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("bingo").delete().eq("id", id);

    if (error) throw error;
  },
};

// Legacy export for gradual migration
export const bingoService = jeuService;
