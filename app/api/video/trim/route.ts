import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { videoUrl, trimStart, trimEnd } = await req.json();
  if (!videoUrl || trimStart == null || trimEnd == null) {
    return NextResponse.json({ error: "Missing videoUrl, trimStart, or trimEnd" }, { status: 400 });
  }

  // Download video from Cloudinary
  const res = await fetch(videoUrl);
  if (!res.ok) return NextResponse.json({ error: "Failed to download video" }, { status: 500 });
  const arrayBuffer = await res.arrayBuffer();
  const inputPath = join(tmpdir(), `input_${Date.now()}.mp4`);
  const outputPath = join(tmpdir(), `output_${Date.now()}.mp4`);
  await writeFile(inputPath, Buffer.from(arrayBuffer));

  // Run FFmpeg to trim video
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,
      "-ss", String(trimStart),
      "-to", String(trimEnd),
      "-c:v", "copy",
      "-c:a", "copy",
      outputPath,
    ]);
    ffmpeg.on("close", (code) => (code === 0 ? resolve(null) : reject(new Error("FFmpeg failed"))));
  });

  // Upload trimmed video to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(outputPath, {
    resource_type: "video",
    folder: "collabcanvas/trimmed/",
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  });

  // Clean up temp files
  await unlink(inputPath).catch(() => {});
  await unlink(outputPath).catch(() => {});

  return NextResponse.json({ url: uploadResult.secure_url });
}
