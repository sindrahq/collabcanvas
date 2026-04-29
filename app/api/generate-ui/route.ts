
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a UI design assistant for a collaborative canvas tool.
Generate canvas elements based on the user's description.
Return ONLY a valid JSON array — no markdown, no explanation.
Canvas dimensions: 1280 wide × 800 tall. All x/y/width/height are in those units.
Each element must have: type, x, y, width, height, style.
Valid types: rectangle, circle, text, triangle, star, arrow, line, diamond, hexagon, pentagon, heart, cloud.
Style must have: fill (hex), stroke (hex), strokeWidth (number 0-4), opacity (0-1), fontSize (number, only matters for text).
For text elements, include a "text" string field with the label.
Generate 3 to 8 elements that form a coherent UI layout.`;

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as { prompt?: string };
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured — add it to .env.local" }, { status: 503 });

  // Try a list of Gemini models (some accounts have different access/quotas)
  const preferredModels = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
  ];

  const promptText = `${SYSTEM_PROMPT}\n${prompt}`;
  let lastErrorText = "";
  let data: any = null;

  for (const model of preferredModels) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    try {
      const geminiPrompt = [ { role: "user", parts: [{ text: promptText }] } ];
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: geminiPrompt }),
      });

      if (!res.ok) {
        lastErrorText = await res.text();
        // try next model
        continue;
      }

      data = await res.json();
      // success
      break;
    } catch (err: any) {
      lastErrorText = String(err?.message ?? err);
      continue;
    }
  }

  if (!data) {
    return NextResponse.json({ error: `AI API error: ${lastErrorText}` }, { status: 502 });
  }
  // Gemini returns candidates[0].content.parts[0].text
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

  try {
    const elements = JSON.parse(text) as unknown[];
    return NextResponse.json({ elements });
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw: text }, { status: 500 });
  }
}
