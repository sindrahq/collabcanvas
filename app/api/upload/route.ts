import { NextRequest, NextResponse } from "next/server";
import {
  applyResponseCookies,
  createServiceSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase/server";

const BUCKET = "user-uploads";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth.user) {
    const response = NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
    applyResponseCookies(response, auth.cookiesToSet);
    return response;
  }

  const db = createServiceSupabaseClient() ?? auth.client;
  if (!db) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG and JPEG allowed" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const filename = `uploads/${auth.user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage.from(BUCKET).upload(filename, file.stream(), {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: signedData, error: signedError } = await db.storage
    .from(BUCKET)
    .createSignedUrl(filename, 60 * 60);
  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  const response = NextResponse.json({ url: signedData.signedUrl, path: filename, name: file.name });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
