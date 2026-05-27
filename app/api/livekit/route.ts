import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: "LiveKit server not configured. Please install livekit-server-sdk to enable this feature." },
    { status: 501 }
  );
}
