"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Arrow as KonvaArrow,
  Circle,
  Ellipse,
  Layer,
  Line as KonvaLine,
  Rect,
  RegularPolygon,
  Stage,
  Star as KonvaStar,
  Text as KonvaText,
  Transformer,
  Path as KonvaPath,
} from "react-konva";
import { type CanvasElement, useWorkspaceStore } from "@/store/workspaceStore";
import type { PresenceMeta } from "@/lib/collaboration";
import Konva from "konva";
import { KonvaImage } from "./konva-image";
import { KonvaVideo } from "./konva-video";
import { CustomContextMenu } from "./context-menu";

// Returns [tEnter, tExit] where segment AB intersects circle (cx,cy,r), or null if no intersection.
function segmentCircleTs(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, r: number,
): [number, number] | null {
  const dx = bx - ax, dy = by - ay;
  const fx = ax - cx, fy = ay - cy;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = Math.max(0, (-b - sq) / (2 * a));
  const t2 = Math.min(1, (-b + sq) / (2 * a));
  if (t1 >= t2) return null;
  return [t1, t2];
}

// Erase the portion of a pencil stroke that falls inside the eraser circle.
// Returns surviving segments as point arrays (canvas coords).
function eraseFromStroke(pts: number[], cx: number, cy: number, r: number): number[][] {
  const n = pts.length / 2;
  if (n < 2) return [];

  const isIn = (x: number, y: number) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

  type MaybePoint = [number, number] | null;
  const out: MaybePoint[] = [];

  // Add first point if outside circle
  if (!isIn(pts[0], pts[1])) out.push([pts[0], pts[1]]);

  for (let i = 0; i < n - 1; i++) {
    const ax = pts[i * 2], ay = pts[i * 2 + 1];
    const bx = pts[(i + 1) * 2], by = pts[(i + 1) * 2 + 1];
    const aIn = isIn(ax, ay), bIn = isIn(bx, by);
    const ints = segmentCircleTs(ax, ay, bx, by, cx, cy, r);

    if (!aIn && !bIn) {
      if (!ints) {
        out.push([bx, by]);
      } else {
        const [t1, t2] = ints;
        // Segment passes through circle: keep A-entry and exit-B as separate pieces
        out.push([ax + t1 * (bx - ax), ay + t1 * (by - ay)]);
        out.push(null); // split
        out.push([ax + t2 * (bx - ax), ay + t2 * (by - ay)]);
        out.push([bx, by]);
      }
    } else if (!aIn && bIn) {
      // Enter circle before reaching B — cut at entry, then break
      if (ints) out.push([ax + ints[0] * (bx - ax), ay + ints[0] * (by - ay)]);
      out.push(null);
    } else if (aIn && !bIn) {
      // Exit circle before reaching B — resume from exit point
      if (ints) out.push([ax + ints[1] * (bx - ax), ay + ints[1] * (by - ay)]);
      out.push([bx, by]);
    }
    // aIn && bIn: both inside, skip entirely
  }

  // Split at null markers into segments
  const segments: number[][] = [];
  let seg: number[] = [];
  for (const p of out) {
    if (!p) { if (seg.length >= 4) segments.push(seg); seg = []; }
    else seg.push(p[0], p[1]);
  }
  if (seg.length >= 4) segments.push(seg);
  return segments;
}

const PENCIL_CURSOR =`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='2.5' fill='%231e1e1e'/%3E%3Cline x1='12' y1='1' x2='12' y2='8' stroke='%231e1e1e' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='12' y1='16' x2='12' y2='23' stroke='%231e1e1e' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='1' y1='12' x2='8' y2='12' stroke='%231e1e1e' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='16' y1='12' x2='23' y2='12' stroke='%231e1e1e' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") 12 12, crosshair`;

const STAGE_SCALE = 1.6;

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(textarea.scrollHeight, 48)}px`;
}

function updateFromTransform(
  element: CanvasElement,
  node: Konva.Shape | Konva.Text,
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
) {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  node.scaleX(1);
  node.scaleY(1);

  updateElement(element.id, {
    x: node.x() * STAGE_SCALE,
    y: node.y() * STAGE_SCALE,
    width: Math.max(40, node.width() * scaleX * STAGE_SCALE),
    height: Math.max(28, node.height() * scaleY * STAGE_SCALE),
  });
}

function updateCenterShapeFromTransform(
  element: CanvasElement,
  node: Konva.Shape,
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
) {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  const nextWidth = Math.max(40, element.width * scaleX);
  const nextHeight = Math.max(40, element.height * scaleY);

  node.scaleX(1);
  node.scaleY(1);

  updateElement(element.id, {
    x: (node.x() - element.width / STAGE_SCALE / 2) * STAGE_SCALE,
    y: (node.y() - element.height / STAGE_SCALE / 2) * STAGE_SCALE,
    width: nextWidth,
    height: nextHeight,
  });
}

function shadowProps(element: CanvasElement) {
  const style = element.style;
  if (style.shadowEnabled) {
    return {
      shadowColor: style.shadowColor,
      shadowBlur: style.shadowBlur / STAGE_SCALE,
      shadowOffset: {
        x: style.shadowOffsetX / STAGE_SCALE,
        y: style.shadowOffsetY / STAGE_SCALE,
      },
      shadowOpacity: 0.85,
    };
  }

  return {
    shadowColor: "rgba(20, 32, 28, 0.12)",
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 5 },
    shadowOpacity: 0.7,
  };
}

function getKonvaFontStyle(element: CanvasElement) {
  const parts = [
    element.style.fontWeight === "bold" ? "bold" : "",
    element.style.fontStyle === "italic" ? "italic" : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : "normal";
}

export function KonvaStageWorkspace({
  zoom = 1,
  remoteCursors,
  presences,
}: {
  zoom?: number;
  remoteCursors?: Record<string, { x: number; y: number; updatedAt: number }>;
  presences?: Record<string, PresenceMeta>;
}) {
  const elements = useWorkspaceStore((state) => state.elements);
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const selectElement = useWorkspaceStore((state) => state.selectElement);
  const updateElement = useWorkspaceStore((state) => state.updateElement);
  const canvasBackground = useWorkspaceStore((state) => state.canvasBackground);
  const canvasDimensions = useWorkspaceStore((state) => state.canvasDimensions);
  const canEdit = useWorkspaceStore((state) => state.canEdit);
  const snapToGrid = useWorkspaceStore((state) => state.snapToGrid);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const addPencilElement = useWorkspaceStore((state) => state.addPencilElement);
  const deleteElement = useWorkspaceStore((state) => state.deleteElement);
  const partialErasePencilStroke = useWorkspaceStore((state) => state.partialErasePencilStroke);
  const eraserSize = useWorkspaceStore((state) => state.eraserSize);

  const eraserCursor = useMemo(() => {
    const r = Math.max(4, eraserSize);
    const size = r * 2 + 4;
    const c = r + 2;
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Ccircle cx='${c}' cy='${c}' r='${r}' fill='rgba(255%2C255%2C255%2C0.15)' stroke='%231e1e1e' stroke-width='1.5' stroke-dasharray='3%2C2'/%3E%3C/svg%3E") ${c} ${c}, crosshair`;
  }, [eraserSize]);

  const STAGE_WIDTH  = canvasDimensions.width  / STAGE_SCALE;
  const STAGE_HEIGHT = canvasDimensions.height / STAGE_SCALE;

  const orderedElements = useMemo(
    () => [...elements].sort((left, right) => left.layerOrder - right.layerOrder),
    [elements]
  );

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const nodeRefs = useRef<Record<string, Konva.Shape | Konva.Text | null>>({});
  const editingRef = useRef<HTMLTextAreaElement | null>(null);
  const isErasingRef = useRef(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<number[] | null>(null);

  function eraseAtCurrentPos() {
    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    if (!stage || !pos) return;

    const eraserX = pos.x * STAGE_SCALE;
    const eraserY = pos.y * STAGE_SCALE;
    const radius = eraserSize * STAGE_SCALE;

    for (const element of elements) {
      if (element.type !== "pencil" || !element.points || element.points.length < 4) continue;
      const segments = eraseFromStroke(element.points, eraserX, eraserY, radius);
      // Only update if something actually changed
      const totalSegPts = segments.reduce((s, seg) => s + seg.length, 0);
      if (totalSegPts !== element.points.length) {
        partialErasePencilStroke(element.id, segments);
      }
    }
  }

  const getStagePos = useCallback((event: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = event.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x * STAGE_SCALE, y: pos.y * STAGE_SCALE };
  }, []);

  // Context Menu State
  const [menu, setMenu] = useState<{ x: number, y: number, visible: boolean } | null>(null);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);

  const handleContextAction = (action: string) => {
    if (!selectedElementId) return;
    
    switch (action) {
      case "duplicate":
        duplicateSelectedElement();
        break;
      case "delete":
        deleteSelectedElement();
        break;
      case "lock":
        const el = elements.find(e => e.id === selectedElementId);
        if (el) updateElement(el.id, { locked: !el.locked });
        break;
      case "forward":
        const maxLayer = Math.max(...elements.map(e => e.layerOrder), 0);
        updateElement(selectedElementId, { layerOrder: maxLayer + 1 });
        break;
      case "backward":
        const minLayer = Math.min(...elements.map(e => e.layerOrder), 0);
        updateElement(selectedElementId, { layerOrder: minLayer - 1 });
        break;
      case "group-frame":
        const target = elements.find(e => e.id === selectedElementId);
        if (target) {
          const frameId = `frame-${Math.random().toString(36).substring(2, 11)}`;
          useWorkspaceStore.getState().addElement("frame", {
            id: frameId,
            x: target.x - 20,
            y: target.y - 20,
            width: target.width + 40,
            height: target.height + 40,
          });
          setTimeout(() => updateElement(target.id, { parentId: frameId }), 60);
        }
        break;
      case "save-template":
        const elToSave = elements.find(e => e.id === selectedElementId);
        if (elToSave) {
          const name = prompt("Enter template name:", elToSave.name) || "New Template";
          // If it's a frame, save it and its children
          const elementsToSave = [elToSave];
          if (elToSave.type === 'frame') {
            const children = elements.filter(child => child.parentId === elToSave.id);
            elementsToSave.push(...children);
          }
          
          import("@/lib/services/templateService").then(({ templateService }) => {
            templateService.save({
              name,
              elements: elementsToSave,
              user_id: "current-user", // In a real app, get from auth
            });
            alert("Template saved!");
          });
        }
        break;
    }
  };

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const selectedElement = elements.find(e => e.id === selectedElementId);
    if (!canEdit || !selectedElementId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = nodeRefs.current[selectedElementId];
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [canEdit, orderedElements, selectedElementId, elements]);

  // Apply filters to shapes
  useEffect(() => {
    orderedElements.forEach((element) => {
      const node = nodeRefs.current[element.id];
      if (!node) return;

      const hasFilters = element.style.brightness !== 0 || element.style.contrast !== 0;
      
      if (hasFilters) {
        node.filters([Konva.Filters.Brighten, Konva.Filters.Contrast]);
        node.brightness(element.style.brightness);
        node.contrast(element.style.contrast);
        node.cache();
      } else {
        node.filters([]);
        node.clearCache();
      }
    });
  }, [orderedElements]);

  return (
    <div className="konva-frame">
        <Stage
          ref={stageRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="konva-stage"
          style={{
            cursor: activeTool === "pencil" ? PENCIL_CURSOR
              : activeTool === "eraser" ? eraserCursor
              : "default",
          }}
          onMouseDown={(event) => {
            if (activeTool === "eraser" && canEdit) {
              isErasingRef.current = true;
              eraseAtCurrentPos();
              return;
            }
            if (activeTool === "pencil" && canEdit) {
              const pos = getStagePos(event);
              if (pos) setDrawingPoints([pos.x, pos.y]);
              return;
            }
            if (event.target === event.target.getStage()) {
              selectElement(null);
            }
          }}
          onMouseMove={(event) => {
            if (activeTool === "eraser" && isErasingRef.current && canEdit) {
              eraseAtCurrentPos();
              return;
            }
            if (activeTool !== "pencil" || !drawingPoints || !canEdit) return;
            const pos = getStagePos(event);
            if (pos) setDrawingPoints((prev) => prev ? [...prev, pos.x, pos.y] : null);
          }}
          onMouseUp={() => {
            if (activeTool === "eraser") {
              isErasingRef.current = false;
              return;
            }
            if (activeTool !== "pencil" || !drawingPoints || !canEdit) return;
            if (drawingPoints.length >= 4) addPencilElement(drawingPoints);
            setDrawingPoints(null);
          }}
          onMouseLeave={() => {
            isErasingRef.current = false;
            if (activeTool === "pencil" && drawingPoints && drawingPoints.length >= 4) {
              addPencilElement(drawingPoints);
            }
            setDrawingPoints(null);
          }}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            const stage = e.target.getStage();
            if (!stage) return;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            if (e.target !== stage) {
              const id = (e.target.attrs as any).id || (e.target.parent?.attrs as any).id;
              if (id) selectElement(id);
            } else {
              selectElement(null);
            }
            setMenu({ x: e.evt.clientX, y: e.evt.clientY, visible: true });
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              fill={canvasBackground}
              cornerRadius={20}
              onClick={() => selectElement(null)}
              onTap={() => selectElement(null)}
            />

            {orderedElements.map((element) => {
              const elementWidth = element.width / STAGE_SCALE;
              const elementHeight = element.height / STAGE_SCALE;
              const centerX = element.x / STAGE_SCALE + elementWidth / 2;
              const centerY = element.y / STAGE_SCALE + elementHeight / 2;
              const sharedShadow = shadowProps(element);

              const commonProps = {
                rotation: element.rotation,
                draggable: canEdit && !element.locked,
                visible: element.visible,
                opacity: element.style.opacity,
                dragBoundFunc: (pos: any) => {
                  return {
                    x: snapToGrid ? Math.round(pos.x / 20) * 20 : pos.x,
                    y: snapToGrid ? Math.round(pos.y / 20) * 20 : pos.y,
                  };
                },
                onClick: () => selectElement(element.id),
                onTap: () => selectElement(element.id),
                onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
                  if (!canEdit) return;
                  const stage = event.target.getStage();
                  const pos = stage?.getPointerPosition();
                  
                  // Check if dropped over a frame
                  const hoverFrame = elements.find(el => 
                    el.type === 'frame' && el.id !== element.id &&
                    pos && 
                    (pos.x * STAGE_SCALE) >= el.x && (pos.x * STAGE_SCALE) <= el.x + el.width &&
                    (pos.y * STAGE_SCALE) >= el.y && (pos.y * STAGE_SCALE) <= el.y + el.height
                  );

                  updateElement(element.id, {
                    x: event.target.x() * STAGE_SCALE,
                    y: event.target.y() * STAGE_SCALE,
                    parentId: hoverFrame?.id
                  });
                },
              };

              const centerDragProps = {
                rotation: element.rotation,
                draggable: canEdit && !element.locked,
                visible: element.visible,
                opacity: element.style.opacity,
                dragBoundFunc: (pos: any) => {
                  return {
                    x: snapToGrid ? Math.round(pos.x / 20) * 20 : pos.x,
                    y: snapToGrid ? Math.round(pos.y / 20) * 20 : pos.y,
                  };
                },
                onClick: () => selectElement(element.id),
                onTap: () => selectElement(element.id),
                onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
                  if (!canEdit) return;
                  updateElement(element.id, {
                    x: (event.target.x() - elementWidth / 2) * STAGE_SCALE,
                    y: (event.target.y() - elementHeight / 2) * STAGE_SCALE,
                  });
                },
              };


              if (element.type === "rectangle") {
                return (
                  <Rect
                    key={element.id}
                    {...commonProps}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE}
                    width={elementWidth}
                    height={elementHeight}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    fill={element.style.fill}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    cornerRadius={12}
                    {...sharedShadow}
                    onTransformEnd={(event) =>
                      updateFromTransform(element, event.target as Konva.Rect, updateElement)
                    }
                  />
                );
              }
              
              if (element.type === "frame") {
                return (
                  <Rect
                    key={element.id}
                    {...commonProps}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE}
                    width={elementWidth}
                    height={elementHeight}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    fill={element.style.fill}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    cornerRadius={16}
                    {...sharedShadow}
                    onTransformEnd={(event) =>
                      updateFromTransform(element, event.target as Konva.Rect, updateElement)
                    }
                  />
                );
              }

              if (element.type === "image" && element.imageUrl) {
                return (
                  <KonvaImage
                    key={element.id}
                    {...commonProps}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE}
                    width={elementWidth}
                    height={elementHeight}
                    imageUrl={element.imageUrl}
                    ref={(node: Konva.Image | null) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    {...sharedShadow}
                    onTransformEnd={(event: Konva.KonvaEventObject<Event>) =>
                      updateFromTransform(element, event.target as Konva.Image, updateElement)
                    }
                  />
                );
              }

              if (element.type === "video") {
                if ((element as any).videoUrl) {
                  return (
                    <KonvaVideo
                      key={element.id}
                      {...commonProps}
                      x={element.x / STAGE_SCALE}
                      y={element.y / STAGE_SCALE}
                      width={elementWidth}
                      height={elementHeight}
                      videoUrl={(element as any).videoUrl}
                      trimStart={(element as any).trimStart ?? 0}
                      ref={(node: any) => { nodeRefs.current[element.id] = node; }}
                      {...sharedShadow}
                      onTransformEnd={(event: any) =>
                        updateFromTransform(element, event.target, updateElement)
                      }
                    />
                  );
                }
                return (
                  <Rect
                    key={element.id}
                    {...commonProps}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE}
                    width={elementWidth}
                    height={elementHeight}
                    fill="#111"
                    stroke="#444"
                    strokeWidth={1}
                    ref={(node) => { nodeRefs.current[element.id] = node; }}
                    onTransformEnd={(event) =>
                      updateFromTransform(element, event.target as Konva.Rect, updateElement)
                    }
                  />
                );
              }

              if (element.type === "circle") {
                return (
                  <Ellipse
                    key={element.id}
                    {...centerDragProps}
                    x={centerX}
                    y={centerY}
                    radiusX={elementWidth / 2}
                    radiusY={elementHeight / 2}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    fill={element.style.fill}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    {...sharedShadow}
                    onTransformEnd={(event) =>
                      updateCenterShapeFromTransform(element, event.target as Konva.Ellipse, updateElement)
                    }
                  />
                );
              }

              if (element.type === "triangle") {
                return (
                  <RegularPolygon
                    key={element.id}
                    {...centerDragProps}
                    x={centerX}
                    y={centerY}
                    sides={3}
                    radius={Math.min(elementWidth, elementHeight) / 2}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    fill={element.style.fill}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    {...sharedShadow}
                    onTransformEnd={(event) =>
                      updateCenterShapeFromTransform(
                        element,
                        event.target as Konva.RegularPolygon,
                        updateElement
                      )
                    }
                  />
                );
              }

              if (element.type === "diamond" || element.type === "hexagon" || element.type === "pentagon" || element.type === "octagon") {
                const sides = element.type === "diamond" ? 4 : element.type === "hexagon" ? 6 : element.type === "octagon" ? 8 : 5;
                return (
                  <RegularPolygon
                    key={element.id}
                    {...centerDragProps}
                    x={centerX}
                    y={centerY}
                    sides={sides}
                    radius={Math.min(elementWidth, elementHeight) / 2}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    fill={element.style.fill}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    {...sharedShadow}
                    onTransformEnd={(event) =>
                      updateCenterShapeFromTransform(
                        element,
                        event.target as Konva.RegularPolygon,
                        updateElement
                      )
                    }
                  />
                );
              }

              if (["heart", "cloud", "shield", "zap", "sun", "moon"].includes(element.type)) {
                let pathData = "";
                if (element.type === "heart") {
                  pathData = "M 50 20 C 50 20 50 0 80 0 C 110 0 110 40 80 60 L 50 90 L 20 60 C -10 40 -10 0 20 0 C 50 0 50 20 50 20 Z";
                } else if (element.type === "cloud") {
                  pathData = "M 25,60 A 20,20 0,0,1 15,30 A 20,20 0,0,1 45,15 A 25,25 0,0,1 85,30 A 20,20 0,0,1 75,60 z";
                } else if (element.type === "shield") {
                  pathData = "M 50 8.3 L 8.3 29.1 V 50 C 8.3 72.9 22.9 93.7 50 100 C 77.1 93.7 91.7 72.9 91.7 50 V 29.1 L 50 8.3 Z";
                } else if (element.type === "zap") {
                  pathData = "M 54.1 8.3 L 12.5 58.3 H 50 L 45.8 91.6 L 87.5 41.6 H 50 L 54.1 8.3 Z";
                } else if (element.type === "sun") {
                  pathData = "M 50 8.3 V 20.8 M 50 79.1 V 91.6 M 20.4 20.4 L 29.1 29.1 M 70.8 70.8 L 79.5 79.5 M 8.3 50 H 20.8 M 79.1 50 H 91.6 M 20.4 79.5 L 29.1 70.8 M 70.8 29.1 L 79.5 20.4 M 66.6 50 A 16.6 16.6 0 1 1 33.3 50 A 16.6 16.6 0 0 1 66.6 50 Z";
                } else if (element.type === "moon") {
                  pathData = "M 50 12.5 A 37.5 37.5 0 1 0 87.5 50 A 31.25 31.25 0 0 1 50 12.5 Z";
                }
                
                return (
                  <KonvaPath
                    key={element.id}
                    {...commonProps}
                    data={pathData}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE}
                    width={elementWidth}
                    height={elementHeight}
                    fill={element.style.fill}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    {...sharedShadow}
                    scaleX={elementWidth / 100}
                    scaleY={elementHeight / 100}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    onTransformEnd={(event) => {
                      const node = event.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateElement(element.id, {
                        x: node.x() * STAGE_SCALE,
                        y: node.y() * STAGE_SCALE,
                        width: Math.max(40, elementWidth * scaleX * STAGE_SCALE),
                        height: Math.max(40, elementHeight * scaleY * STAGE_SCALE),
                      });
                    }}
                  />
                );
              }

              if (element.type === "star") {
                const radius = Math.min(elementWidth, elementHeight) / 2;
                return (
                  <KonvaStar
                    key={element.id}
                    {...centerDragProps}
                    x={centerX}
                    y={centerY}
                    numPoints={5}
                    outerRadius={radius}
                    innerRadius={radius * 0.42}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    fill={element.style.fill}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    {...sharedShadow}
                    onTransformEnd={(event) =>
                      updateCenterShapeFromTransform(element, event.target as Konva.Star, updateElement)
                    }
                  />
                );
              }

              if (element.type === "arrow") {
                return (
                  <KonvaArrow
                    key={element.id}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE + elementHeight / 2}
                    points={[0, 0, elementWidth, 0]}
                    fill={element.style.stroke}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    pointerLength={12 / STAGE_SCALE}
                    pointerWidth={10 / STAGE_SCALE}
                    rotation={element.rotation}
                    draggable={canEdit && !element.locked}
                    visible={element.visible}
                    opacity={element.style.opacity}
                    hitStrokeWidth={16}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node as unknown as Konva.Shape;
                    }}
                    onClick={() => selectElement(element.id)}
                    onTap={() => selectElement(element.id)}
                    onDragEnd={(event) => {
                      if (!canEdit) return;
                      updateElement(element.id, {
                        x: event.target.x() * STAGE_SCALE,
                        y: (event.target.y() - elementHeight / 2) * STAGE_SCALE,
                      });
                    }}
                    onTransformEnd={(event) => {
                      if (!canEdit) return;
                      const node = event.target;
                      const scaleX = node.scaleX();
                      node.scaleX(1);
                      updateElement(element.id, {
                        width: Math.max(40, elementWidth * scaleX * STAGE_SCALE),
                        x: node.x() * STAGE_SCALE,
                        y: (node.y() - elementHeight / 2) * STAGE_SCALE,
                      });
                    }}
                  />
                );
              }

              if (element.type === "line") {
                return (
                  <KonvaLine
                    key={element.id}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE + elementHeight / 2}
                    points={[0, 0, elementWidth, 0]}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    rotation={element.rotation}
                    draggable={canEdit && !element.locked}
                    visible={element.visible}
                    opacity={element.style.opacity}
                    hitStrokeWidth={16}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node as unknown as Konva.Shape;
                    }}
                    onClick={() => selectElement(element.id)}
                    onTap={() => selectElement(element.id)}
                    onDragEnd={(event) => {
                      if (!canEdit) return;
                      updateElement(element.id, {
                        x: event.target.x() * STAGE_SCALE,
                        y: (event.target.y() - elementHeight / 2) * STAGE_SCALE,
                      });
                    }}
                    onTransformEnd={(event) => {
                      if (!canEdit) return;
                      const node = event.target;
                      const scaleX = node.scaleX();
                      node.scaleX(1);
                      updateElement(element.id, {
                        width: Math.max(40, elementWidth * scaleX * STAGE_SCALE),
                        x: node.x() * STAGE_SCALE,
                        y: (node.y() - elementHeight / 2) * STAGE_SCALE,
                      });
                    }}
                  />
                );
              }

              if (element.type === "pencil") {
                return (
                  <KonvaLine
                    key={element.id}
                    ref={(node) => { nodeRefs.current[element.id] = node as unknown as Konva.Shape; }}
                    points={(element.points ?? []).map((p) => p / STAGE_SCALE)}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth / STAGE_SCALE}
                    tension={0.4}
                    lineCap="round"
                    lineJoin="round"
                    draggable={canEdit && !element.locked}
                    visible={element.visible}
                    opacity={element.style.opacity}
                    hitStrokeWidth={12}
                    onClick={() => selectElement(element.id)}
                    onTap={() => selectElement(element.id)}
                    onDragEnd={(event) => {
                      if (!canEdit) return;
                      const dx = event.target.x() * STAGE_SCALE;
                      const dy = event.target.y() * STAGE_SCALE;
                      const newPoints = (element.points ?? []).map((p, i) =>
                        i % 2 === 0 ? p + dx : p + dy
                      );
                      event.target.x(0);
                      event.target.y(0);
                      updateElement(element.id, { points: newPoints });
                    }}
                  />
                );
              }

              return (
                <KonvaText
                  key={element.id}
                  {...commonProps}
                  x={element.x / STAGE_SCALE}
                  y={element.y / STAGE_SCALE}
                  width={elementWidth}
                  height={elementHeight}
                  ref={(node) => {
                    nodeRefs.current[element.id] = node;
                  }}
                  {...sharedShadow}
                  text={element.text ?? "Text element"}
                  fill={element.style.fill}
                  opacity={editingElementId === element.id ? 0 : element.style.opacity}
                  fontSize={Math.max(10, element.style.fontSize / STAGE_SCALE)}
                  fontFamily={element.style.fontFamily ?? "Inter"}
                  fontStyle={getKonvaFontStyle(element)}
                  align={element.style.textAlign ?? "left"}
                  padding={8}
                  dragBoundFunc={(position) => {
                    let newX = clamp(position.x, 0, STAGE_WIDTH - elementWidth);
                    let newY = clamp(position.y, 0, STAGE_HEIGHT - elementHeight);
                    if (snapToGrid) {
                      newX = Math.round(newX / 20) * 20;
                      newY = Math.round(newY / 20) * 20;
                    }
                    return { x: newX, y: newY };
                  }}
                  onTransformEnd={(event) => {
                    if (!canEdit) return;
                    updateFromTransform(element, event.target as Konva.Text, updateElement);
                  }}
                  onDblClick={() => {
                    if (!canEdit) return;
                    const node = nodeRefs.current[element.id] as Konva.Text;
                    if (!node) return;

                    setEditingElementId(element.id);
                    const stageBox = node.getStage()!.container().getBoundingClientRect();
                    const absolutePosition = node.getAbsolutePosition();
                    const textarea = document.createElement("textarea");
                    editingRef.current = textarea;
                    textarea.value = element.text ?? "";
                    textarea.style.cssText = `
                      position: fixed;
                      top: ${stageBox.top + absolutePosition.y * zoom + 8}px;
                      left: ${stageBox.left + absolutePosition.x * zoom + 8}px;
                      width: ${Math.max((elementWidth - 16) * zoom, 120)}px;
                      min-height: ${Math.max((elementHeight - 16) * zoom, 48)}px;
                      font-size: ${Math.max(10, element.style.fontSize / STAGE_SCALE) * zoom}px;
                      font-family: ${element.style.fontFamily ?? "Inter"};
                      font-style: ${element.style.fontStyle ?? "normal"};
                      font-weight: ${element.style.fontWeight ?? "normal"};
                      text-align: ${element.style.textAlign ?? "left"};
                      color: ${element.style.fill};
                      background: transparent;
                      border: none;
                      border-radius: 0;
                      padding: 6px 8px;
                      resize: none;
                      outline: none;
                      z-index: 9999;
                      line-height: 1.5;
                      box-shadow: none;
                      overflow: hidden;
                      caret-color: ${element.style.fill};
                    `;
                    document.body.appendChild(textarea);
                    resizeTextarea(textarea);
                    textarea.focus();
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

                    function finish() {
                      if (!editingRef.current) return;
                      editingRef.current = null;
                      setEditingElementId(null);
                      textarea.remove();
                    }

                    textarea.addEventListener("input", () => {
                      resizeTextarea(textarea);
                      updateElement(element.id, {
                        text: textarea.value,
                      });
                    });
                    textarea.addEventListener("blur", finish);
                    textarea.addEventListener("keydown", (event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        finish();
                        return;
                      }

                      if (event.key === "Enter" && event.shiftKey) {
                        return;
                      }

                      if (event.key === "Enter") {
                        event.preventDefault();
                        finish();
                      }
                    });
                  }}
                />
              );
            })}

            {/* In-progress pencil stroke */}
            {drawingPoints && drawingPoints.length >= 4 && (
              <KonvaLine
                points={drawingPoints.map((p) => p / STAGE_SCALE)}
                stroke="#2f2f2f"
                strokeWidth={3 / STAGE_SCALE}
                tension={0.4}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              borderStroke="#D3A5B1"
              borderStrokeWidth={2}
              anchorFill="#ffffff"
              anchorStroke="#D3A5B1"
              anchorSize={10}
              anchorCornerRadius={4}
              rotateAnchorCursor="grab"
              padding={6}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 36 || newBox.height < 28) return oldBox;
                if (snapToGrid) {
                  newBox.width = Math.round(newBox.width / 20) * 20;
                  newBox.height = Math.round(newBox.height / 20) * 20;
                }
                return newBox;
              }}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
              ]}
            />
          </Layer>

          {remoteCursors && Object.keys(remoteCursors).length > 0 && (
            <Layer listening={false}>
              {Object.entries(remoteCursors).map(([userId, cursor]) => {
                const color = presences?.[userId]?.color ?? "#D3A5B1";
                const x = cursor.x * STAGE_WIDTH;
                const y = cursor.y * STAGE_HEIGHT;
                return (
                  <Circle
                    key={userId}
                    x={x}
                    y={y}
                    radius={88}
                    fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                    fillRadialGradientStartRadius={0}
                    fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                    fillRadialGradientEndRadius={88}
                    fillRadialGradientColorStops={[0, hexToRgba(color, 0.45), 0.45, hexToRgba(color, 0.2), 1, hexToRgba(color, 0)]}
                    listening={false}
                  />
                );
              })}
            </Layer>
          )}
        </Stage>

        <AnimatePresence>
          {menu?.visible && (
            <CustomContextMenu
              x={menu.x}
              y={menu.y}
              onClose={() => setMenu(null)}
              onAction={handleContextAction}
              isLocked={elements.find(e => e.id === selectedElementId)?.locked}
            />
          )}
        </AnimatePresence>
      </div>
  );
}
