import { supabase } from "./client";
import type { Bingo, BingoWithCounts, CreateBingoInput } from "./types";

export const bingoService = {
  async getAll(): Promise<Bingo[]> {
    const { data, error } = await supabase
      .from("bingo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Bingo[]) || [];
  },

  async getAllWithCounts(): Promise<BingoWithCounts[]> {
    const { data: bingos, error } = await supabase
      .from("bingo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!bingos) return [];

    const result: BingoWithCounts[] = [];

    for (const bingo of bingos as Bingo[]) {
      const [imageCount, , sessionCount] = await Promise.all([
        supabase
          .from("bingo_image")
          .select("id", { count: "exact", head: true })
          .eq("bingo_id", bingo.id),
        supabase
          .from("grid_group")
          .select("id", { count: "exact", head: true })
          .eq("bingo_id", bingo.id),
        supabase
          .from("draw_session")
          .select("id", { count: "exact", head: true })
          .eq("bingo_id", bingo.id),
      ]);

      // Get total grid count from all grid groups
      const { data: gridGroups } = await supabase
        .from("grid_group")
        .select("id")
        .eq("bingo_id", bingo.id);

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
        ...bingo,
        image_count: imageCount.count || 0,
        grid_count: gridCount,
        session_count: sessionCount.count || 0,
      });
    }

    return result;
  },

  async getById(id: string): Promise<Bingo | null> {
    const { data, error } = await supabase
      .from("bingo")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Bingo;
  },

  async create(input: CreateBingoInput): Promise<Bingo> {
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
    return data as Bingo;
  },

  async update(
    id: string,
    input: Partial<CreateBingoInput>
  ): Promise<Bingo> {
    const { data, error } = await supabase
      .from("bingo")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Bingo;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("bingo").delete().eq("id", id);

    if (error) throw error;
  },
};
