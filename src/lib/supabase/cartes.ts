import { supabase } from "./client";
import type { Carte, GroupeCartes, CarteWithGroup } from "./types";

export const groupeCartesService = {
  async getAll(jeuId: string): Promise<GroupeCartes[]> {
    const { data, error } = await supabase
      .from("grid_group")
      .select("*")
      .eq("bingo_id", jeuId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as GroupeCartes[]) || [];
  },

  async getById(id: string): Promise<GroupeCartes | null> {
    const { data, error } = await supabase
      .from("grid_group")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as GroupeCartes;
  },

  async create(jeuId: string, name: string, size: number): Promise<GroupeCartes> {
    const { data, error } = await supabase
      .from("grid_group")
      .insert({ bingo_id: jeuId, name, size })
      .select()
      .single();

    if (error) throw error;
    return data as GroupeCartes;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("grid_group").delete().eq("id", id);

    if (error) throw error;
  },

  async deleteAll(jeuId: string): Promise<number> {
    const groups = await this.getAll(jeuId);
    const count = groups.length;

    const { error } = await supabase
      .from("grid_group")
      .delete()
      .eq("bingo_id", jeuId);

    if (error) throw error;
    return count;
  },
};

export const carteService = {
  async getAll(groupeCartesId: string): Promise<Carte[]> {
    const { data, error } = await supabase
      .from("grid")
      .select("*")
      .eq("grid_group_id", groupeCartesId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (
      (data as Array<{ id: string; grid_group_id: string; name: string; cells: unknown; created_at: string }>)?.map((g) => ({
        ...g,
        cells: Array.isArray(g.cells) ? (g.cells as string[]) : [],
      })) || []
    );
  },

  async getAllForJeu(jeuId: string): Promise<CarteWithGroup[]> {
    // First get all grid groups for this jeu
    const { data: groups, error: groupsError } = await supabase
      .from("grid_group")
      .select("*")
      .eq("bingo_id", jeuId);

    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) return [];

    const typedGroups = groups as GroupeCartes[];

    // Then get all grids for these groups
    const { data: cartes, error: cartesError } = await supabase
      .from("grid")
      .select("*")
      .in(
        "grid_group_id",
        typedGroups.map((g) => g.id)
      )
      .order("created_at", { ascending: true });

    if (cartesError) throw cartesError;

    // Map groups by id for quick lookup
    const groupMap = new Map(typedGroups.map((g) => [g.id, g]));

    return (
      (cartes as Array<{ id: string; grid_group_id: string; name: string; cells: unknown; created_at: string }>)?.map((carte) => ({
        ...carte,
        cells: Array.isArray(carte.cells) ? (carte.cells as string[]) : [],
        grid_group: groupMap.get(carte.grid_group_id)!,
      })) || []
    );
  },

  async getById(id: string): Promise<Carte | null> {
    const { data, error } = await supabase
      .from("grid")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    const typedData = data as { id: string; grid_group_id: string; name: string; cells: unknown; created_at: string };
    return {
      ...typedData,
      cells: Array.isArray(typedData.cells) ? (typedData.cells as string[]) : [],
    };
  },

  async getByIdWithGroup(id: string): Promise<CarteWithGroup | null> {
    const { data, error } = await supabase
      .from("grid")
      .select("*, grid_group(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    const typedData = data as { id: string; grid_group_id: string; name: string; cells: unknown; created_at: string; grid_group: GroupeCartes };
    return {
      ...typedData,
      cells: Array.isArray(typedData.cells) ? (typedData.cells as string[]) : [],
      grid_group: typedData.grid_group,
    };
  },

  async create(groupeCartesId: string, name: string, cells: string[]): Promise<Carte> {
    const { data, error } = await supabase
      .from("grid")
      .insert({ grid_group_id: groupeCartesId, name, cells })
      .select()
      .single();

    if (error) throw error;

    const typedData = data as { id: string; grid_group_id: string; name: string; cells: unknown; created_at: string };
    return {
      ...typedData,
      cells: Array.isArray(typedData.cells) ? (typedData.cells as string[]) : [],
    };
  },

  async createMany(
    groupeCartesId: string,
    cartes: { name: string; cells: string[] }[]
  ): Promise<Carte[]> {
    const { data, error } = await supabase
      .from("grid")
      .insert(cartes.map((c) => ({ grid_group_id: groupeCartesId, ...c })))
      .select();

    if (error) throw error;
    return (
      (data as Array<{ id: string; grid_group_id: string; name: string; cells: unknown; created_at: string }>)?.map((c) => ({
        ...c,
        cells: Array.isArray(c.cells) ? (c.cells as string[]) : [],
      })) || []
    );
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("grid").delete().eq("id", id);

    if (error) throw error;
  },

  async countForJeu(jeuId: string): Promise<number> {
    const { data: groups } = await supabase
      .from("grid_group")
      .select("id")
      .eq("bingo_id", jeuId);

    if (!groups || groups.length === 0) return 0;

    const { count, error } = await supabase
      .from("grid")
      .select("id", { count: "exact", head: true })
      .in(
        "grid_group_id",
        (groups as Array<{ id: string }>).map((g) => g.id)
      );

    if (error) throw error;
    return count || 0;
  },
};

// Legacy exports for gradual migration
export const gridGroupService = groupeCartesService;
export const gridService = carteService;
