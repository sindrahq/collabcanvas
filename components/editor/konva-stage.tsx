"use client";

import { useEffect, useMemo, useRef } from "react";
import { Ellipse, Layer, Rect, RegularPolygon, Stage, Star, Arrow, Image as KonvaImage, Text as KonvaText, Transformer } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import { CANVAS_DIMENSIONS } from "@/lib/constants";
import { type CanvasElement, useWorkspaceStore } from "@/store/workspaceStore";

const STAGE_SCALE = 1.6;
const STAGE_WIDTH = CANVAS_DIMENSIONS.width / STAGE_SCALE;
const STAGE_HEIGHT = CANVAS_DIMENSIONS.height / STAGE_SCALE;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDragBounds(position: { x: number; y: number }, width: number, height: number) {
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

// Image element component
function ImageElement({ element, isSelected, selectElement, updateElement, nodeRefs }: {
  element: CanvasElement;
  isSelected: boolean;
  selectElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  nodeRefs: React.MutableRefObject<Record<string, Konva.Shape | Konva.Text | null>>;
}) {
  const [image] = useImage(element.imageUrl ?? "");
  const elementWidth = element.width / STAGE_SCALE;
  const elementHeight = element.height / STAGE_SCALE;

  return (
    <KonvaImage
      key={element.id}
      image={image}
      x={element.x / STAGE_SCALE}
      y={element.y / STAGE_SCALE}
      width={elementWidth}
      height={elementHeight}
      rotation={element.rotation}
      draggable={!element.locked}
      visible={element.visible}
      opacity={element.style.opacity}
      stroke={isSelected ? "#7c6cfc" : "transparent"}
      strokeWidth={isSelected ? 2 : 0}
      ref={(node) => { nodeRefs.current[element.id] = node as unknown as Konva.Shape; }}
      onClick={() => selectElement(element.id)}
      onTap={() => selectElement(element.id)}
      onDragEnd={(e) => updateElement(element.id, {
        x: e.target.x() * STAGE_SCALE,
        y: e.target.y() * STAGE_SCALE
      })}
      onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Shape, updateElement)}
      dragBoundFunc={(pos) => getDragBounds(pos, elementWidth, elementHeight)}
    />
  );
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
  const editingRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
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
        <span>Click to select · Drag to move · Double-click text to edit</span>
      </div>

      <div className="konva-frame">
        <Stage
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="konva-stage"
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) selectElement(null);
          }}
        >
          <Layer>
            <Rect
              x={0} y={0}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              fill="#fffdf8"
              cornerRadius={20}
            />

            {orderedElements.map((element) => {
              const isSelected = element.id === selectedElementId;
              const elementWidth = element.width / STAGE_SCALE;
              const elementHeight = element.height / STAGE_SCALE;
              const cx = element.x / STAGE_SCALE + elementWidth / 2;
              const cy = element.y / STAGE_SCALE + elementHeight / 2;

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
                    ref={(node) => { nodeRefs.current[element.id] = node; }}
                    fill={element.style.fill}
                    stroke={isSelected ? "#7c6cfc" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth}
                    cornerRadius={12}
                    shadowColor="rgba(0,0,0,0.2)"
                    shadowBlur={12}
                    shadowOffset={{ x: 0, y: 6 }}
                    shadowOpacity={0.2}
                    dragBoundFunc={(pos) => getDragBounds(pos, elementWidth, elementHeight)}
                    onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Rect, updateElement)}
                  />
                );
              }

              if (element.type === "circle") {
                return (
                  <Ellipse
                    key={element.id}
                    {...commonProps}
                    x={cx} y={cy}
                    ref={(node) => { nodeRefs.current[element.id] = node; }}
                    radiusX={elementWidth / 2}
                    radiusY={elementHeight / 2}
                    fill={element.style.fill}
                    stroke={isSelected ? "#7c6cfc" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth}
                    dragBoundFunc={(pos) => getEllipseDragBounds(pos, elementWidth, elementHeight)}
                    onDragEnd={(e) => updateElement(element.id, {
                      x: (e.target.x() - e.target.width() / 2) * STAGE_SCALE,
                      y: (e.target.y() - e.target.height() / 2) * STAGE_SCALE
                    })}
                    onTransformEnd={(e) => updateEllipseFromTransform(element, e.target as Konva.Ellipse, updateElement)}
                  />
                );
              }

              if (element.type === "triangle") {
                return (
                  <RegularPolygon
                    key={element.id}
                    {...commonProps}
                    x={cx} y={cy}
                    ref={(node) => { nodeRefs.current[element.id] = node as unknown as Konva.Shape; }}
                    sides={3}
                    radius={Math.min(elementWidth, elementHeight) / 2}
                    fill={element.style.fill}
                    stroke={isSelected ? "#7c6cfc" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth}
                    onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Shape, updateElement)}
                  />
                );
              }

              if (element.type === "diamond") {
                return (
                  <RegularPolygon
                    key={element.id}
                    {...commonProps}
                    x={cx} y={cy}
                    ref={(node) => { nodeRefs.current[element.id] = node as unknown as Konva.Shape; }}
                    sides={4}
                    radius={Math.min(elementWidth, elementHeight) / 2}
                    fill={element.style.fill}
                    stroke={isSelected ? "#7c6cfc" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth}
                    onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Shape, updateElement)}
                  />
                );
              }

              if (element.type === "star") {
                return (
                  <Star
                    key={element.id}
                    {...commonProps}
                    x={cx} y={cy}
                    ref={(node) => { nodeRefs.current[element.id] = node as unknown as Konva.Shape; }}
                    numPoints={5}
                    innerRadius={Math.min(elementWidth, elementHeight) / 4}
                    outerRadius={Math.min(elementWidth, elementHeight) / 2}
                    fill={element.style.fill}
                    stroke={isSelected ? "#7c6cfc" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth}
                    onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Shape, updateElement)}
                  />
                );
              }

              if (element.type === "arrow") {
                return (
                  <Arrow
                    key={element.id}
                    {...commonProps}
                    x={element.x / STAGE_SCALE}
                    y={element.y / STAGE_SCALE}
                    ref={(node) => { nodeRefs.current[element.id] = node as unknown as Konva.Shape; }}
                    points={[0, elementHeight / 2, elementWidth, elementHeight / 2]}
                    fill={element.style.fill}
                    stroke={isSelected ? "#7c6cfc" : element.style.stroke}
                    strokeWidth={isSelected ? 3 : element.style.strokeWidth + 1}
                    pointerLength={12}
                    pointerWidth={10}
                    onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Shape, updateElement)}
                  />
                );
              }

              if (element.type === "image") {
                return (
                  <ImageElement
                    key={element.id}
                    element={element}
                    isSelected={isSelected}
                    selectElement={selectElement}
                    updateElement={updateElement}
                    nodeRefs={nodeRefs}
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
                  ref={(node) => { nodeRefs.current[element.id] = node; }}
                  text={element.text ?? "Text element"}
                  fill={element.style.fill}
                  fontSize={Math.max(16, element.style.fontSize / 1.25)}
                  fontStyle={isSelected ? "bold" : "normal"}
                  padding={8}
                  dragBoundFunc={(pos) => getDragBounds(pos, elementWidth, elementHeight)}
                  onTransformEnd={(e) => updateFromTransform(element, e.target as Konva.Text, updateElement)}
                  onDblClick={() => {
                    const node = nodeRefs.current[element.id] as Konva.Text;
                    if (!node) return;
                    const stageBox = node.getStage()!.container().getBoundingClientRect();
                    const absPos = node.getAbsolutePosition();
                    const textarea = document.createElement("textarea");
                    editingRef.current = textarea;
                    textarea.value = element.text ?? "";
                    textarea.style.cssText = `
                      position: fixed;
                      top: ${stageBox.top + absPos.y + 8}px;
                      left: ${stageBox.left + absPos.x + 8}px;
                      width: ${elementWidth - 16}px;
                      min-height: ${elementHeight - 16}px;
                      font-size: ${Math.max(16, element.style.fontSize / 1.25)}px;
                      color: ${element.style.fill};
                      background: rgba(20, 20, 20, 0.96);
                      border: 1.5px solid #7c6cfc;
                      border-radius: 6px;
                      padding: 6px 8px;
                      resize: none;
                      outline: none;
                      z-index: 9999;
                      font-family: inherit;
                      line-height: 1.5;
                    `;
                    document.body.appendChild(textarea);
                    textarea.focus();
                    textarea.select();
                    function finish() {
                      if (!editingRef.current) return;
                      const newText = textarea.value.trim() || "Text element";
                      updateElement(element.id, { text: newText });
                      editingRef.current = null;
                      textarea.remove();
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
              rotateEnabled={false}
              borderStroke="#7c6cfc"
              borderStrokeWidth={2}
              anchorFill="#fff"
              anchorStroke="#7c6cfc"
              anchorSize={10}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 36 || newBox.height < 28) return oldBox;
                if (newBox.x < 0 || newBox.y < 0 ||
                  newBox.x + newBox.width > STAGE_WIDTH ||
                  newBox.y + newBox.height > STAGE_HEIGHT) return oldBox;
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