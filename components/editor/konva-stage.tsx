"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Arrow as KonvaArrow,
  Ellipse, Layer, Line as KonvaLine,
  Rect, RegularPolygon, Stage,
  Star as KonvaStar,
  Text as KonvaText, Transformer,
} from "react-konva";
import type Konva from "konva";
import { CANVAS_DIMENSIONS } from "@/lib/constants";
import { type CanvasElement, useWorkspaceStore } from "@/store/workspaceStore";

const STAGE_SCALE = 1.6;
const STAGE_WIDTH  = CANVAS_DIMENSIONS.width  / STAGE_SCALE;
const STAGE_HEIGHT = CANVAS_DIMENSIONS.height / STAGE_SCALE;

function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), max); }

function updateFromTransform(
  element: CanvasElement,
  node: Konva.Shape | Konva.Text,
  updateElement: (id: string, u: Partial<CanvasElement>) => void
) {
  const sx = node.scaleX(), sy = node.scaleY();
  node.scaleX(1); node.scaleY(1);
  updateElement(element.id, {
    x: node.x() * STAGE_SCALE,
    y: node.y() * STAGE_SCALE,
    width:  Math.max(40, node.width()  * sx * STAGE_SCALE),
    height: Math.max(28, node.height() * sy * STAGE_SCALE),
  });
}

function updateCenterShapeFromTransform(
  element: CanvasElement,
  node: Konva.Shape,
  updateElement: (id: string, u: Partial<CanvasElement>) => void
) {
  const sx = node.scaleX(), sy = node.scaleY();
  const nextW = Math.max(40, element.width  * sx);
  const nextH = Math.max(40, element.height * sy);
  node.scaleX(1); node.scaleY(1);
  updateElement(element.id, {
    x: (node.x() - (element.width  / STAGE_SCALE) / 2) * STAGE_SCALE,
    y: (node.y() - (element.height / STAGE_SCALE) / 2) * STAGE_SCALE,
    width: nextW, height: nextH,
  });
}

function shadowProps(element: CanvasElement) {
  const s = element.style;
  if (s.shadowEnabled) {
    return {
      shadowColor: s.shadowColor,
      shadowBlur: s.shadowBlur / STAGE_SCALE,
      shadowOffset: { x: s.shadowOffsetX / STAGE_SCALE, y: s.shadowOffsetY / STAGE_SCALE },
      shadowOpacity: 0.85,
    };
  }
  return {
    shadowColor: "rgba(20,32,28,0.12)",
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 5 },
    shadowOpacity: 0.7,
  };
}

function getKonvaFontStyle(el: CanvasElement): string {
  const parts = [
    el.style.fontWeight === "bold" ? "bold" : "",
    el.style.fontStyle === "italic" ? "italic" : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "normal";
}

export function KonvaStageWorkspace({ zoom = 1 }: { zoom?: number }) {
  const elements          = useWorkspaceStore((s) => s.elements);
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const selectElement     = useWorkspaceStore((s) => s.selectElement);
  const updateElement     = useWorkspaceStore((s) => s.updateElement);
  const canvasBackground  = useWorkspaceStore((s) => s.canvasBackground);

  const orderedElements = useMemo(
    () => [...elements].sort((a, b) => a.layerOrder - b.layerOrder),
    [elements]
  );

  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs       = useRef<Record<string, Konva.Shape | Konva.Text | null>>({});
  const editingRef     = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (!selectedElementId) { tr.nodes([]); tr.getLayer()?.batchDraw(); return; }
    const node = nodeRefs.current[selectedElementId];
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedElementId, orderedElements]);

  return (
    <>
      <div className="canvas-instructions">
        <span>Drag enabled for unlocked elements.</span>
        <span>Click to select · Double-click text to edit · Delete / Arrow keys</span>
      </div>

      <div className="konva-frame" style={{ width: STAGE_WIDTH * zoom, transition: "width 0.2s ease" }}>
        <Stage
          width={STAGE_WIDTH * zoom}
          height={STAGE_HEIGHT * zoom}
          scaleX={zoom} scaleY={zoom}
          className="konva-stage"
          onMouseDown={(e) => { if (e.target === e.target.getStage()) selectElement(null); }}
        >
          <Layer>
            {/* Canvas background */}
            <Rect x={0} y={0} width={STAGE_WIDTH} height={STAGE_HEIGHT}
              fill={canvasBackground} cornerRadius={20} />

            {orderedElements.map((element) => {
              const sel  = element.id === selectedElementId;
              const ew   = element.width  / STAGE_SCALE;
              const eh   = element.height / STAGE_SCALE;
              const cx   = element.x / STAGE_SCALE + ew / 2;
              const cy   = element.y / STAGE_SCALE + eh / 2;
              const common = {
                rotation: element.rotation,
                draggable: !element.locked,
                visible: element.visible,
                opacity: element.style.opacity,
                onClick: () => selectElement(element.id),
                onTap:   () => selectElement(element.id),
                onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
                  updateElement(element.id, {
                    x: e.target.x() * STAGE_SCALE,
                    y: e.target.y() * STAGE_SCALE,
                  });
                },
              };
              const centerDrag = {
                rotation: element.rotation,
                draggable: !element.locked,
                visible: element.visible,
                opacity: element.style.opacity,
                onClick: () => selectElement(element.id),
                onTap:   () => selectElement(element.id),
                onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
                  updateElement(element.id, {
                    x: (e.target.x() - ew / 2) * STAGE_SCALE,
                    y: (e.target.y() - eh / 2) * STAGE_SCALE,
                  });
                },
              };
              const sh = shadowProps(element);

              // ── Rectangle ──────────────────────────────────────
              if (element.type === "rectangle") {
                return (
                  <Rect key={element.id} {...common}
                    x={element.x / STAGE_SCALE} y={element.y / STAGE_SCALE}
                    width={ew} height={eh}
                    ref={(n) => { nodeRefs.current[element.id] = n; }}
                    fill={element.style.fill}
                    stroke={sel ? "#124b52" : element.style.stroke}
                    strokeWidth={sel ? 2.5 : element.style.strokeWidth}
                    cornerRadius={12}
                    {...sh}
                    onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Rect, updateElement)}
                  />
                );
              }

              // ── Circle ─────────────────────────────────────────
              if (element.type === "circle") {
                return (
                  <Ellipse key={element.id} {...centerDrag}
                    x={cx} y={cy}
                    radiusX={ew / 2} radiusY={eh / 2}
                    ref={(n) => { nodeRefs.current[element.id] = n; }}
                    fill={element.style.fill}
                    stroke={sel ? "#a25715" : element.style.stroke}
                    strokeWidth={sel ? 2.5 : element.style.strokeWidth}
                    {...sh}
                    onTransformEnd={(e) => updateCenterShapeFromTransform(element, e.target as Konva.Ellipse, updateElement)}
                  />
                );
              }

              // ── Triangle ───────────────────────────────────────
              if (element.type === "triangle") {
                return (
                  <RegularPolygon key={element.id} {...centerDrag}
                    x={cx} y={cy}
                    sides={3}
                    radius={Math.min(ew, eh) / 2}
                    ref={(n) => { nodeRefs.current[element.id] = n; }}
                    fill={element.style.fill}
                    stroke={sel ? "#5a2d8a" : element.style.stroke}
                    strokeWidth={sel ? 2.5 : element.style.strokeWidth}
                    {...sh}
                    onTransformEnd={(e) => updateCenterShapeFromTransform(element, e.target as Konva.RegularPolygon, updateElement)}
                  />
                );
              }

              // ── Star ───────────────────────────────────────────
              if (element.type === "star") {
                const r = Math.min(ew, eh) / 2;
                return (
                  <KonvaStar key={element.id} {...centerDrag}
                    x={cx} y={cy}
                    numPoints={5}
                    outerRadius={r}
                    innerRadius={r * 0.42}
                    ref={(n) => { nodeRefs.current[element.id] = n; }}
                    fill={element.style.fill}
                    stroke={sel ? "#8a7200" : element.style.stroke}
                    strokeWidth={sel ? 2.5 : element.style.strokeWidth}
                    {...sh}
                    onTransformEnd={(e) => updateCenterShapeFromTransform(element, e.target as Konva.Star, updateElement)}
                  />
                );
              }

              // ── Arrow ──────────────────────────────────────────
              if (element.type === "arrow") {
                return (
                  <KonvaArrow key={element.id}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE + eh / 2}
                    points={[0, 0, ew, 0]}
                    fill={element.style.stroke}
                    stroke={sel ? "#0d4e82" : element.style.stroke}
                    strokeWidth={sel ? element.style.strokeWidth + 1 : element.style.strokeWidth}
                    pointerLength={12 / STAGE_SCALE}
                    pointerWidth={10 / STAGE_SCALE}
                    rotation={element.rotation}
                    draggable={!element.locked}
                    visible={element.visible}
                    opacity={element.style.opacity}
                    hitStrokeWidth={16}
                    ref={(n) => { nodeRefs.current[element.id] = n as unknown as Konva.Shape; }}
                    onClick={() => selectElement(element.id)}
                    onTap={() => selectElement(element.id)}
                    onDragEnd={(e) => {
                      updateElement(element.id, {
                        x: e.target.x() * STAGE_SCALE,
                        y: (e.target.y() - eh / 2) * STAGE_SCALE,
                      });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const sx = node.scaleX();
                      node.scaleX(1);
                      updateElement(element.id, {
                        width: Math.max(40, ew * sx * STAGE_SCALE),
                        x: node.x() * STAGE_SCALE,
                        y: (node.y() - eh / 2) * STAGE_SCALE,
                      });
                    }}
                  />
                );
              }

              // ── Line ───────────────────────────────────────────
              if (element.type === "line") {
                return (
                  <KonvaLine key={element.id}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE + eh / 2}
                    points={[0, 0, ew, 0]}
                    stroke={sel ? "#2a5f6a" : element.style.stroke}
                    strokeWidth={sel ? element.style.strokeWidth + 1 : element.style.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    rotation={element.rotation}
                    draggable={!element.locked}
                    visible={element.visible}
                    opacity={element.style.opacity}
                    hitStrokeWidth={16}
                    ref={(n) => { nodeRefs.current[element.id] = n as unknown as Konva.Shape; }}
                    onClick={() => selectElement(element.id)}
                    onTap={() => selectElement(element.id)}
                    onDragEnd={(e) => {
                      updateElement(element.id, {
                        x: e.target.x() * STAGE_SCALE,
                        y: (e.target.y() - eh / 2) * STAGE_SCALE,
                      });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const sx = node.scaleX();
                      node.scaleX(1);
                      updateElement(element.id, {
                        width: Math.max(40, ew * sx * STAGE_SCALE),
                        x: node.x() * STAGE_SCALE,
                        y: (node.y() - eh / 2) * STAGE_SCALE,
                      });
                    }}
                  />
                );
              }

              // ── Text ───────────────────────────────────────────
              return (
                <KonvaText key={element.id} {...common}
                  x={element.x / STAGE_SCALE} y={element.y / STAGE_SCALE}
                  width={ew} height={eh}
                  ref={(n) => { nodeRefs.current[element.id] = n; }}
                  text={element.text ?? "Text element"}
                  fill={element.style.fill}
                  fontSize={Math.max(10, element.style.fontSize / STAGE_SCALE)}
                  fontFamily={element.style.fontFamily ?? "Inter"}
                  fontStyle={getKonvaFontStyle(element)}
                  align={element.style.textAlign ?? "left"}
                  padding={8}
                  dragBoundFunc={(pos) => ({
                    x: clamp(pos.x, 0, STAGE_WIDTH - ew),
                    y: clamp(pos.y, 0, STAGE_HEIGHT - eh),
                  })}
                  onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Text, updateElement)}
                  onDblClick={() => {
                    const node = nodeRefs.current[element.id] as Konva.Text;
                    if (!node) return;
                    const stageBox = node.getStage()!.container().getBoundingClientRect();
                    const absPos   = node.getAbsolutePosition();
                    const textarea = document.createElement("textarea");
                    editingRef.current = textarea;
                    textarea.value = element.text ?? "";
                    textarea.style.cssText = `
                      position:fixed;
                      top:${stageBox.top + absPos.y * zoom + 8}px;
                      left:${stageBox.left + absPos.x * zoom + 8}px;
                      width:${(ew - 16) * zoom}px;
                      min-height:${(eh - 16) * zoom}px;
                      font-size:${Math.max(10, element.style.fontSize / STAGE_SCALE) * zoom}px;
                      font-family:${element.style.fontFamily ?? "Inter"};
                      font-style:${element.style.fontStyle ?? "normal"};
                      font-weight:${element.style.fontWeight ?? "normal"};
                      text-align:${element.style.textAlign ?? "left"};
                      color:${element.style.fill};
                      background:rgba(255,253,248,0.97);
                      border:2px solid #0b6e66;
                      border-radius:8px;
                      padding:6px 8px;
                      resize:none;outline:none;z-index:9999;
                      line-height:1.5;
                      box-shadow:0 4px 24px rgba(11,110,102,0.18);
                    `;
                    document.body.appendChild(textarea);
                    textarea.focus(); textarea.select();
                    function finish() {
                      if (!editingRef.current) return;
                      updateElement(element.id, { text: textarea.value.trim() || "Text element" });
                      editingRef.current = null;
                      if (textarea.parentNode) {
                        textarea.parentNode.removeChild(textarea);
                      }
                    }
                    textarea.addEventListener("blur", finish);
                    textarea.addEventListener("keydown", (e) => {
                      if (e.key === "Escape") finish();
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); finish(); }
                    });
                  }}
                />
              );
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              borderStroke="#1f6f78"
              borderStrokeWidth={2}
              anchorFill="#fff"
              anchorStroke="#1f6f78"
              anchorSize={10}
              anchorCornerRadius={3}
              rotateAnchorCursor="grab"
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 36 || newBox.height < 28) return oldBox;
                return newBox;
              }}
              enabledAnchors={["top-left","top-right","bottom-left","bottom-right","middle-left","middle-right"]}
            />
          </Layer>
        </Stage>
      </div>
    </>
  );
}
