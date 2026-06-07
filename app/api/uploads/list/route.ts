import { NextResponse, type NextRequest } from "next/server";
import {
  applyRequestCookies,
  createAuthenticatedRequestClients,
} from "@/lib/supabase/request";
import type { UploadedAsset } from "@/types/integration";

const BUCKET = "user-uploads";

function mimeTypeFromName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function GET(request: NextRequest) {
  try {
    const { user, dbClient, cookiesToSet } = await createAuthenticatedRequestClients(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data: files, error } = await dbClient.storage
      .from(BUCKET)
      .list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const uploadFiles = (files ?? []).filter((file) => Boolean(file.id));
    const paths = uploadFiles.map((file) => `${user.id}/${file.name}`);
    const { data: signed, error: signedError } = paths.length
      ? await dbClient.storage.from(BUCKET).createSignedUrls(paths, 60 * 60)
      : { data: [], error: null };
    if (signedError) {
      return NextResponse.json({ error: signedError.message }, { status: 400 });
    }

    const assets: UploadedAsset[] = uploadFiles.flatMap((file, index) => {
      const url = signed?.[index]?.signedUrl;
      if (!file.id || !url) return [];
      return [{
        id: file.id,
        url,
        name: file.name,
        mimeType: mimeTypeFromName(file.name),
        createdAt: file.created_at ?? undefined,
      }];
    });

    return applyRequestCookies(NextResponse.json({ assets }), cookiesToSet);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load uploads." },
      { status: 500 }
    );
  }
}
