"use client";

import { useEffect, useMemo, useRef } from "react";
import { Ellipse, Layer, Rect, Stage, Text as KonvaText, Transformer } from "react-konva";
import type Konva from "konva";
import { CANVAS_DIMENSIONS } from "@/lib/constants";
import { type CanvasElement, useWorkspaceStore } from "@/store/workspaceStore";

const STAGE_SCALE = 1.6;
const STAGE_WIDTH = CANVAS_DIMENSIONS.width / STAGE_SCALE;
const STAGE_HEIGHT = CANVAS_DIMENSIONS.height / STAGE_SCALE;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRectDragBounds(position: { x: number; y: number }, width: number, height: number) {
  return {
    x: clamp(position.x, 0, STAGE_WIDTH - width),
    y: clamp(position.y, 0, STAGE_HEIGHT - height)
  };
}

function getTextDragBounds(position: { x: number; y: number }, width: number, height: number) {
  return {
    x: clamp(position.x, 0, STAGE_WIDTH - width),
    y: clamp(position.y, 0, STAGE_HEIGHT - height)
  };
}

function getEllipseDragBounds(position: { x: number; y: number }, width: number, height: number) {
  return {
    x: clamp(position.x, width / 2, STAGE_WIDTH - width / 2),
    y: clamp(position.y, height / 2, STAGE_HEIGHT - height / 2)
  };
}

function updateFromTransform(
  element: CanvasElement,
  node: Konva.Shape | Konva.Text,
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void
) {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  node.scaleX(1);
  node.scaleY(1);

  updateElement(element.id, {
    x: node.x() * STAGE_SCALE,
    y: node.y() * STAGE_SCALE,
    width: Math.max(48, node.width() * scaleX * STAGE_SCALE),
    height: Math.max(36, node.height() * scaleY * STAGE_SCALE)
  });
}

function updateEllipseFromTransform(
  element: CanvasElement,
  node: Konva.Ellipse,
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void
) {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  const nextWidth = Math.max(48, node.width() * scaleX * STAGE_SCALE);
  const nextHeight = Math.max(48, node.height() * scaleY * STAGE_SCALE);

  node.scaleX(1);
  node.scaleY(1);

  updateElement(element.id, {
    x: (node.x() - node.width() / 2) * STAGE_SCALE,
    y: (node.y() - node.height() / 2) * STAGE_SCALE,
    width: nextWidth,
    height: nextHeight
  });
}

export function KonvaStageWorkspace() {
  const elements = useWorkspaceStore((state) => state.elements);
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const selectElement = useWorkspaceStore((state) => state.selectElement);
  const updateElement = useWorkspaceStore((state) => state.updateElement);

  const orderedElements = useMemo(
    () => [...elements].sort((left, right) => left.layerOrder - right.layerOrder),
    [elements]
  );

  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Record<string, Konva.Shape | Konva.Text | null>>({});

  useEffect(() => {
    const transformer = transformerRef.current;

    if (!transformer) {
      return;
    }

    if (!selectedElementId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selectedNode = nodeRefs.current[selectedElementId];

    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [selectedElementId, orderedElements]);

  return (
    <>
      <div className="canvas-instructions">
        <span>Drag enabled for unlocked elements.</span>
        <span>Click an element to select it, or click the stage to clear selection.</span>
      </div>

      <div className="konva-frame">
        <Stage
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="konva-stage"
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) {
              selectElement(null);
            }
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              fill="#fffdf8"
              cornerRadius={20}
            />

            {orderedElements.map((element) => {
              const isSelected = element.id === selectedElementId;
              const elementWidth = element.width / STAGE_SCALE;
              const elementHeight = element.height / STAGE_SCALE;
              const commonProps = {
                rotation: element.rotation,
                draggable: !element.locked,
                visible: element.visible,
                opacity: element.style.opacity,
                onClick: () => selectElement(element.id),
                onTap: () => selectElement(element.id),
                onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
                  updateElement(element.id, {
                    x: event.target.x() * STAGE_SCALE,
                    y: event.target.y() * STAGE_SCALE
                  });
                }
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
                    stroke={isSelected ? "#124b52" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth}
                    cornerRadius={18}
                    shadowColor="rgba(31, 38, 35, 0.16)"
                    shadowBlur={18}
                    shadowOffset={{ x: 0, y: 10 }}
                    shadowOpacity={0.2}
                    dragBoundFunc={(position) =>
                      getRectDragBounds(position, elementWidth, elementHeight)
                    }
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
                    {...commonProps}
                    x={element.x / STAGE_SCALE + elementWidth / 2}
                    y={element.y / STAGE_SCALE + elementHeight / 2}
                    ref={(node) => {
                      nodeRefs.current[element.id] = node;
                    }}
                    radiusX={elementWidth / 2}
                    radiusY={elementHeight / 2}
                    fill={element.style.fill}
                    stroke={isSelected ? "#a25715" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth}
                    shadowColor="rgba(31, 38, 35, 0.12)"
                    shadowBlur={14}
                    shadowOffset={{ x: 0, y: 6 }}
                    shadowOpacity={0.18}
                    dragBoundFunc={(position) =>
                      getEllipseDragBounds(position, elementWidth, elementHeight)
                    }
                    onDragEnd={(event) => {
                      updateElement(element.id, {
                        x: (event.target.x() - event.target.width() / 2) * STAGE_SCALE,
                        y: (event.target.y() - event.target.height() / 2) * STAGE_SCALE
                      });
                    }}
                    onTransformEnd={(event) =>
                      updateEllipseFromTransform(
                        element,
                        event.target as Konva.Ellipse,
                        updateElement
                      )
                    }
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
                  text={element.text ?? "Text element"}
                  fill={element.style.fill}
                  fontSize={Math.max(16, element.style.fontSize / 1.25)}
                  fontStyle={isSelected ? "bold" : "normal"}
                  padding={8}
                  dragBoundFunc={(position) =>
                    getTextDragBounds(position, elementWidth, elementHeight)
                  }
                  onTransformEnd={(event) =>
                    updateFromTransform(element, event.target as Konva.Text, updateElement)
                  }
                />
              );
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              borderStroke="#1f6f78"
              borderStrokeWidth={2}
              anchorFill="#fff"
              anchorStroke="#1f6f78"
              anchorSize={10}
              boundBoxFunc={(oldBox, newBox) => {
                const minWidth = 36;
                const minHeight = 28;

                if (newBox.width < minWidth || newBox.height < minHeight) {
                  return oldBox;
                }

                if (
                  newBox.x < 0 ||
                  newBox.y < 0 ||
                  newBox.x + newBox.width > STAGE_WIDTH ||
                  newBox.y + newBox.height > STAGE_HEIGHT
                ) {
                  return oldBox;
                }

                return newBox;
              }}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right"
              ]}
            />
          </Layer>
        </Stage>
      </div>
    </>
  );
}
