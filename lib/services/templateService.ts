import { LayoutTemplate, CreateTemplateInput } from "@/types/template";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchCanvasTemplates, saveCanvasTemplate } from "@/lib/api/canvasIntegration";

export const templateService = {
  async getAll(): Promise<LayoutTemplate[]> {
    const { templates } = await fetchCanvasTemplates();
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      preview_url: template.previewUrl,
      elements: template.elements,
      created_at: template.createdAt,
      user_id: "",
    }));
  },

  async save(input: CreateTemplateInput): Promise<LayoutTemplate> {
    const { template } = await saveCanvasTemplate({
      name: input.name,
      description: input.description,
      elements: input.elements,
    });
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      preview_url: template.previewUrl,
      elements: template.elements,
      created_at: template.createdAt,
      user_id: input.user_id,
    };
  },

  async delete(id: string): Promise<void> {
    // BACKEND (Supabase)
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from('templates').delete().eq('id', id);
  }
};
