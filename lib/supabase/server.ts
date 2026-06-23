import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type RouteCookie = { name: string; value: string; options?: Record<string, unknown> };

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function createServiceSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createRequestSupabaseClient(
  request: NextRequest,
  cookiesToSet: RouteCookie[]
): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies) {
        cookiesToSet.push(...nextCookies);
      },
    },
  });
}

export async function getAuthenticatedUser(request: NextRequest): Promise<{
  client: SupabaseClient | null;
  user: User | null;
  cookiesToSet: RouteCookie[];
  error?: string;
}> {
  const cookiesToSet: RouteCookie[] = [];
  const client = createRequestSupabaseClient(request, cookiesToSet);

  if (!client) {
    return { client: null, user: null, cookiesToSet, error: "Authentication is unavailable." };
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return { client, user: null, cookiesToSet, error: error?.message || "You must be signed in." };
  }

  return { client, user: data.user, cookiesToSet };
}

export function applyResponseCookies(
  response: { cookies: { set: (name: string, value: string, options?: Record<string, unknown>) => void } },
  cookiesToSet: RouteCookie[]
) {
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
}

export async function requireCanvasOwner(
  canvasId: string,
  userId: string
): Promise<{ ok: true; client: SupabaseClient } | { ok: false; status: number; error: string }> {
  const client = createServiceSupabaseClient();

  if (!client) {
    return { ok: false, status: 500, error: "Supabase service role is unavailable." };
  }

  const { data, error } = await client
    .from("canvas_roles")
    .select("id")
    .eq("canvas_id", canvasId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();

  if (error) {
    const missingTable = error.message.includes("Could not find the table 'public.canvas_roles'");
    return {
      ok: false,
      status: 500,
      error: missingTable
        ? "Canvas roles table is missing. Run the canvas schema migration in Supabase."
        : error.message,
    };
  }

  if (!data) {
    const { data: workspace, error: workspaceError } = await client
      .from("workspaces")
      .select("owner_id")
      .eq("id", canvasId)
      .maybeSingle();

    if (workspaceError) {
      return { ok: false, status: 400, error: workspaceError.message };
    }

    if (workspace?.owner_id !== userId) {
      return { ok: false, status: 403, error: "Only the canvas owner can perform this action." };
    }

    await client.from("canvas_roles").upsert(
      {
        canvas_id: canvasId,
        user_id: userId,
        role: "owner",
      },
      { onConflict: "canvas_id,user_id" }
    );
  }

  return { ok: true, client };
}
