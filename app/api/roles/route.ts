import { NextResponse, type NextRequest } from "next/server";
import {
  applyRequestCookies,
  createAuthenticatedRequestClients,
} from "@/lib/supabase/request";
import type { CanvasRole, RoleAssignment } from "@/types/integration";

type RoleUpdateBody = {
  canvasId?: string;
  userId?: string;
  role?: Exclude<CanvasRole, "owner">;
};

function toAccessLevel(role: Exclude<CanvasRole, "owner">) {
  if (role === "editor") return "edit";
  if (role === "commenter") return "comment";
  return "view";
}

function isAssignableRole(value: unknown): value is Exclude<CanvasRole, "owner"> {
  return value === "editor" || value === "commenter" || value === "viewer";
}

export async function POST(request: NextRequest) {
  try {
    let body: RoleUpdateBody;
    try {
      body = (await request.json()) as RoleUpdateBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    if (!body.canvasId || !body.userId || !isAssignableRole(body.role)) {
      return NextResponse.json(
        { error: "canvasId, userId, and a valid role are required." },
        { status: 400 }
      );
    }

    const { user, dbClient, cookiesToSet } = await createAuthenticatedRequestClients(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data: workspace } = await dbClient
      .from("workspaces")
      .select("id, owner_id")
      .eq("id", body.canvasId)
      .maybeSingle();
    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: "Only the owner can update roles." }, { status: 403 });
    }
    if (body.userId === user.id) {
      return NextResponse.json({ error: "The owner role cannot be changed." }, { status: 400 });
    }

    const accessLevel = toAccessLevel(body.role);
    const { data: existing } = await dbClient
      .from("workspace_shares")
      .select("id, shared_with_email")
      .eq("workspace_id", body.canvasId)
      .eq("shared_with_id", body.userId)
      .maybeSingle();

    const mutation = existing?.id
      ? dbClient
          .from("workspace_shares")
          .update({ access_level: accessLevel, active: true, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select("id, shared_with_id, shared_with_email")
          .single()
      : dbClient
          .from("workspace_shares")
          .insert({
            workspace_id: body.canvasId,
            shared_by_id: user.id,
            shared_with_id: body.userId,
            access_level: accessLevel,
            share_kind: "email",
            active: true,
          })
          .select("id, shared_with_id, shared_with_email")
          .single();

    const { data: share, error } = await mutation;
    if (error || !share) {
      return NextResponse.json({ error: error?.message || "Unable to update role." }, { status: 400 });
    }

    const assignment: RoleAssignment = {
      id: share.id,
      userId: share.shared_with_id,
      displayName: share.shared_with_email || "Collaborator",
      role: body.role,
    };

    return applyRequestCookies(NextResponse.json({ assignment }), cookiesToSet);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update role." },
      { status: 500 }
    );
  }
}
