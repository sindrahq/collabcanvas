import { NextResponse, type NextRequest } from "next/server";
import { applyResponseCookies, createServiceSupabaseClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: { name?: string; data?: unknown };

  try {
    body = (await request.json()) as { name?: string; data?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Template name is required." }, { status: 400 });
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
    .insert({
      owner_id: auth.user.id,
      name,
      data: body.data ?? {},
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

  const response = NextResponse.json({
    template: {
      id: data.id,
      name: data.name,
      created_at: data.created_at,
      user_id: data.owner_id ?? auth.user.id,
      ...(typeof data.data === "object" && data.data !== null ? (data.data as Record<string, unknown>) : {}),
    },
  });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
