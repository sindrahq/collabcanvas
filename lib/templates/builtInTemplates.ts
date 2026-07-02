"use client";

import { CanvasElement } from "@/store/workspaceStore";
import { CanvasTemplate } from "@/types/integration";

export type TemplateCategory =
  | "All"
  | "Social Media"
  | "Business"
  | "Marketing"
  | "Creative";

export interface BuiltInTemplate extends CanvasTemplate {
  category: TemplateCategory;
  color: string; // accent color for the card preview
  aspectRatio: number; // width / height for preview sizing
}

const BASE_STYLE = {
  fontFamily: "Inter",
  fontStyle: "normal" as const,
  fontWeight: "normal" as const,
  textAlign: "left" as const,
  shadowEnabled: false,
  shadowBlur: 0,
  shadowColor: "transparent",
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  brightness: 0,
  contrast: 0,
  tint: 0,
};

function t(
  id: string,
  name: string,
  category: TemplateCategory,
  color: string,
  aspectRatio: number,
  elements: CanvasElement[]
): BuiltInTemplate {
  return {
    id: `builtin-${id}`,
    name,
    description: `${category} template`,
    category,
    color,
    aspectRatio,
    elements: elements.map((el, i) => ({
      ...el,
      layerOrder: i,
      layer_order: i,
    })),
    createdAt: new Date().toISOString(),
  };
}

// ── Helper: make a styled text element ───────────────────────────────────────
function txt(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  style: Partial<CanvasElement["style"]>,
  extra?: Partial<CanvasElement>
): CanvasElement {
  return {
    id: `txt-${id}`,
    name: text.slice(0, 20),
    label: text.slice(0, 20),
    type: "text",
    x,
    y,
    width,
    height,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 0,
    layer_order: 0,
    text,
    style: {
      fill: "#1e2523",
      stroke: "#2f2f2f",
      strokeWidth: 0,
      opacity: 1,
      fontSize: 16,
      ...BASE_STYLE,
      ...style,
    },
    ...extra,
  };
}

// ── Helper: make a rectangle ───────────────────────────────────────────────
function rect(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  extra?: Partial<CanvasElement>
): CanvasElement {
  return {
    id: `rect-${id}`,
    name: `Shape ${id}`,
    label: `Shape ${id}`,
    type: "rectangle",
    x,
    y,
    width,
    height,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 0,
    layer_order: 0,
    style: {
      fill,
      stroke: "transparent",
      strokeWidth: 0,
      opacity: 1,
      fontSize: 16,
      ...BASE_STYLE,
    },
    ...extra,
  };
}

// ── Helper: make a circle ──────────────────────────────────────────────────
function circ(
  id: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  extra?: Partial<CanvasElement>
): CanvasElement {
  return {
    id: `circ-${id}`,
    name: `Circle ${id}`,
    label: `Circle ${id}`,
    type: "circle",
    x,
    y,
    width: size,
    height: size,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 0,
    layer_order: 0,
    style: {
      fill,
      stroke: "transparent",
      strokeWidth: 0,
      opacity: 1,
      fontSize: 16,
      ...BASE_STYLE,
    },
    ...extra,
  };
}

// ── Helper: make a line ────────────────────────────────────────────────────
function line(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: string,
  strokeWidth: number,
  extra?: Partial<CanvasElement>
): CanvasElement {
  return {
    id: `line-${id}`,
    name: `Line ${id}`,
    label: `Line ${id}`,
    type: "line",
    x,
    y,
    width,
    height,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 0,
    layer_order: 0,
    style: {
      fill: "transparent",
      stroke,
      strokeWidth,
      opacity: 1,
      fontSize: 16,
      ...BASE_STYLE,
    },
    ...extra,
  };
}

// ── 1. Instagram Post ──────────────────────────────────────────────────────
const instagramPost: CanvasElement[] = [
  rect("bg", 100, 50, 500, 500, "#FF6B9D"),
  circ("accent1", 140, 90, 100, "#FFE66D"),
  circ("accent2", 420, 380, 80, "#4ECDC4"),
  circ("accent3", 480, 120, 40, "#FFFFFF", { style: { ...BASE_STYLE, fill: "#FFFFFF", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
  txt(
    "title",
    140,
    220,
    420,
    80,
    "YOUR TITLE",
    {
      fill: "#FFFFFF",
      fontSize: 52,
      fontWeight: "bold",
      textAlign: "center",
      shadowEnabled: true,
      shadowColor: "rgba(0,0,0,0.15)",
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
    }
  ),
  txt(
    "subtitle",
    140,
    310,
    420,
    50,
    "your caption here",
    {
      fill: "#FFFFFF",
      fontSize: 22,
      textAlign: "center",
    }
  ),
  txt(
    "handle",
    140,
    460,
    420,
    30,
    "@yourbrand",
    {
      fill: "rgba(255,255,255,0.85)",
      fontSize: 16,
      textAlign: "center",
    }
  ),
];

// ── 2. Instagram Story ─────────────────────────────────────────────────────
const instagramStory: CanvasElement[] = [
  rect("bg", 120, 30, 400, 700, "#667eea"),
  rect("top-bar", 120, 30, 400, 80, "#764ba2"),
  circ("avatar", 160, 55, 36, "#FFFFFF"),
  txt(
    "username",
    210,
    55,
    200,
    30,
    "yourbrand",
    { fill: "#FFFFFF", fontSize: 16, fontWeight: "bold" }
  ),
  txt(
    "title",
    160,
    200,
    320,
    80,
    "SWIPE UP",
    {
      fill: "#FFFFFF",
      fontSize: 48,
      fontWeight: "bold",
      textAlign: "center",
      shadowEnabled: true,
      shadowColor: "rgba(0,0,0,0.2)",
      shadowBlur: 12,
      shadowOffsetY: 6,
    }
  ),
  txt(
    "body",
    160,
    300,
    320,
    60,
    "Check out our latest collection and exclusive deals just for you!",
    {
      fill: "rgba(255,255,255,0.9)",
      fontSize: 18,
      textAlign: "center",
    }
  ),
  rect("cta-bg", 220, 600, 200, 56, "#FFFFFF"),
  txt(
    "cta",
    220,
    600,
    200,
    56,
    "SHOP NOW",
    {
      fill: "#764ba2",
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
    }
  ),
  circ("deco1", 340, 500, 20, "#FFFFFF", { style: { ...BASE_STYLE, fill: "#FFFFFF", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
  circ("deco2", 150, 450, 14, "#FFFFFF", { style: { ...BASE_STYLE, fill: "#FFFFFF", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
];

// ── 3. YouTube Thumbnail ───────────────────────────────────────────────────
const youtubeThumbnail: CanvasElement[] = [
  rect("bg", 80, 60, 640, 360, "#FF4500"),
  rect("left-accent", 80, 60, 180, 360, "#FF6347"),
  circ("big-circle", 500, 120, 140, "#FFFFFF", { style: { ...BASE_STYLE, fill: "#FFFFFF", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
  circ("small-circle", 160, 300, 60, "#FFE66D"),
  txt(
    "title",
    100,
    120,
    580,
    100,
    "CLICKBAIT TITLE",
    {
      fill: "#FFFFFF",
      fontSize: 56,
      fontWeight: "bold",
      textAlign: "left",
      shadowEnabled: true,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 16,
      shadowOffsetY: 6,
    }
  ),
  txt(
    "subtitle",
    100,
    230,
    400,
    40,
    "You won't believe this!",
    {
      fill: "rgba(255,255,255,0.95)",
      fontSize: 24,
    }
  ),
  rect("badge", 100, 300, 140, 36, "#FFFFFF"),
  txt(
    "badge-text",
    100,
    300,
    140,
    36,
    "NEW VIDEO",
    {
      fill: "#FF4500",
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
    }
  ),
];

// ── 4. Business Card ───────────────────────────────────────────────────────
const businessCard: CanvasElement[] = [
  rect("bg", 100, 60, 520, 300, "#FFFFFF", {
    style: {
      fill: "#FFFFFF",
      stroke: "#e8e8e8",
      strokeWidth: 1,
      opacity: 1,
      fontSize: 16,
      ...BASE_STYLE,
    },
  }),
  rect("accent-bar", 100, 60, 10, 300, "#0B6E66"),
  circ("logo", 140, 110, 60, "#0B6E66"),
  txt(
    "logo-text",
    140,
    110,
    60,
    60,
    "JD",
    {
      fill: "#FFFFFF",
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
    }
  ),
  txt(
    "name",
    230,
    90,
    300,
    50,
    "JOHN DOE",
    {
      fill: "#1a1a1a",
      fontSize: 32,
      fontWeight: "bold",
    }
  ),
  txt(
    "title",
    230,
    140,
    300,
    30,
    "Product Designer",
    {
      fill: "#666666",
      fontSize: 18,
    }
  ),
  line("divider", 230, 185, 200, 2, "#e0e0e0", 2),
  txt(
    "email",
    230,
    210,
    300,
    24,
    "john@example.com",
    {
      fill: "#888888",
      fontSize: 14,
    }
  ),
  txt(
    "phone",
    230,
    240,
    300,
    24,
    "+1 234 567 890",
    {
      fill: "#888888",
      fontSize: 14,
    }
  ),
  txt(
    "website",
    230,
    270,
    300,
    24,
    "www.johndoe.com",
    {
      fill: "#0B6E66",
      fontSize: 14,
    }
  ),
  circ("deco", 500, 280, 30, "#0B6E66", { style: { ...BASE_STYLE, fill: "#0B6E66", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
];

// ── 5. Presentation Slide ──────────────────────────────────────────────────
const presentationSlide: CanvasElement[] = [
  rect("bg", 80, 60, 800, 450, "#f8f9fa"),
  rect("accent-bar", 80, 60, 800, 8, "#1a73e8"),
  rect("side-accent", 80, 60, 6, 450, "#1a73e8"),
  txt(
    "title",
    120,
    110,
    700,
    60,
    "Slide Title",
    {
      fill: "#1a1a1a",
      fontSize: 44,
      fontWeight: "bold",
    }
  ),
  txt(
    "bullet1",
    140,
    200,
    660,
    36,
    "•  First key point goes here",
    {
      fill: "#444444",
      fontSize: 20,
    }
  ),
  txt(
    "bullet2",
    140,
    250,
    660,
    36,
    "•  Second supporting detail",
    {
      fill: "#444444",
      fontSize: 20,
    }
  ),
  txt(
    "bullet3",
    140,
    300,
    660,
    36,
    "•  Third important takeaway",
    {
      fill: "#444444",
      fontSize: 20,
    }
  ),
  txt(
    "page",
    760,
    470,
    60,
    24,
    "1",
    {
      fill: "#888888",
      fontSize: 16,
      textAlign: "right",
    }
  ),
  circ("deco", 760, 90, 20, "#1a73e8", { style: { ...BASE_STYLE, fill: "#1a73e8", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
];

// ── 6. Event Flyer ─────────────────────────────────────────────────────────
const eventFlyer: CanvasElement[] = [
  rect("bg", 100, 30, 500, 700, "#1a1a2e"),
  rect("top-accent", 100, 30, 500, 140, "#e94560"),
  txt(
    "event-type",
    130,
    60,
    300,
    28,
    "LIVE EVENT",
    {
      fill: "#FFFFFF",
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "left",
    }
  ),
  txt(
    "title",
    130,
    200,
    440,
    80,
    "EVENT NAME",
    {
      fill: "#FFFFFF",
      fontSize: 44,
      fontWeight: "bold",
      textAlign: "left",
      shadowEnabled: true,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 12,
      shadowOffsetY: 4,
    }
  ),
  txt(
    "date",
    130,
    300,
    440,
    36,
    "SATURDAY, JAN 15",
    {
      fill: "#e94560",
      fontSize: 22,
      fontWeight: "bold",
    }
  ),
  txt(
    "time",
    130,
    350,
    440,
    28,
    "7:00 PM — 11:00 PM",
    {
      fill: "rgba(255,255,255,0.85)",
      fontSize: 18,
    }
  ),
  line("sep", 130, 400, 300, 2, "rgba(255,255,255,0.2)", 2),
  txt(
    "location",
    130,
    420,
    440,
    28,
    "123 Main Street, New York",
    {
      fill: "rgba(255,255,255,0.7)",
      fontSize: 16,
    }
  ),
  rect("cta-bg", 150, 520, 300, 60, "#e94560"),
  txt(
    "cta",
    150,
    520,
    300,
    60,
    "GET TICKETS",
    {
      fill: "#FFFFFF",
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
    }
  ),
  circ("deco1", 460, 480, 30, "#e94560", { style: { ...BASE_STYLE, fill: "#e94560", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
  circ("deco2", 120, 620, 20, "#e94560", { style: { ...BASE_STYLE, fill: "#e94560", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
];

// ── 7. Quote Card ──────────────────────────────────────────────────────────
const quoteCard: CanvasElement[] = [
  rect("bg", 100, 50, 500, 500, "#f5f5f5"),
  rect("accent-top", 100, 50, 500, 6, "#333333"),
  txt(
    "quote-mark",
    140,
    80,
    100,
    80,
    '"',
    {
      fill: "#dddddd",
      fontSize: 100,
      fontWeight: "bold",
    }
  ),
  txt(
    "quote",
    140,
    180,
    420,
    160,
    "Be the change you wish to see in the world. Start small, think big, and never give up on what you believe in.",
    {
      fill: "#333333",
      fontSize: 24,
      fontStyle: "italic",
    }
  ),
  line("sep", 140, 360, 80, 3, "#333333", 3),
  txt(
    "author",
    140,
    380,
    300,
    30,
    "— Mahatma Gandhi",
    {
      fill: "#888888",
      fontSize: 18,
    }
  ),
  circ("deco", 440, 420, 80, "#333333", { style: { ...BASE_STYLE, fill: "#333333", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 16 } }),
];

// ── 8. Minimalist Product ──────────────────────────────────────────────────
const minimalistProduct: CanvasElement[] = [
  rect("bg", 100, 50, 500, 500, "#fafafa"),
  rect("product-box", 150, 100, 300, 300, "#e8e8e8", {
    style: {
      fill: "#e8e8e8",
      stroke: "#cccccc",
      strokeWidth: 1,
      opacity: 1,
      fontSize: 16,
      ...BASE_STYLE,
    },
  }),
  txt(
    "placeholder",
    150,
    220,
    300,
    40,
    "PRODUCT IMAGE",
    {
      fill: "#999999",
      fontSize: 18,
      textAlign: "center",
    }
  ),
  txt(
    "name",
    150,
    430,
    300,
    40,
    "PRODUCT NAME",
    {
      fill: "#1a1a1a",
      fontSize: 26,
      fontWeight: "bold",
    }
  ),
  txt(
    "price",
    150,
    470,
    120,
    36,
    "$49.99",
    {
      fill: "#e94560",
      fontSize: 24,
      fontWeight: "bold",
    }
  ),
  txt(
    "desc",
    150,
    510,
    300,
    28,
    "Minimalist description text",
    {
      fill: "#666666",
      fontSize: 14,
    }
  ),
  rect("cta", 320, 465, 140, 44, "#1a1a1a"),
  txt(
    "cta-text",
    320,
    465,
    140,
    44,
    "BUY NOW",
    {
      fill: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    }
  ),
];

// ── 9. Meme Format ─────────────────────────────────────────────────────────
const memeFormat: CanvasElement[] = [
  rect("bg", 100, 50, 500, 500, "#FFFFFF"),
  rect("img-placeholder", 100, 50, 500, 380, "#dddddd", {
    style: {
      fill: "#dddddd",
      stroke: "#bbbbbb",
      strokeWidth: 2,
      opacity: 1,
      fontSize: 16,
      ...BASE_STYLE,
    },
  }),
  txt(
    "img-label",
    100,
    210,
    500,
    40,
    "IMAGE HERE",
    {
      fill: "#999999",
      fontSize: 20,
      textAlign: "center",
    }
  ),
  txt(
    "top-text",
    120,
    70,
    460,
    60,
    "TOP TEXT",
    {
      fill: "#FFFFFF",
      fontSize: 40,
      fontWeight: "bold",
      textAlign: "center",
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlur: 6,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    }
  ),
  txt(
    "bottom-text",
    120,
    340,
    460,
    60,
    "BOTTOM TEXT",
    {
      fill: "#FFFFFF",
      fontSize: 40,
      fontWeight: "bold",
      textAlign: "center",
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlur: 6,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    }
  ),
];

// ── 10. Twitter/X Post ────────────────────────────────────────────────────
const twitterPost: CanvasElement[] = [
  rect("bg", 80, 50, 600, 340, "#FFFFFF"),
  rect("top-bar", 80, 50, 600, 60, "#f7f9fa"),
  circ("avatar", 110, 65, 36, "#1da1f2"),
  txt(
    "name",
    160,
    60,
    200,
    26,
    "User Name",
    {
      fill: "#0f1419",
      fontSize: 16,
      fontWeight: "bold",
    }
  ),
  txt(
    "handle",
    160,
    84,
    200,
    22,
    "@username",
    {
      fill: "#536471",
      fontSize: 14,
    }
  ),
  txt(
    "body",
    110,
    130,
    540,
    120,
    "Your tweet content goes here. Make it engaging, concise, and shareable. The best tweets spark conversations!",
    {
      fill: "#0f1419",
      fontSize: 18,
    }
  ),
  line("sep", 110, 270, 540, 2, "#eff3f4", 1),
  rect("bottom-bar", 80, 290, 600, 40, "#f7f9fa"),
  txt(
    "stats",
    110,
    290,
    300,
    40,
    "12 Retweets    48 Likes    5 Bookmarks",
    {
      fill: "#536471",
      fontSize: 14,
    }
  ),
  circ("badge", 640, 70, 12, "#1da1f2"),
];

// ── Export all templates ───────────────────────────────────────────────────
export const builtInTemplates: BuiltInTemplate[] = [
  t("instagram-post", "Instagram Post", "Social Media", "#FF6B9D", 1, instagramPost),
  t("instagram-story", "Instagram Story", "Social Media", "#667eea", 400 / 700, instagramStory),
  t("youtube-thumb", "YouTube Thumbnail", "Social Media", "#FF4500", 640 / 360, youtubeThumbnail),
  t("twitter-post", "Twitter / X Post", "Social Media", "#1da1f2", 600 / 340, twitterPost),
  t("business-card", "Business Card", "Business", "#0B6E66", 520 / 300, businessCard),
  t("presentation", "Presentation Slide", "Business", "#1a73e8", 800 / 450, presentationSlide),
  t("event-flyer", "Event Flyer", "Marketing", "#e94560", 500 / 700, eventFlyer),
  t("quote-card", "Quote Card", "Creative", "#333333", 1, quoteCard),
  t("minimalist-product", "Minimalist Product", "Creative", "#1a1a1a", 1, minimalistProduct),
  t("meme", "Meme Format", "Creative", "#333333", 1, memeFormat),
];

export const templateCategories: TemplateCategory[] = [
  "All",
  "Social Media",
  "Business",
  "Marketing",
  "Creative",
];
