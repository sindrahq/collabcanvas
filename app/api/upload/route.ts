import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = 'edge'; // or 'nodejs' if you need Node APIs

export async function POST(req: NextRequest) {
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
  const filename = `uploads/${crypto.randomUUID()}.${ext}`;

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

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
