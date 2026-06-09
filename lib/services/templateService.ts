import { LayoutTemplate, CreateTemplateInput } from "@/types/template";

export const templateService = {
  async getAll(): Promise<LayoutTemplate[]> {
    const response = await fetch("/api/templates/list", {
      method: "GET",
      credentials: "include",
    });

    const payload = (await response.json()) as {
      templates?: Array<LayoutTemplate & { data?: Record<string, unknown> }>;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error || "Failed to load templates");
    }

    return (payload.templates ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      preview_url: template.preview_url,
      elements: template.elements ?? [],
      created_at: template.created_at,
      user_id: template.user_id,
      category: template.category,
    }));
  },

  async save(input: CreateTemplateInput): Promise<LayoutTemplate> {
    const response = await fetch("/api/templates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        data: input,
      }),
    });

    const payload = (await response.json()) as {
      template?: LayoutTemplate;
      error?: string;
    };

    if (!response.ok || !payload.template) {
      throw new Error(payload.error || "Failed to save template");
    }

    return payload.template;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/templates/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error || "Failed to delete template");
    }
  }
};
