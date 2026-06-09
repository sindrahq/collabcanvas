import { NextResponse, type NextRequest } from "next/server";
import { applyResponseCookies, createServiceSupabaseClient, getAuthenticatedUser, requireCanvasOwner } from "@/lib/supabase/server";

const allowedRoles = new Set(["owner", "editor", "commenter", "viewer"]);

export async function POST(request: NextRequest) {
  let body: { canvasId?: string; userId?: string; role?: string };

  try {
    body = (await request.json()) as { canvasId?: string; userId?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const canvasId = body.canvasId?.trim();
  const userId = body.userId?.trim();
  const role = body.role?.trim();

  if (!canvasId || !userId || !role || !allowedRoles.has(role)) {
    return NextResponse.json({ error: "canvasId, userId, and a valid role are required." }, { status: 400 });
  }

  const auth = await getAuthenticatedUser(request);
  if (!auth.user) {
    const response = NextResponse.json({ error: auth.error || "You must be signed in." }, { status: 401 });
    applyResponseCookies(response, auth.cookiesToSet);
    return response;
  }

  const ownerCheck = await requireCanvasOwner(canvasId, auth.user.id);
  if (!ownerCheck.ok) {
    return NextResponse.json({ error: ownerCheck.error }, { status: ownerCheck.status });
  }

  const db = createServiceSupabaseClient() ?? auth.client;
  if (!db) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data, error } = await db
    .from("canvas_roles")
    .upsert(
      {
        canvas_id: canvasId,
        user_id: userId,
        role,
      },
      { onConflict: "canvas_id,user_id" }
    )
    .select("user_id, role")
    .single();

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

  void db.channel(`canvas:${canvasId}`).send({
    type: "broadcast",
    event: "role-change",
    payload: { userId, newRole: role },
  });

  const response = NextResponse.json({ role: { userId: data.user_id, role: data.role } });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
