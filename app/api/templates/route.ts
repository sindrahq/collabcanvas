import { NextResponse, type NextRequest } from "next/server";
import {
  applyResponseCookies,
  createServiceSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase/server";
import type { CanvasElement } from "@/store/workspaceStore";
import type { CanvasTemplate } from "@/types/integration";

type SaveTemplateBody = {
  name?: string;
  description?: string;
  elements?: CanvasElement[];
  data?: unknown;
};

export async function POST(request: NextRequest) {
  let body: SaveTemplateBody;

  try {
    body = (await request.json()) as SaveTemplateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const dataFromBody = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
  const elements = Array.isArray(body.elements)
    ? body.elements
    : Array.isArray(dataFromBody.elements)
      ? dataFromBody.elements
      : [];

  if (!name || elements.length === 0) {
    return NextResponse.json(
      { error: "A template name and at least one canvas element are required." },
      { status: 400 }
    );
  }

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

  const payload = {
    ...dataFromBody,
    description: body.description?.trim() || dataFromBody.description,
    elements,
  };

  const { data, error } = await db
    .from("canvas_templates")
    .insert({
      owner_id: auth.user.id,
      name,
      data: payload,
    })
    .select("id, owner_id, name, data, created_at")
    .single();

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

  const savedData = data.data && typeof data.data === "object" ? (data.data as Record<string, unknown>) : {};
  const template: CanvasTemplate = {
    id: data.id,
    name: data.name,
    description: typeof savedData.description === "string" ? savedData.description : undefined,
    previewUrl: typeof savedData.previewUrl === "string" ? savedData.previewUrl : undefined,
    elements: Array.isArray(savedData.elements) ? (savedData.elements as CanvasElement[]) : [],
    createdAt: data.created_at,
  };

  const response = NextResponse.json({ template });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
