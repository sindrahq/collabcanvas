import { NextRequest, NextResponse } from "next/server";
import {
  applyRequestCookies,
  createAuthenticatedRequestClients,
} from "@/lib/supabase/request";

export async function POST(req: NextRequest) {
  const { user, dbClient, cookiesToSet } = await createAuthenticatedRequestClients(req);
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  // Only allow multipart/form-data
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  // Parse form data
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG and JPEG allowed' }, { status: 400 });
  }

  // Generate unique filename
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const filename = `${user.id}/${crypto.randomUUID()}.${ext}`;

  // Upload to Supabase Storage
  const { error } = await dbClient.storage
    .from('user-uploads')
    .upload(filename, file.stream(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const { data: signedData, error: signedError } = await dbClient.storage
    .from("user-uploads")
    .createSignedUrl(filename, 60 * 60);
  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  return applyRequestCookies(
    NextResponse.json({ url: signedData.signedUrl }),
    cookiesToSet
  );
}
