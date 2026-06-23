import { NextResponse, type NextRequest } from "next/server";
import { applyResponseCookies, createServiceSupabaseClient, getAuthenticatedUser } from "@/lib/supabase/server";

function normalizeTemplate(row: { id: string; owner_id: string | null; name: string; data: unknown; created_at: string }) {
  const data = row.data && typeof row.data === "object" ? (row.data as Record<string, unknown>) : {};
  const elements = Array.isArray(data.elements) ? data.elements : [];

  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    user_id: row.owner_id ?? "",
    elements,
    data,
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing template id." }, { status: 400 });
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

  const { data, error } = await db
    .from("canvas_templates")
    .select("id, owner_id, name, data, created_at")
    .eq("id", id)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

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

  if (!data) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const response = NextResponse.json({ template: normalizeTemplate(data) });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing template id." }, { status: 400 });
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

  const { data, error } = await db
    .from("canvas_templates")
    .delete()
    .eq("id", id)
    .eq("owner_id", auth.user.id)
    .select("id")
    .maybeSingle();

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

  if (!data) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
