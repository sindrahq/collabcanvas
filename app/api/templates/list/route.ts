import { NextResponse, type NextRequest } from "next/server";
import {
  applyResponseCookies,
  createServiceSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase/server";
import type { CanvasTemplate } from "@/types/integration";

type TemplateRow = {
  id: string;
  owner_id: string | null;
  name: string;
  data: unknown;
  created_at: string;
};

function normalizeTemplate(row: TemplateRow): CanvasTemplate {
  const data = row.data && typeof row.data === "object" ? (row.data as Record<string, unknown>) : {};
  const elements = Array.isArray(data.elements) ? data.elements : [];

  return {
    id: row.id,
    name: row.name,
    description: typeof data.description === "string" ? data.description : undefined,
    previewUrl: typeof data.previewUrl === "string" ? data.previewUrl : undefined,
    elements: elements as CanvasTemplate["elements"],
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.user) {
    const response = NextResponse.json({ error: auth.error || "You must be signed in." }, { status: 401 });
    applyResponseCookies(response, auth.cookiesToSet);
    return response;
  }

  const db = createServiceSupabaseClient() ?? auth.client;
  if (!db) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data, error } = await db
    .from("canvas_templates")
    .select("id, owner_id, name, data, created_at")
    .eq("owner_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    const missingTable = error.message.includes("Could not find the table 'public.canvas_templates'");
    return NextResponse.json(
      {
        error: missingTable
          ? "Canvas templates table is missing. Run the canvas schema migration in Supabase SQL Editor."
          : error.message,
      },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ templates: ((data ?? []) as TemplateRow[]).map(normalizeTemplate) });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
