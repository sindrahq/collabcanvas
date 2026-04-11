"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────

export type WorkspaceMeta = { id: string; name: string; owner_id: string };

export type CanvasElementType =
  | "rectangle" | "circle" | "text"
  | "triangle" | "star" | "arrow" | "line";

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
};

type WorkspaceState = {
  workspace: WorkspaceMeta | null;
  workspaceName: string;
  selectedElementId: string | null;
  elements: CanvasElement[];
  elementList: CanvasElement[];
  loading: boolean;
  history: CanvasElement[][];
  historyIndex: number;
  canvasBackground: string;
  canvasDimensions: { width: number; height: number };
  selectElement: (elementId: string | null) => void;
  setSelectedElementId: (elementId: string | null) => void;
  setWorkspace: (workspace: WorkspaceMeta | null) => void;
  setElements: (elements: CanvasElement[]) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  addElement: (type: CanvasElementType) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  updateElementStyle: (elementId: string, style: Partial<CanvasElementStyle>) => void;
  reorderElement: (elementId: string, direction: "forward" | "backward") => void;
  duplicateSelectedElement: () => void;
  deleteSelectedElement: () => void;
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  updateLayerOrder: (elements: CanvasElement[]) => void;
  setCanvasBackground: (color: string) => void;
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  undo: () => void;
  redo: () => void;
};

// ── Defaults ───────────────────────────────────────────────────────────────

const BASE_FONT = {
  fontFamily: "Inter",
  fontStyle: "normal" as const,
  fontWeight: "normal" as const,
  textAlign: "left" as const,
};

const BASE_SHADOW = {
  shadowEnabled: false,
  shadowBlur: 16,
  shadowColor: "rgba(20,32,28,0.3)",
  shadowOffsetX: 0,
  shadowOffsetY: 6,
};

const defaultElementStyle = {
  rectangle: { fill: "#cfe1df", stroke: "#1f6f78", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW },
  circle:    { fill: "#f0dcc3", stroke: "#b36a21", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW },
  text:      { fill: "#1e2523", stroke: "transparent", strokeWidth: 0, opacity: 1, fontSize: 28, ...BASE_FONT, textAlign: "center" as const, ...BASE_SHADOW },
  triangle:  { fill: "#d4c3f0", stroke: "#6b3fa0", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW },
  star:      { fill: "#f5e6a3", stroke: "#b89600", strokeWidth: 2, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW },
  arrow:     { fill: "#a8d4f0", stroke: "#1a6fa0", strokeWidth: 3, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW },
  line:      { fill: "transparent", stroke: "#637069", strokeWidth: 3, opacity: 1, fontSize: 16, ...BASE_FONT, ...BASE_SHADOW },
} satisfies Record<CanvasElementType, CanvasElementStyle>;

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

function createElement(type: CanvasElementType, layerOrder: number): CanvasElement {
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
  });
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
      selectedElementId: starterElements[2]?.id ?? null,
      elements: starterElements,
      elementList: starterElements,
      loading: false,
      history: [cloneElements(starterElements)],
      historyIndex: 0,
      canvasBackground: "#fffdf8",
      canvasDimensions: { width: 1280, height: 800 },

      selectElement: (selectedElementId) => set({ selectedElementId }),
      setSelectedElementId: (selectedElementId) => set({ selectedElementId }),

      setWorkspace: (workspace) =>
        set({ workspace, workspaceName: workspace?.name ?? get().workspaceName }),

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
          elements: [], elementList: [], selectedElementId: null,
          loading: false, history: [], historyIndex: -1,
        }),

      addElement: (type) =>
        set((state) => {
          const nextElement = createElement(type, state.elements.length);
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
