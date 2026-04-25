
"use client";
// ── Helpers ────────────────────────────────────────────────────────────────

function withCompatFields(element: CanvasElement): CanvasElement {
  return {
    ...element,
    name: element.name ?? element.label,
    label: element.label ?? element.name,
    layerOrder: element.layerOrder ?? element.layer_order,
    layer_order: element.layer_order ?? element.layerOrder,
    style: {
      ...element.style,
      fill: (element.type === "text" && (!element.style.fill || element.style.fill === "#ffffff" || element.style.fill === "white"))
        ? "#1e2523"
        : (element.style.fill ?? "#cccccc"),
      fontFamily: element.style.fontFamily ?? "Inter",
      fontStyle: element.style.fontStyle ?? "normal",
      fontWeight: element.style.fontWeight ?? "normal",
      textAlign: element.style.textAlign ?? "left",
      shadowEnabled: element.style.shadowEnabled ?? false,
      shadowBlur: element.style.shadowBlur ?? 16,
      shadowColor: element.style.shadowColor ?? "rgba(20,32,28,0.3)",
      shadowOffsetX: element.style.shadowOffsetX ?? 0,
      shadowOffsetY: element.style.shadowOffsetY ?? 6,
    },
  };
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────

export type WorkspaceMeta = { id: string; name: string; owner_id: string };
export type WorkspaceAccessLevel = "view" | "comment" | "edit";
export type LayoutDirection = "horizontal" | "vertical";

export type CanvasElementType =
  | "rectangle" | "circle" | "text"
  | "triangle" | "star" | "arrow" | "line" | "image"
  | "diamond" | "hexagon" | "pentagon" | "heart" | "cloud"
  | "shield" | "octagon" | "zap" | "sun" | "moon" | "frame" | "pencil";

export type CanvasElementStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  brightness: number; // 0 to 2
  contrast: number;   // -100 to 100
  tint: number;       // 0 to 1
};

export type CanvasElement = {
  id: string;
  workspaceId?: string;
  name: string;
  label: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  layerOrder: number;
  layer_order: number;
  text?: string;
  style: CanvasElementStyle;
  imageUrl?: string;
  parentId?: string;
  layoutProps?: {
    direction: LayoutDirection;
    padding: number;
    gap: number;
    autoResize: boolean;
  };
  points?: number[];
};

type WorkspaceState = {
  workspace: WorkspaceMeta | null;
  workspaceName: string;
  accessLevel: WorkspaceAccessLevel;
  canEdit: boolean;
  selectedElementId: string | null;
  elements: CanvasElement[];
  elementList: CanvasElement[];
  clipboard: CanvasElement | null;
  loading: boolean;
  history: CanvasElement[][];
  historyIndex: number;
  canvasBackground: string;
  canvasDimensions: { width: number; height: number };
  activeTool: "select" | "pencil" | "eraser";
  setActiveTool: (tool: "select" | "pencil" | "eraser") => void;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  addPencilElement: (points: number[]) => void;
  selectElement: (elementId: string | null) => void;
  setSelectedElementId: (elementId: string | null) => void;
  setWorkspace: (workspace: WorkspaceMeta | null) => void;
  setWorkspaceAccess: (accessLevel: WorkspaceAccessLevel) => void;
  setElements: (elements: CanvasElement[]) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  addElement: (type: CanvasElementType, extra?: Partial<CanvasElement>) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  updateElementStyle: (elementId: string, style: Partial<CanvasElementStyle>) => void;
  reorderElement: (elementId: string, direction: "forward" | "backward") => void;
  copySelectedElement: () => void;
  pasteElement: () => void;
  duplicateSelectedElement: () => void;
  deleteSelectedElement: () => void;
  deleteElement: (id: string) => void;
  partialErasePencilStroke: (id: string, segments: number[][]) => void;
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  updateLayerOrder: (elements: CanvasElement[]) => void;
  setCanvasBackground: (color: string) => void;
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  undo: () => void;
  redo: () => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
};

// ── Defaults ───────────────────────────────────────────────────────────────

const BASE_FONT = {
  fontFamily: "Inter",
  fontStyle: "normal" as const,
  fontWeight: "normal" as const,
  textAlign: "left" as const,
  shadowEnabled: false,
  shadowBlur: 16,
  shadowColor: "rgba(20,32,28,0.3)",
  shadowOffsetX: 0,
  shadowOffsetY: 6,
};

const BASE_SHADOW = {
  shadowEnabled: true,
  shadowBlur: 16,
  shadowColor: "rgba(20,32,28,0.3)",
  shadowOffsetX: 0,
  shadowOffsetY: 6,
};

const BASE_FILTERS = {
  brightness: 0,
  contrast: 0,
  tint: 0,
};

const defaultElementStyle: Record<CanvasElementType, CanvasElementStyle> = {
  rectangle: { fill: "#f7f2ea", stroke: "#2f2f2f", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  circle:    { fill: "#e3f7ea", stroke: "#2f2f2f", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  text:      { fill: "#1e2523", stroke: "#2f2f2f", strokeWidth: 0, opacity: 1, fontSize: 28, ...BASE_FONT, ...BASE_FILTERS },
  triangle:  { fill: "#d4c3f0", stroke: "#6b3fa0", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  star:      { fill: "#f5e6a3", stroke: "#b89600", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  arrow:     { fill: "#a8d4f0", stroke: "#1a6fa0", strokeWidth: 3, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  line:      { fill: "transparent", stroke: "#637069", strokeWidth: 3, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  image:     { fill: "#fff", stroke: "#2f2f2f", strokeWidth: 1, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  diamond:   { fill: "#ffedcc", stroke: "#d4a017", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  hexagon:   { fill: "#dcfce7", stroke: "#166534", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  pentagon:  { fill: "#e0e7ff", stroke: "#3730a3", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  heart:     { fill: "#ffe4e6", stroke: "#e11d48", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  cloud:     { fill: "#f0f9ff", stroke: "#0284c7", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  shield:    { fill: "#f1f5f9", stroke: "#475569", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  octagon:   { fill: "#ffedd5", stroke: "#9a3412", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  zap:       { fill: "#fef9c3", stroke: "#a16207", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  sun:       { fill: "#fef3c7", stroke: "#b45309", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  moon:      { fill: "#f1f5f9", stroke: "#1e293b", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  frame:     { fill: "rgba(255, 255, 255, 0.15)", stroke: "rgba(211, 165, 177, 0.3)", strokeWidth: 1, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
  pencil:    { fill: "transparent", stroke: "#2f2f2f", strokeWidth: 3, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW, ...BASE_FILTERS },
} satisfies Record<CanvasElementType, CanvasElementStyle>;

const DEFAULT_LAYOUT = {
  direction: "horizontal" as const,
  padding: 20,
  gap: 16,
  autoResize: true,
};

function normalizeElements(elements: CanvasElement[]): CanvasElement[] {
  return elements.map((el, i) =>
    withCompatFields({
      ...el,
      layerOrder: el.layerOrder ?? i,
      layer_order: el.layer_order ?? el.layerOrder ?? i,
      label: el.label ?? el.name,
      name: el.name ?? el.label,
    })
  );
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function createElement(type: CanvasElementType, layerOrder: number, extra?: Partial<CanvasElement>): CanvasElement {
  const isText  = type === "text";
  const isLine  = type === "line" || type === "arrow";
  const label   = `${type[0].toUpperCase()}${type.slice(1)} ${layerOrder + 1}`;
  return withCompatFields({
    id: createId(type),
    name: label, label, type,
    x: 72 + layerOrder * 28,
    y: 72 + layerOrder * 22,
    width:  isText ? 240 : isLine ? 200 : 140,
    height: isText ? 72  : isLine ? 40  : 140,
    rotation: 0, visible: true, locked: false,
    layerOrder, layer_order: layerOrder,
    text: isText ? "New text block" : undefined,
    style: { ...defaultElementStyle[type] },
    layoutProps: type === "frame" ? { ...DEFAULT_LAYOUT } : undefined,
    ...extra,
  });
}

function recalculateLayout(elements: CanvasElement[], frameId: string): CanvasElement[] {
  const frame = elements.find(el => el.id === frameId);
  if (!frame || frame.type !== 'frame' || !frame.layoutProps) return elements;

  const children = elements.filter(el => el.parentId === frameId).sort((a, b) => a.layerOrder - b.layerOrder);
  if (children.length === 0) return elements;

  const { direction, padding, gap, autoResize } = frame.layoutProps;
  let currentX = frame.x + padding;
  let currentY = frame.y + padding;
  let totalWidth = padding * 2;
  let totalHeight = padding * 2;

  const nextElements = [...elements];

  children.forEach((child) => {
    const idx = nextElements.findIndex(el => el.id === child.id);
    if (idx === -1) return;

    nextElements[idx] = {
      ...nextElements[idx],
      x: currentX,
      y: currentY,
    };

    if (direction === "horizontal") {
      currentX += child.width + gap;
      totalWidth = (currentX - frame.x - gap) + padding;
      totalHeight = Math.max(totalHeight, child.height + padding * 2);
    } else {
      currentY += child.height + gap;
      totalHeight = (currentY - frame.y - gap) + padding;
      totalWidth = Math.max(totalWidth, child.width + padding * 2);
    }
  });

  if (autoResize) {
    const fIdx = nextElements.findIndex(el => el.id === frameId);
    nextElements[fIdx] = {
      ...nextElements[fIdx],
      width: totalWidth,
      height: totalHeight,
    };
  }

  return nextElements;
}

function cloneElements(elements: CanvasElement[]): CanvasElement[] {
  return normalizeElements(elements.map((el) => ({ ...el, style: { ...el.style } })));
}

function setElementCollections(elements: CanvasElement[]) {
  const normalized = normalizeElements(elements);
  return { elements: normalized, elementList: normalized };
}

type HistorySlice = Pick<WorkspaceState, "history" | "historyIndex">;

function withHistory(state: HistorySlice, nextElements: CanvasElement[]) {
  const trimmed = state.history.slice(0, state.historyIndex + 1);
  const next = [...trimmed, cloneElements(nextElements)].slice(-30);
  return { ...setElementCollections(nextElements), history: next, historyIndex: next.length - 1 };
}

// ── Starter elements ───────────────────────────────────────────────────────

const starterElements: CanvasElement[] = normalizeElements([
  {
    id: "hero-rect", name: "Rectangle 1", label: "Rectangle 1", type: "rectangle",
    x: 80, y: 84, width: 280, height: 148, rotation: 0, visible: true, locked: false,
    layerOrder: 0, layer_order: 0, style: { ...defaultElementStyle.rectangle },
  },
  {
    id: "hero-circle", name: "Circle 1", label: "Circle 1", type: "circle",
    x: 410, y: 110, width: 118, height: 118, rotation: 0, visible: true, locked: false,
    layerOrder: 1, layer_order: 1, style: { ...defaultElementStyle.circle },
  },
  {
    id: "welcome-copy", name: "Text 1", label: "Text 1", type: "text",
    x: 200, y: 280, width: 280, height: 90, rotation: 0, visible: true, locked: false,
    layerOrder: 2, layer_order: 2, text: "Welcome to Canvas",
    style: { ...defaultElementStyle.text },
  },
]);

// ── Store ──────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspace: null,
      workspaceName: "My Workspace",
      accessLevel: "edit",
      canEdit: true,
      selectedElementId: starterElements[2]?.id ?? null,
      elements: starterElements,
      elementList: starterElements,
      clipboard: null,
      loading: false,
      history: [cloneElements(starterElements)],
      historyIndex: 0,
      canvasBackground: "#fffdf8",
      canvasDimensions: { width: 1280, height: 800 },
      snapToGrid: false,
      activeTool: "select",
      eraserSize: 10,

      setActiveTool: (tool) => set({ activeTool: tool }),
      setEraserSize: (eraserSize) => set({ eraserSize }),

      addPencilElement: (points) =>
        set((state) => {
          const layerOrder = state.elements.length;
          const name = `Pencil ${layerOrder + 1}`;
          const element: CanvasElement = withCompatFields({
            id: createId("pencil"),
            name, label: name, type: "pencil",
            x: 0, y: 0, width: 0, height: 0,
            rotation: 0, visible: true, locked: false,
            layerOrder, layer_order: layerOrder,
            points,
            style: { ...defaultElementStyle.pencil },
          });
          const nextElements = [...state.elements, element];
          return { ...withHistory(state, nextElements), selectedElementId: element.id };
        }),

      selectElement: (selectedElementId) => set({ selectedElementId }),
      setSelectedElementId: (selectedElementId) => set({ selectedElementId }),

      setWorkspace: (workspace) =>
        set({ workspace, workspaceName: workspace?.name ?? get().workspaceName }),

      setWorkspaceAccess: (accessLevel) =>
        set({ accessLevel, canEdit: accessLevel === "edit" }),

      setElements: (elements) =>
        set((state) => {
          const next = normalizeElements(elements);
          const selectedElementId = next.find((el) => el.id === state.selectedElementId)
            ? state.selectedElementId : null;
          return { ...setElementCollections(next), selectedElementId };
        }),

      setLoading: (loading) => set({ loading }),

      clear: () =>
        set({
          workspace: null, workspaceName: "My Workspace",
          accessLevel: "edit", canEdit: true,
          elements: [], elementList: [], selectedElementId: null,
          loading: false, history: [], historyIndex: -1,
        }),

      addElement: (type, extra) =>
        set((state) => {
          const nextElement = createElement(type, state.elements.length, extra);
          const nextElements = [...state.elements, nextElement];
          return { ...withHistory(state, nextElements), selectedElementId: nextElement.id };
        }),

      updateElement: (elementId, updates) =>
        set((state) => {
          const nextElements = state.elements.map((el) => {
            if (el.id !== elementId) return el;
            const u = updates as Partial<CanvasElement> & { style?: Partial<CanvasElementStyle> };
            return withCompatFields({
              ...el, ...u,
              label: u.label ?? u.name ?? el.label,
              name: u.name ?? u.label ?? el.name,
              layerOrder: u.layerOrder ?? u.layer_order ?? el.layerOrder,
              layer_order: u.layer_order ?? u.layerOrder ?? el.layer_order,
              style: u.style ? { ...el.style, ...u.style } : el.style,
            });
          });
          return withHistory(state, nextElements);
        }),

      updateElementStyle: (elementId, style) =>
        set((state) => {
          const nextElements = state.elements.map((el) =>
            el.id === elementId ? withCompatFields({ ...el, style: { ...el.style, ...style } }) : el
          );
          return withHistory(state, nextElements);
        }),

      reorderElement: (elementId, direction) =>
        set((state) => {
          const ordered = [...state.elements].sort((a, b) => a.layerOrder - b.layerOrder);
          const currentIndex = ordered.findIndex((el) => el.id === elementId);
          if (currentIndex === -1) return state;
          const targetIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
          if (targetIndex < 0 || targetIndex >= ordered.length) return state;
          const [moved] = ordered.splice(currentIndex, 1);
          ordered.splice(targetIndex, 0, moved);
          const nextElements = ordered.map((el, i) =>
            withCompatFields({ ...el, layerOrder: i, layer_order: i })
          );
          return withHistory(state, nextElements);
        }),

      copySelectedElement: () => {
        const state = get();
        const selected = state.elements.find((el) => el.id === state.selectedElementId);
        if (!selected) return;
        set({ clipboard: { ...selected, style: { ...selected.style } } });
      },

      pasteElement: () =>
        set((state) => {
          if (!state.clipboard) return state;
          const pasted: CanvasElement = withCompatFields({
            ...state.clipboard,
            id: createId(state.clipboard.type),
            name: `${state.clipboard.name} Copy`,
            label: `${state.clipboard.label} Copy`,
            x: state.clipboard.x + 24,
            y: state.clipboard.y + 24,
            layerOrder: state.elements.length,
            layer_order: state.elements.length,
            style: { ...state.clipboard.style },
          });
          const nextElements = [...state.elements, pasted];
          return { ...withHistory(state, nextElements), selectedElementId: pasted.id };
        }),

      duplicateSelectedElement: () =>
        set((state) => {
          const selected = state.elements.find((el) => el.id === state.selectedElementId);
          if (!selected) return state;
          const duplicate: CanvasElement = withCompatFields({
            ...selected,
            id: createId(selected.type),
            name: `${selected.name} Copy`,
            label: `${selected.label} Copy`,
            x: selected.x + 24, y: selected.y + 24,
            layerOrder: state.elements.length,
            layer_order: state.elements.length,
            style: { ...selected.style },
          });
          const nextElements = [...state.elements, duplicate];
          return { ...withHistory(state, nextElements), selectedElementId: duplicate.id };
        }),

      deleteSelectedElement: () =>
        set((state) => {
          if (!state.selectedElementId) return state;
          const remaining = normalizeElements(
            state.elements
              .filter((el) => el.id !== state.selectedElementId)
              .map((el, i) => withCompatFields({ ...el, layerOrder: i, layer_order: i }))
          );
          return { ...withHistory(state, remaining), selectedElementId: remaining.at(-1)?.id ?? null };
        }),

      deleteElement: (id) =>
        set((state) => {
          const remaining = normalizeElements(
            state.elements
              .filter((el) => el.id !== id)
              .map((el, i) => withCompatFields({ ...el, layerOrder: i, layer_order: i }))
          );
          const selectedElementId = state.selectedElementId === id
            ? (remaining.at(-1)?.id ?? null)
            : state.selectedElementId;
          return { ...withHistory(state, remaining), selectedElementId };
        }),

      partialErasePencilStroke: (id, segments) =>
        set((state) => {
          const element = state.elements.find((el) => el.id === id);
          if (!element) return state;
          const without = state.elements.filter((el) => el.id !== id);
          const newElements = segments.map((pts, i) => {
            const layerOrder = without.length + i;
            const name = `Pencil ${layerOrder + 1}`;
            return withCompatFields({
              id: createId("pencil"),
              name, label: name, type: "pencil" as const,
              x: 0, y: 0, width: 0, height: 0,
              rotation: 0, visible: true, locked: false,
              layerOrder, layer_order: layerOrder,
              points: pts,
              style: { ...element.style },
            });
          });
          const nextElements = normalizeElements([...without, ...newElements]);
          const selectedElementId = state.selectedElementId === id ? null : state.selectedElementId;
          return { ...withHistory(state, nextElements), selectedElementId };
        }),

      toggleVisibility: (elementId) =>
        set((state) => {
          const nextElements = state.elements.map((el) =>
            el.id === elementId ? withCompatFields({ ...el, visible: !el.visible }) : el
          );
          return withHistory(state, nextElements);
        }),

      toggleLock: (elementId) =>
        set((state) => {
          const nextElements = state.elements.map((el) =>
            el.id === elementId ? withCompatFields({ ...el, locked: !el.locked }) : el
          );
          return withHistory(state, nextElements);
        }),

      updateLayerOrder: (elements) =>
        set((state) => withHistory(state, normalizeElements(elements))),

      setCanvasBackground: (canvasBackground) => set({ canvasBackground }),
      setCanvasDimensions: (canvasDimensions) => set({ canvasDimensions }),

      undo: () =>
        set((state) => {
          if (state.historyIndex <= 0) return state;
          const prevIndex = state.historyIndex - 1;
          const prevElements = cloneElements(state.history[prevIndex]);
          return { ...setElementCollections(prevElements), historyIndex: prevIndex };
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          const nextIndex = state.historyIndex + 1;
          const nextElements = cloneElements(state.history[nextIndex]);
          return { ...setElementCollections(nextElements), historyIndex: nextIndex };
        }),
        
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
    }),
    {
      name: "collabcanvas-workspace",
      partialize: (state) => ({
        elements: state.elements,
        elementList: state.elementList,
        workspaceName: state.workspaceName,
        canvasBackground: state.canvasBackground,
        canvasDimensions: state.canvasDimensions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.elementList = normalizeElements(state.elements);
          state.history = [cloneElements(state.elements)];
          state.historyIndex = 0;
        }
      },
    }
  )
);
