import { NextRequest, NextResponse } from 'next/server';
import { applyResponseCookies, createServiceSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/server';

export const runtime = 'edge'; // or 'nodejs' if you need Node APIs

export async function POST(req: NextRequest) {
  // Only allow multipart/form-data
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth.user) {
    const response = NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    applyResponseCookies(response, auth.cookiesToSet);
    return response;
  }

  const supabase = createServiceSupabaseClient() ?? auth.client;
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
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
  const filename = `uploads/${auth.user.id}/${crypto.randomUUID()}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('user-uploads')
    .upload(filename, file.stream(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filename);

  const response = NextResponse.json({ url: publicUrlData.publicUrl, path: filename, name: file.name });
  applyResponseCookies(response, auth.cookiesToSet);
  return response;
}
