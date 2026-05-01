import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role key bypasses RLS so server-side reads/writes always succeed
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspace_id = searchParams.get('workspace_id');
  const element_id = searchParams.get('element_id');
  if (!workspace_id || !element_id) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('element_history')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('element_id', element_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspace_id, element_id, snapshot } = body;
    if (!workspace_id || !element_id || !snapshot) {
      console.error("Missing fields", { workspace_id, element_id, snapshot });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('element_history')
      .insert([{ workspace_id, element_id, snapshot }])
      .select();

    if (error) {
      console.error("Supabase insert error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log("Supabase insert success", data);
    return NextResponse.json(data[0]);
  } catch (e) {
    console.error("API route exception", e);
    return NextResponse.json({ error: 'Internal server error', details: String(e) }, { status: 500 });
  }
}
