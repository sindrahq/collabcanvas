"use client";

import { CanvasElement, CanvasElementType } from "@/store/workspaceStore";

interface TemplatePreviewProps {
  elements: CanvasElement[];
  width?: number;
  height?: number;
  className?: string;
}

export default function TemplatePreview({
  elements,
  width = 200,
  height = 160,
  className = "",
}: TemplatePreviewProps) {
  // Find bounds of all elements
  if (elements.length === 0) {
    return (
      <div
        className={`bg-gray-100 ${className}`}
        style={{ width, height, borderRadius: 6 }}
      />
    );
  }

  const minX = Math.min(...elements.map((e) => e.x));
  const minY = Math.min(...elements.map((e) => e.y));
  const maxX = Math.max(...elements.map((e) => e.x + e.width));
  const maxY = Math.max(...elements.map((e) => e.y + e.height));

  const contentW = Math.max(maxX - minX, 1);
  const contentH = Math.max(maxY - minY, 1);

  // Scale to fit preview while preserving aspect ratio
  const scale = Math.min(
    (width - 16) / contentW,
    (height - 16) / contentH
  );

  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const offsetX = (width - scaledW) / 2 - minX * scale;
  const offsetY = (height - scaledH) / 2 - minY * scale;

  return (
    <div
      className={`relative overflow-hidden bg-gray-50/50 ${className}`}
      style={{ width, height, borderRadius: 6 }}
    >
      {elements.map((el) => (
        <PreviewElement
          key={el.id}
          element={el}
          scale={scale}
          offsetX={offsetX}
          offsetY={offsetY}
        />
      ))}
    </div>
  );
}

function PreviewElement({
  element,
  scale,
  offsetX,
  offsetY,
}: {
  element: CanvasElement;
  scale: number;
  offsetX: number;
  offsetY: number;
}) {
  const { type, x, y, width, height, rotation, style, text } = element;
  const left = x * scale + offsetX;
  const top = y * scale + offsetY;
  const w = width * scale;
  const h = height * scale;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: Math.round(left),
    top: Math.round(top),
    width: Math.max(Math.round(w), 1),
    height: Math.max(Math.round(h), 1),
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    opacity: style.opacity ?? 1,
  };

  switch (type) {
    case "rectangle":
    case "frame":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.fill || "#ccc",
            border: style.strokeWidth && style.stroke !== "transparent"
              ? `${Math.max(Math.round(style.strokeWidth * scale), 1)}px solid ${style.stroke}`
              : undefined,
            borderRadius: 2,
          }}
        />
      );
    case "circle":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.fill || "#ccc",
            borderRadius: "50%",
            border: style.strokeWidth && style.stroke !== "transparent"
              ? `${Math.max(Math.round(style.strokeWidth * scale), 1)}px solid ${style.stroke}`
              : undefined,
          }}
        />
      );
    case "text":
      return (
        <div
          style={{
            ...baseStyle,
            color: style.fill || "#333",
            fontSize: Math.max(Math.round((style.fontSize || 16) * scale), 6),
            fontWeight: style.fontWeight === "bold" ? 700 : 400,
            fontStyle: style.fontStyle === "italic" ? "italic" : "normal",
            textAlign: style.textAlign || "left",
            fontFamily: style.fontFamily || "Inter",
            lineHeight: 1.2,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            justifyContent:
              style.textAlign === "center"
                ? "center"
                : style.textAlign === "right"
                ? "flex-end"
                : "flex-start",
          }}
        >
          {text || "Text"}
        </div>
      );
    case "line":
    case "arrow":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.stroke || "#666",
            height: Math.max(Math.round((style.strokeWidth || 2) * scale), 1),
          }}
        />
      );
    case "triangle":
      return (
        <div
          style={{
            ...baseStyle,
            width: 0,
            height: 0,
            borderLeft: `${Math.round(w / 2)}px solid transparent`,
            borderRight: `${Math.round(w / 2)}px solid transparent`,
            borderBottom: `${Math.round(h)}px solid ${style.fill || "#ccc"}`,
            backgroundColor: "transparent",
          }}
        />
      );
    case "diamond":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.fill || "#ccc",
            transform: `rotate(45deg)${rotation ? ` rotate(${rotation}deg)` : ""}`,
            borderRadius: 2,
          }}
        />
      );
    case "image":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.fill || "#e0e0e0",
            border: `1px dashed #bbb`,
            borderRadius: 2,
          }}
        />
      );
    case "video":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.fill || "#222",
            borderRadius: 2,
          }}
        />
      );
    case "star":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.fill || "#ccc",
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
        />
      );
    default:
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: style.fill || "#ccc",
            borderRadius: type === "hexagon" || type === "octagon" ? 2 : 4,
            opacity: 0.5,
          }}
        />
      );
  }
}
