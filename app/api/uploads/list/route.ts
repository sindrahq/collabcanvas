import { NextResponse, type NextRequest } from "next/server";
import { applyResponseCookies, createServiceSupabaseClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

  const prefix = `uploads/${auth.user.id}/`;
  const { data, error } = await db.storage.from("user-uploads").list(prefix, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const assets = (data ?? []).map((file) => {
    const path = `${prefix}${file.name}`;
    const { data: publicUrl } = db.storage.from("user-uploads").getPublicUrl(path);

    return {
      id: path,
      name: file.name,
      mimeType: file.metadata?.mimetype ?? "",
      url: publicUrl.publicUrl,
    };
  });

  const response = NextResponse.json({ assets });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
