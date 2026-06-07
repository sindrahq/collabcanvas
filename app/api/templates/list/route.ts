import { NextResponse, type NextRequest } from "next/server";
import {
  applyRequestCookies,
  createAuthenticatedRequestClients,
} from "@/lib/supabase/request";
import type { CanvasTemplate } from "@/types/integration";

export async function GET(request: NextRequest) {
  try {
    const { user, dbClient, cookiesToSet } = await createAuthenticatedRequestClients(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data, error } = await dbClient
      .from("templates")
      .select("id, name, description, preview_url, elements, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const templates: CanvasTemplate[] = (data ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      previewUrl: template.preview_url ?? undefined,
      elements: template.elements ?? [],
      createdAt: template.created_at,
    }));

    return applyRequestCookies(NextResponse.json({ templates }), cookiesToSet);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load templates." },
      { status: 500 }
    );
  }
}
