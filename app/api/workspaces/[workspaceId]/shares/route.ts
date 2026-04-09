import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createShareToken, type ShareAccessLevel } from "@/lib/share-links";

type ShareRequestBody = {
  mode?: "email" | "link";
  email?: string;
  accessLevel?: ShareAccessLevel;
};

function isShareAccessLevel(value: unknown): value is ShareAccessLevel {
  return value === "view" || value === "comment" || value === "edit";
}

export async function POST(request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Authentication is unavailable." }, { status: 500 });
  }

  const { workspaceId } = await context.params;

  if (workspaceId.startsWith("local-")) {
    return NextResponse.json(
      { error: "This workspace is local-only and cannot be shared until it is synced to Supabase." },
      { status: 400 }
    );
  }

  let body: ShareRequestBody;
  try {
    body = (await request.json()) as ShareRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = body.mode ?? "email";
  const accessLevel = isShareAccessLevel(body.accessLevel) ? body.accessLevel : "view";
  const email = body.email?.trim().toLowerCase() || "";

  let cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies) {
        cookiesToSet = nextCookies;
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, owner_id, name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    return NextResponse.json({ error: workspaceError.message }, { status: 400 });
  }

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found, or you do not have access to share it." },
      { status: 404 }
    );
  }

  if (workspace.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "Only the owner can share this workspace." }, { status: 403 });
  }

  if (mode === "link") {
    try {
      const token = createShareToken({
        workspaceId,
        accessLevel,
        issuedAt: Date.now(),
      });

      const response = NextResponse.json({
        shareLink: `${new URL(request.url).origin}/s/${encodeURIComponent(token)}`,
        token,
        accessLevel,
      });

      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create share link.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!email) {
    return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
  }

  const { error: shareError } = await supabase.from("workspace_shares").insert({
    workspace_id: workspaceId,
    shared_by_id: userData.user.id,
    shared_with_email: email,
    access_level: accessLevel,
    share_kind: "email",
    active: true,
  });

  if (shareError) {
    return NextResponse.json({ error: shareError.message }, { status: 400 });
  }

  const response = NextResponse.json({
    sharedWithEmail: email,
    accessLevel,
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
