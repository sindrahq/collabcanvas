import { LayoutTemplate, CreateTemplateInput } from "@/types/template";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// This is the "Contract" between you and your backend friend.
// Currently it uses LocalStorage so you can work. 
// Your friend just needs to uncomment the Supabase code later.

const STORAGE_KEY = "collabcanvas_local_templates";

export const templateService = {
  async getAll(): Promise<LayoutTemplate[]> {
    // FRONTEND-ONLY MOCK (Local Storage)
    const local = localStorage.getItem(STORAGE_KEY);
    const localTemplates = local ? JSON.parse(local) : [];
    
    /* 
    // BACKEND (Friend's part)
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
    */
    
    return localTemplates;
  },

  async save(input: CreateTemplateInput): Promise<LayoutTemplate> {
    const newTemplate: LayoutTemplate = {
      ...input,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    // FRONTEND-ONLY MOCK
    const existing = await this.getAll();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newTemplate, ...existing]));

    /*
    // BACKEND (Friend's part)
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('templates')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data;
    */

    return newTemplate;
  },

  async delete(id: string): Promise<void> {
    const existing = await this.getAll();
    const filtered = existing.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    /*
    // BACKEND
    const supabase = createSupabaseBrowserClient();
    await supabase.from('templates').delete().eq('id', id);
    */
  }
};
