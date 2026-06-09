import { NextResponse, type NextRequest } from "next/server";
import { applyResponseCookies, getAuthenticatedUser, createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ canvasId: string }> }) {
  const { canvasId } = await context.params;
  if (!canvasId) {
    return NextResponse.json({ error: "Missing canvas id." }, { status: 400 });
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
    .from("canvas_roles")
    .select("user_id, role")
    .eq("canvas_id", canvasId)
    .order("created_at", { ascending: true });

  if (error) {
    const missingTable = error.message.includes("Could not find the table 'public.canvas_roles'");
    return NextResponse.json(
      {
        error: missingTable
          ? "Canvas roles table is missing. Run the canvas schema migration in Supabase SQL Editor."
          : error.message,
      },
      { status: 400 }
    );
  }

  const { data: workspace } = await db
    .from("workspaces")
    .select("owner_id")
    .eq("id", canvasId)
    .maybeSingle();

  const roles = [...(data ?? []).map((row) => ({ userId: row.user_id, role: row.role }))];
  if (workspace?.owner_id && !roles.some((entry) => entry.userId === workspace.owner_id)) {
    roles.unshift({ userId: workspace.owner_id, role: "owner" });
  }

  const response = NextResponse.json({ roles });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
