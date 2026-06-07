import { NextResponse, type NextRequest } from "next/server";
import {
  applyRequestCookies,
  createAuthenticatedRequestClients,
} from "@/lib/supabase/request";
import type { CanvasRole, RoleAssignment } from "@/types/integration";

function toRole(accessLevel: string): Exclude<CanvasRole, "owner"> {
  if (accessLevel === "edit") return "editor";
  if (accessLevel === "comment") return "commenter";
  return "viewer";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ canvasId: string }> }
) {
  try {
    const { canvasId } = await context.params;
    const { user, dbClient, cookiesToSet } = await createAuthenticatedRequestClients(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data: workspace, error: workspaceError } = await dbClient
      .from("workspaces")
      .select("id, owner_id")
      .eq("id", canvasId)
      .maybeSingle();
    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 400 });
    }
    if (!workspace) {
      return NextResponse.json({ error: "Canvas not found." }, { status: 404 });
    }

    const { data: shares, error: sharesError } = await dbClient
      .from("workspace_shares")
      .select("id, shared_with_id, shared_with_email, access_level, active")
      .eq("workspace_id", canvasId)
      .eq("active", true);
    if (sharesError) {
      return NextResponse.json({ error: sharesError.message }, { status: 400 });
    }

    const assignments: RoleAssignment[] = (shares ?? [])
      .filter((share) => Boolean(share.shared_with_id))
      .map((share) => ({
        id: share.id,
        userId: share.shared_with_id as string,
        displayName: share.shared_with_email || "Collaborator",
        role: toRole(share.access_level),
      }));

    let currentUserRole: CanvasRole = "viewer";
    if (workspace.owner_id === user.id) {
      currentUserRole = "owner";
    } else {
      const ownAssignment = assignments.find((assignment) => assignment.userId === user.id);
      if (!ownAssignment) {
        return NextResponse.json({ error: "You do not have access to this canvas." }, { status: 403 });
      }
      currentUserRole = ownAssignment.role;
    }

    return applyRequestCookies(
      NextResponse.json({ currentUserRole, assignments }),
      cookiesToSet
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load roles." },
      { status: 500 }
    );
  }
}
