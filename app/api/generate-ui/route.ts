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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured — ask your team lead to add it to .env.local" }, { status: 503 });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `AI API error: ${err}` }, { status: 500 });
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "[]";

  try {
    const elements = JSON.parse(text) as unknown[];
    return NextResponse.json({ elements });
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw: text }, { status: 500 });
  }
}
