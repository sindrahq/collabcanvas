import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ColorSuggestion = { hex: string; name: string; usage: string };

export async function POST(req: NextRequest) {
  const { colors } = (await req.json()) as { colors?: string[] };
  if (!colors?.length) return NextResponse.json({ error: "colors required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ palette: generateHarmony(colors) });
  }

  const prompt = `Current canvas fill colors: ${colors.join(", ")}
Suggest exactly 5 harmonious colors that complement this palette.
Return ONLY a JSON array — no markdown, no explanation:
[{"hex":"#xxxxxx","name":"Color Name","usage":"Background|Primary|Accent|Text|Border"}]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ palette: generateHarmony(colors) });
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "[]";

  try {
    const palette = JSON.parse(text) as ColorSuggestion[];
    return NextResponse.json({ palette });
  } catch {
    return NextResponse.json({ palette: generateHarmony(colors) });
  }
}

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0; let g = 0; let b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateHarmony(colors: string[]): ColorSuggestion[] {
  const base = colors.find((c) => /^#[0-9a-f]{6}$/i.test(c)) ?? "#D3A5B1";
  const [h, s, l] = hexToHsl(base);
  return [
    { hex: hslToHex(h, s, l),                           name: "Base",          usage: "Primary" },
    { hex: hslToHex(h + 30, s, l),                      name: "Analogous",     usage: "Accent" },
    { hex: hslToHex(h + 180, s, l),                     name: "Complementary", usage: "Contrast" },
    { hex: hslToHex(h, s * 0.4, Math.min(94, l + 30)), name: "Tint",          usage: "Background" },
    { hex: hslToHex(h, s,       Math.max(12, l - 30)), name: "Shade",         usage: "Text" },
  ];
}
