import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  // In server runtime, we prefer failing early so deploys surface missing envs.
  // Note: don't throw on import in all environments; keep minimal.
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response('Supabase not configured', { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || null;
    if (!token) return new Response('Unauthorized', { status: 401 });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Validate token and obtain user
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { workspaceId, x, y, userName, color } = body ?? {};

    if (!workspaceId || typeof x !== 'number' || typeof y !== 'number') {
      return new Response('Bad Request', { status: 400 });
    }

    const topic = `room:${workspaceId}`;

    // Broadcast the minimal payload. Clients should filter self echoes by `userId`.
    const payload = {
      userId: userData.user.id,
      x,
      y,
      userName: userName ?? undefined,
      color: color ?? undefined,
    } as Record<string, unknown>;

    // Use the realtime channel send method. This returns quickly.
    await supabase.channel(topic).send({ type: 'broadcast', event: 'mouse-move', payload });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    // keep error messages opaque for security
    return new Response('Internal Server Error', { status: 500 });
  }
}
