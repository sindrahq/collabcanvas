import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "Cloudinary is not configured. Please install cloudinary to enable video trimming." },
    { status: 501 }
  );
}
