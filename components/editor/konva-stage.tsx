"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Arrow as KonvaArrow,
  Ellipse,
  Layer,
  Line as KonvaLine,
  Rect,
  RegularPolygon,
  Stage,
  Star as KonvaStar,
  Text as KonvaText,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { type CanvasElement, useWorkspaceStore } from "@/store/workspaceStore";
import { KonvaImage } from "./konva-image";

const STAGE_SCALE = 1.6;

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

export function KonvaStageWorkspace({ zoom = 1 }: { zoom?: number }) {
  const elements = useWorkspaceStore((state) => state.elements);
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const selectElement = useWorkspaceStore((state) => state.selectElement);
  const updateElement = useWorkspaceStore((state) => state.updateElement);
  const canvasBackground = useWorkspaceStore((state) => state.canvasBackground);
  const canvasDimensions = useWorkspaceStore((state) => state.canvasDimensions);
  const canEdit = useWorkspaceStore((state) => state.canEdit);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const addPencilElement = useWorkspaceStore((state) => state.addPencilElement);

  const STAGE_WIDTH  = canvasDimensions.width  / STAGE_SCALE;
  const STAGE_HEIGHT = canvasDimensions.height / STAGE_SCALE;

  const orderedElements = useMemo(
    () => [...elements].sort((left, right) => left.layerOrder - right.layerOrder),
    [elements]
  );

  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Record<string, Konva.Shape | Konva.Text | null>>({});
  const editingRef = useRef<HTMLTextAreaElement | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<number[] | null>(null);

  const getStagePos = useCallback((event: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = event.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x * STAGE_SCALE, y: pos.y * STAGE_SCALE };
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (!canEdit || !selectedElementId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = nodeRefs.current[selectedElementId];
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [canEdit, orderedElements, selectedElementId]);

  return (
    <div className="konva-frame">
        <Stage
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="konva-stage"
          style={{ cursor: activeTool === "pencil" ? "crosshair" : "default" }}
          onMouseDown={(event) => {
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
            if (activeTool !== "pencil" || !drawingPoints || !canEdit) return;
            const pos = getStagePos(event);
            if (pos) setDrawingPoints((prev) => prev ? [...prev, pos.x, pos.y] : null);
          }}
          onMouseUp={() => {
            if (activeTool !== "pencil" || !drawingPoints || !canEdit) return;
            if (drawingPoints.length >= 4) addPencilElement(drawingPoints);
            setDrawingPoints(null);
          }}
          onMouseLeave={() => {
            if (activeTool === "pencil" && drawingPoints && drawingPoints.length >= 4) {
              addPencilElement(drawingPoints);
            }
            setDrawingPoints(null);
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
                onClick: () => selectElement(element.id),
                onTap: () => selectElement(element.id),
                onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
                  if (!canEdit) return;
                  updateElement(element.id, {
                    x: event.target.x() * STAGE_SCALE,
                    y: event.target.y() * STAGE_SCALE,
                  });
                },
              };

              const centerDragProps = {
                rotation: element.rotation,
                draggable: canEdit && !element.locked,
                visible: element.visible,
                opacity: element.style.opacity,
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

              if (element.type === "image" && (element as any).imageUrl) {
                return (
                  <KonvaImage
                    key={element.id}
                    {...commonProps}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE}
                    width={elementWidth}
                    height={elementHeight}
                    imageUrl={(element as any).imageUrl}
                    ref={(node: any) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    {...sharedShadow}
                    onTransformEnd={(event: any) =>
                      updateFromTransform(element, event.target, updateElement)
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
                  dragBoundFunc={(position) => ({
                    x: clamp(position.x, 0, STAGE_WIDTH - elementWidth),
                    y: clamp(position.y, 0, STAGE_HEIGHT - elementHeight),
                  })}
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
              borderStroke="#4f8cff"
              borderStrokeWidth={2}
              anchorFill="#ffffff"
              anchorStroke="#4f8cff"
              anchorSize={10}
              anchorCornerRadius={3}
              rotateAnchorCursor="grab"
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 36 || newBox.height < 28) return oldBox;
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
        </Stage>
      </div>
  );
}
