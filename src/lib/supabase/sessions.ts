import { supabase } from "./client";
import type { DrawSession } from "./types";

type RawDrawSession = {
  id: string;
  bingo_id: string;
  name: string;
  is_active: boolean;
  drawn_image_ids: unknown;
  created_at: string;
};

function normalizeSession(data: RawDrawSession): DrawSession {
  return {
    ...data,
    drawn_image_ids: Array.isArray(data.drawn_image_ids)
      ? (data.drawn_image_ids as string[])
      : [],
  };
}

export const sessionsService = {
  async getAll(bingoId: string): Promise<DrawSession[]> {
    const { data, error } = await supabase
      .from("draw_session")
      .select("*")
      .eq("bingo_id", bingoId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data as RawDrawSession[]) || []).map(normalizeSession);
  },

  async getById(id: string): Promise<DrawSession | null> {
    const { data, error } = await supabase
      .from("draw_session")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return normalizeSession(data as RawDrawSession);
  },

  async getActive(bingoId: string): Promise<DrawSession | null> {
    const { data, error } = await supabase
      .from("draw_session")
      .select("*")
      .eq("bingo_id", bingoId)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return normalizeSession(data as RawDrawSession);
  },

  async create(bingoId: string, name: string): Promise<DrawSession> {
    // Deactivate all other sessions for this bingo
    await supabase
      .from("draw_session")
      .update({ is_active: false })
      .eq("bingo_id", bingoId);

    const { data, error } = await supabase
      .from("draw_session")
      .insert({ bingo_id: bingoId, name, is_active: true, drawn_image_ids: [] })
      .select()
      .single();

    if (error) throw error;
    return normalizeSession(data as RawDrawSession);
  },

  async update(
    id: string,
    updateData: Partial<Pick<DrawSession, "name" | "is_active" | "drawn_image_ids">>
  ): Promise<DrawSession> {
    const { data: updated, error } = await supabase
      .from("draw_session")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return normalizeSession(updated as RawDrawSession);
  },

  async setActive(id: string, bingoId: string): Promise<DrawSession> {
    // Deactivate all sessions for this bingo
    await supabase
      .from("draw_session")
      .update({ is_active: false })
      .eq("bingo_id", bingoId);

    // Activate the selected one
    return this.update(id, { is_active: true });
  },

  async addDrawnImage(id: string, imageId: string): Promise<DrawSession> {
    const session = await this.getById(id);
    if (!session) throw new Error("Session not found");

    const newDrawnIds = [...session.drawn_image_ids, imageId];
    return this.update(id, { drawn_image_ids: newDrawnIds });
  },

  async resetDrawnImages(id: string): Promise<DrawSession> {
    return this.update(id, { drawn_image_ids: [] });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("draw_session").delete().eq("id", id);

    if (error) throw error;
  },

  async deleteAll(bingoId: string): Promise<number> {
    const sessions = await this.getAll(bingoId);
    const count = sessions.length;

    const { error } = await supabase
      .from("draw_session")
      .delete()
      .eq("bingo_id", bingoId);

    if (error) throw error;
    return count;
  },
};
