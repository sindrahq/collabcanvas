import { NextResponse, type NextRequest } from "next/server";
import {
  applyResponseCookies,
  createServiceSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase/server";
import type { CanvasRole, RoleAssignment } from "@/types/integration";

function isCanvasRole(value: unknown): value is CanvasRole {
  return value === "owner" || value === "editor" || value === "commenter" || value === "viewer";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ canvasId: string }> }
) {
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
    .select("id, user_id, role")
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

  const roles = (data ?? [])
    .filter((row) => isCanvasRole(row.role))
    .map((row) => ({ id: row.id, userId: row.user_id, role: row.role as CanvasRole }));

  if (workspace?.owner_id && !roles.some((entry) => entry.userId === workspace.owner_id)) {
    roles.unshift({ id: `${canvasId}:${workspace.owner_id}`, userId: workspace.owner_id, role: "owner" });
  }

  const currentUserRole = roles.find((entry) => entry.userId === auth.user?.id)?.role ?? "viewer";
  const assignments: RoleAssignment[] = roles
    .filter((entry): entry is typeof entry & { role: Exclude<CanvasRole, "owner"> } => entry.role !== "owner")
    .map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      displayName: `Collaborator ${entry.userId.slice(0, 8)}`,
      role: entry.role,
    }));

  const response = NextResponse.json({ currentUserRole, assignments, roles });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
