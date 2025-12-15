import { supabase } from "./client";
import type { Grid, GridGroup, GridWithGroup } from "./types";

export const gridGroupService = {
  async getAll(bingoId: string): Promise<GridGroup[]> {
    const { data, error } = await supabase
      .from("grid_group")
      .select("*")
      .eq("bingo_id", bingoId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as GridGroup[]) || [];
  },

  async getById(id: string): Promise<GridGroup | null> {
    const { data, error } = await supabase
      .from("grid_group")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as GridGroup;
  },

  async create(bingoId: string, name: string, size: number): Promise<GridGroup> {
    const { data, error } = await supabase
      .from("grid_group")
      .insert({ bingo_id: bingoId, name, size })
      .select()
      .single();

    if (error) throw error;
    return data as GridGroup;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("grid_group").delete().eq("id", id);

    if (error) throw error;
  },

  async deleteAll(bingoId: string): Promise<number> {
    const groups = await this.getAll(bingoId);
    const count = groups.length;

    const { error } = await supabase
      .from("grid_group")
      .delete()
      .eq("bingo_id", bingoId);

    if (error) throw error;
    return count;
  },
};

export const gridService = {
  async getAll(gridGroupId: string): Promise<Grid[]> {
    const { data, error } = await supabase
      .from("grid")
      .select("*")
      .eq("grid_group_id", gridGroupId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (
      (data as Array<{ id: string; grid_group_id: string; name: string; cells: unknown; created_at: string }>)?.map((g) => ({
        ...g,
        cells: Array.isArray(g.cells) ? (g.cells as string[]) : [],
      })) || []
    );
  },

  async getAllForBingo(bingoId: string): Promise<GridWithGroup[]> {
    // First get all grid groups for this bingo
    const { data: groups, error: groupsError } = await supabase
      .from("grid_group")
      .select("*")
      .eq("bingo_id", bingoId);

    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) return [];

    const typedGroups = groups as GridGroup[];

    // Then get all grids for these groups
    const { data: grids, error: gridsError } = await supabase
      .from("grid")
      .select("*")
      .in(
        "grid_group_id",
        typedGroups.map((g) => g.id)
      )
      .order("created_at", { ascending: true });

    if (gridsError) throw gridsError;

    // Map groups by id for quick lookup
    const groupMap = new Map(typedGroups.map((g) => [g.id, g]));

    return (
      (grids as Array<{ id: string; grid_group_id: string; name: string; cells: unknown; created_at: string }>)?.map((grid) => ({
        ...grid,
        cells: Array.isArray(grid.cells) ? (grid.cells as string[]) : [],
        grid_group: groupMap.get(grid.grid_group_id)!,
      })) || []
    );
  },

  async getById(id: string): Promise<Grid | null> {
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

  async getByIdWithGroup(id: string): Promise<GridWithGroup | null> {
    const { data, error } = await supabase
      .from("grid")
      .select("*, grid_group(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    const typedData = data as { id: string; grid_group_id: string; name: string; cells: unknown; created_at: string; grid_group: GridGroup };
    return {
      ...typedData,
      cells: Array.isArray(typedData.cells) ? (typedData.cells as string[]) : [],
      grid_group: typedData.grid_group,
    };
  },

  async create(gridGroupId: string, name: string, cells: string[]): Promise<Grid> {
    const { data, error } = await supabase
      .from("grid")
      .insert({ grid_group_id: gridGroupId, name, cells })
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
    gridGroupId: string,
    grids: { name: string; cells: string[] }[]
  ): Promise<Grid[]> {
    const { data, error } = await supabase
      .from("grid")
      .insert(grids.map((g) => ({ grid_group_id: gridGroupId, ...g })))
      .select();

    if (error) throw error;
    return (
      (data as Array<{ id: string; grid_group_id: string; name: string; cells: unknown; created_at: string }>)?.map((g) => ({
        ...g,
        cells: Array.isArray(g.cells) ? (g.cells as string[]) : [],
      })) || []
    );
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("grid").delete().eq("id", id);

    if (error) throw error;
  },

  async countForBingo(bingoId: string): Promise<number> {
    const { data: groups } = await supabase
      .from("grid_group")
      .select("id")
      .eq("bingo_id", bingoId);

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
