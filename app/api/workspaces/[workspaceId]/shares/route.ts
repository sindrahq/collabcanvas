import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createShareToken, type ShareAccessLevel } from "@/lib/share-links";

type ShareRequestBody = {
  mode?: "username" | "link";
  username?: string;
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

  const mode = body.mode ?? "username";
  const accessLevel = isShareAccessLevel(body.accessLevel) ? body.accessLevel : "view";
  const username = body.username?.trim() || "";

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

  if (mode !== "username") {
    return NextResponse.json({ error: "Unsupported share mode." }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json({ error: "Recipient username is required." }, { status: 400 });
  }

  const normalizedUsername = username.replace(/^@+/, "").toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
    return NextResponse.json(
      { error: "Username must be 3-30 chars and only contain letters, numbers, or underscores." },
      { status: 400 }
    );
  }

  const { data: targetProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id, username")
    .ilike("username", normalizedUsername)
    .maybeSingle();

  if (profileError) {
    const missingProfilesTable = profileError.message.includes("Could not find the table 'public.user_profiles'");
    if (missingProfilesTable) {
      return NextResponse.json(
        { error: "Username directory is missing. Run docs/SUPABASE_USERNAMES_SETUP.sql in Supabase SQL Editor." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (!targetProfile?.user_id) {
    return NextResponse.json({ error: "No user found with that username." }, { status: 404 });
  }

  if (targetProfile.user_id === userData.user.id) {
    return NextResponse.json({ error: "You already have access to this workspace." }, { status: 400 });
  }

  const { data: existingShare, error: existingShareError } = await supabase
    .from("workspace_shares")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("shared_with_id", targetProfile.user_id)
    .maybeSingle();

  if (existingShareError) {
    const missingSharesTable = existingShareError.message.includes("Could not find the table 'public.workspace_shares'");
    if (missingSharesTable) {
      return NextResponse.json(
        { error: "Workspace sharing table is missing. Run docs/SUPABASE_WORKSPACE_SHARES_TABLE_FIX.sql in Supabase SQL Editor." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: existingShareError.message }, { status: 400 });
  }

  const shareMutation = existingShare?.id
    ? supabase
        .from("workspace_shares")
        .update({
          shared_by_id: userData.user.id,
          access_level: accessLevel,
          active: true,
          shared_with_email: null,
          share_kind: "email",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingShare.id)
    : supabase.from("workspace_shares").insert({
        workspace_id: workspaceId,
        shared_by_id: userData.user.id,
        shared_with_id: targetProfile.user_id,
        access_level: accessLevel,
        share_kind: "email",
        active: true,
      });

  const { error: shareError } = await shareMutation;

  if (shareError) {
    const missingSharesTable = shareError.message.includes("Could not find the table 'public.workspace_shares'");
    if (missingSharesTable) {
      return NextResponse.json(
        { error: "Workspace sharing table is missing. Run docs/SUPABASE_WORKSPACE_SHARES_TABLE_FIX.sql in Supabase SQL Editor." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: shareError.message }, { status: 400 });
  }

  const response = NextResponse.json({
    sharedWithUsername: targetProfile.username,
    accessLevel,
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
