import { LayoutTemplate, CreateTemplateInput } from "@/types/template";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// This is the "Contract" between you and your backend friend.
// Currently it uses LocalStorage so you can work. 
// Your friend just needs to uncomment the Supabase code later.

export const templateService = {
  async getAll(): Promise<LayoutTemplate[]> {
    // BACKEND (Friend's part)
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async save(input: CreateTemplateInput): Promise<LayoutTemplate> {
    const newTemplate: LayoutTemplate = {
      ...input,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    // BACKEND (Friend's part)
    const supabase = createSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");
    
    const { data, error } = await supabase
      .from('templates')
      .insert([newTemplate])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // BACKEND
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.from('templates').delete().eq('id', id);
  }
};
