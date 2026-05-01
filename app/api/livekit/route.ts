import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const identity = req.nextUrl.searchParams.get("identity");

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  }

  if (!identity) {
    return NextResponse.json({ error: 'Missing "identity" query parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Server misconfigured. Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET." },
      { status: 500 }
    );
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity });
    at.addGrant({ roomJoin: true, room });

    // Ensure we use the newer generation toJwt interface
    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate token" }, { status: 500 });
  }
}
