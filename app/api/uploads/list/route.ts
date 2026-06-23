import { NextResponse, type NextRequest } from "next/server";
import {
  applyResponseCookies,
  createServiceSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase/server";
import type { UploadedAsset } from "@/types/integration";

const BUCKET = "user-uploads";

function mimeTypeFromName(name: string, fallback?: unknown) {
  if (typeof fallback === "string" && fallback) return fallback;
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

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

  const folder = `uploads/${auth.user.id}`;
  const { data: files, error } = await db.storage.from(BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const uploadFiles = (files ?? []).filter((file) => Boolean(file.name));
  const paths = uploadFiles.map((file) => `${folder}/${file.name}`);
  const { data: signed, error: signedError } = paths.length
    ? await db.storage.from(BUCKET).createSignedUrls(paths, 60 * 60)
    : { data: [], error: null };
  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 400 });
  }

  const assets: UploadedAsset[] = uploadFiles.flatMap((file, index) => {
    const url = signed?.[index]?.signedUrl;
    if (!url) return [];
    const metadata = file.metadata as { mimetype?: string } | null;
    return [{
      id: `${folder}/${file.name}`,
      url,
      name: file.name,
      mimeType: mimeTypeFromName(file.name, metadata?.mimetype),
      createdAt: file.created_at ?? undefined,
    }];
  });

  const response = NextResponse.json({ assets });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
