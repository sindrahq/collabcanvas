import { CanvasElement } from "@/store/workspaceStore";

export interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  preview_url?: string; // For a screenshot/thumbnail
  elements: CanvasElement[]; // The JSON block
  created_at: string;
  user_id: string;
  category?: string;
}

export type CreateTemplateInput = Omit<LayoutTemplate, "id" | "created_at">;
