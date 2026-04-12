import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type RenameWorkspaceBody = {
  name?: string;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Authentication is unavailable." }, { status: 500 });
  }

  const { workspaceId } = await context.params;
  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
  }

  let body: RenameWorkspaceBody;
  try {
    body = (await request.json()) as RenameWorkspaceBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const nextName = body.name?.trim();
  if (!nextName) {
    return NextResponse.json({ error: "Workspace name is required." }, { status: 400 });
  }

  let cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies) {
        cookiesToSet = nextCookies;
      },
    },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const dbClient = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : authClient;

  const { data: workspace, error: updateError } = await dbClient
    .from("workspaces")
    .update({ name: nextName })
    .eq("id", workspaceId)
    .eq("owner_id", userData.user.id)
    .select("id, name, owner_id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found or rename not permitted." }, { status: 403 });
  }

  const response = NextResponse.json({ workspace });
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
