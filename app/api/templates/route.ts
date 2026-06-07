import { NextResponse, type NextRequest } from "next/server";
import {
  applyRequestCookies,
  createAuthenticatedRequestClients,
} from "@/lib/supabase/request";
import type { CanvasElement } from "@/store/workspaceStore";
import type { CanvasTemplate } from "@/types/integration";

type SaveTemplateBody = {
  name?: string;
  description?: string;
  elements?: CanvasElement[];
};

export async function POST(request: NextRequest) {
  try {
    let body: SaveTemplateBody;
    try {
      body = (await request.json()) as SaveTemplateBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const name = body.name?.trim();
    if (!name || !Array.isArray(body.elements) || body.elements.length === 0) {
      return NextResponse.json(
        { error: "A template name and at least one canvas element are required." },
        { status: 400 }
      );
    }

    const { user, dbClient, cookiesToSet } = await createAuthenticatedRequestClients(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data, error } = await dbClient
      .from("templates")
      .insert({
        name,
        description: body.description?.trim() || null,
        elements: body.elements,
        user_id: user.id,
      })
      .select("id, name, description, preview_url, elements, created_at")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Unable to save template." }, { status: 400 });
    }

    const template: CanvasTemplate = {
      id: data.id,
      name: data.name,
      description: data.description ?? undefined,
      previewUrl: data.preview_url ?? undefined,
      elements: data.elements ?? [],
      createdAt: data.created_at,
    };

    return applyRequestCookies(NextResponse.json({ template }), cookiesToSet);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save template." },
      { status: 500 }
    );
  }
}
