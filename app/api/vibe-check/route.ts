import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TargetType = "shape" | "text" | "image" | "video" | "frame";

type VibeStylePatch = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
};

type VibeSuggestion = {
  name: string;
  usage: string;
  targetTypes: TargetType[];
  style: VibeStylePatch;
};

export async function POST(req: NextRequest) {
  const { colors } = (await req.json()) as { colors?: string[] };
  if (!colors?.length) return NextResponse.json({ error: "colors required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ suggestions: generateHarmony(colors) });
  }

  const prompt = `Current canvas fill colors: ${colors.join(", ")}
Suggest exactly 5 harmonious styling options for the selected canvas element.
Return ONLY a JSON array and nothing else.

Schema:
[
  {
    "name": "Short style label",
    "usage": "What it is for",
    "targetTypes": ["shape", "text", "image", "video", "frame"],
    "style": {
      "fill": "#RRGGBB",
      "stroke": "#RRGGBB",
      "strokeWidth": 2,
      "opacity": 0.9,
      "shadowEnabled": true,
      "shadowColor": "rgba(0,0,0,0.3)",
      "shadowBlur": 10,
      "shadowOffsetX": 0,
      "shadowOffsetY": 6,
      "fontFamily": "Inter",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textAlign": "left"
    }
  }
]

Rules:
- Use valid hex colors for fill and stroke.
- Include typography fields only for text-oriented suggestions.
- Include at least one suggestion for shapes, one for text, and one for frame/image/video surfaces.
- Keep patches minimal and visually meaningful.`;

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
    return NextResponse.json({ suggestions: generateHarmony(colors) });
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "[]";

  try {
    const suggestions = validateSuggestions(JSON.parse(text));
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: generateHarmony(colors) });
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

function generateHarmony(colors: string[]): VibeSuggestion[] {
  const base = colors.find((c) => /^#[0-9a-f]{6}$/i.test(c)) ?? "#D3A5B1";
  const [h, s, l] = hexToHsl(base);
  return [
    {
      name: "Base Fill",
      usage: "Primary body color",
      targetTypes: ["shape", "image", "video", "frame"],
      style: { fill: hslToHex(h, s, l), opacity: 1 },
    },
    {
      name: "Accent Stroke",
      usage: "Border and outline",
      targetTypes: ["shape", "image", "video", "frame"],
      style: { stroke: hslToHex(h + 30, s, l), strokeWidth: 3 },
    },
    {
      name: "Contrast Pop",
      usage: "High-contrast emphasis",
      targetTypes: ["shape", "image", "video", "frame"],
      style: { fill: hslToHex(h + 180, s, l), stroke: hslToHex(h + 180, s, Math.max(16, l - 18)), opacity: 0.95 },
    },
    {
      name: "Soft Tint",
      usage: "Light background or surface",
      targetTypes: ["shape", "image", "video", "frame"],
      style: { fill: hslToHex(h, s * 0.4, Math.min(94, l + 30)), shadowEnabled: true, shadowColor: "rgba(0,0,0,0.18)", shadowBlur: 12, shadowOffsetX: 0, shadowOffsetY: 6 },
    },
    {
      name: "Readable Text",
      usage: "Typography and captions",
      targetTypes: ["text"],
      style: { fill: hslToHex(h, s, Math.max(12, l - 30)), fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textAlign: "left" },
    },
  ];
}

function validateSuggestions(value: unknown): VibeSuggestion[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as Partial<VibeSuggestion> & { style?: Partial<VibeStylePatch> };
    const targetTypes = Array.isArray(candidate.targetTypes)
      ? candidate.targetTypes.filter((type): type is TargetType =>
          type === "shape" || type === "text" || type === "image" || type === "video" || type === "frame"
        )
      : [];

    if (!candidate.name || !candidate.usage || targetTypes.length === 0 || !candidate.style) return [];

    const style: VibeStylePatch = {};
    if (typeof candidate.style.fill === "string" && /^#[0-9a-f]{6}$/i.test(candidate.style.fill)) style.fill = candidate.style.fill;
    if (typeof candidate.style.stroke === "string" && /^#[0-9a-f]{6}$/i.test(candidate.style.stroke)) style.stroke = candidate.style.stroke;
    if (typeof candidate.style.strokeWidth === "number" && Number.isFinite(candidate.style.strokeWidth)) style.strokeWidth = candidate.style.strokeWidth;
    if (typeof candidate.style.opacity === "number" && Number.isFinite(candidate.style.opacity)) style.opacity = candidate.style.opacity;
    if (typeof candidate.style.shadowEnabled === "boolean") style.shadowEnabled = candidate.style.shadowEnabled;
    if (typeof candidate.style.shadowColor === "string") style.shadowColor = candidate.style.shadowColor;
    if (typeof candidate.style.shadowBlur === "number" && Number.isFinite(candidate.style.shadowBlur)) style.shadowBlur = candidate.style.shadowBlur;
    if (typeof candidate.style.shadowOffsetX === "number" && Number.isFinite(candidate.style.shadowOffsetX)) style.shadowOffsetX = candidate.style.shadowOffsetX;
    if (typeof candidate.style.shadowOffsetY === "number" && Number.isFinite(candidate.style.shadowOffsetY)) style.shadowOffsetY = candidate.style.shadowOffsetY;
    if (typeof candidate.style.fontFamily === "string" && candidate.style.fontFamily.trim()) style.fontFamily = candidate.style.fontFamily;
    if (candidate.style.fontWeight === "normal" || candidate.style.fontWeight === "bold") style.fontWeight = candidate.style.fontWeight;
    if (candidate.style.fontStyle === "normal" || candidate.style.fontStyle === "italic") style.fontStyle = candidate.style.fontStyle;
    if (candidate.style.textAlign === "left" || candidate.style.textAlign === "center" || candidate.style.textAlign === "right") style.textAlign = candidate.style.textAlign;

    if (Object.keys(style).length === 0) return [];

    return [{
      name: candidate.name,
      usage: candidate.usage,
      targetTypes,
      style,
    }];
  });
}
