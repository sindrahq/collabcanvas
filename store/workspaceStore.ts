"use client";

import { create } from "zustand";
import type { WorkspaceMeta } from "../types/canvas";

export type CanvasElementType = "rectangle" | "circle" | "text" | "triangle" | "star" | "arrow" | "diamond" | "image";

export type CanvasElementStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
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
  imageUrl?: string;
  style: CanvasElementStyle;
};

export type WorkspaceSnapshot = {
  id: string;
  label: string;
  createdAt: string;
  elements: CanvasElement[];
  selectedElementId: string | null;
};

type WorkspaceState = {
  workspace: WorkspaceMeta | null;
  workspaceName: string;
  selectedElementId: string | null;
  elements: CanvasElement[];
  elementList: CanvasElement[];
  snapshots: WorkspaceSnapshot[];
  loading: boolean;
  selectElement: (elementId: string | null) => void;
  setSelectedElementId: (elementId: string | null) => void;
  setWorkspace: (workspace: WorkspaceMeta | null) => void;
  setElements: (elements: CanvasElement[]) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  addElement: (type: CanvasElementType) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  reorderElement: (elementId: string, direction: "forward" | "backward") => void;
  duplicateSelectedElement: () => void;
  deleteSelectedElement: () => void;
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  saveSnapshot: () => void;
  restoreSnapshot: (snapshotId: string) => void;
};

const defaultElementStyle = {
  rectangle: {
    fill: "#cfe1df",
    stroke: "#1f6f78",
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16
  },
  circle: {
    fill: "#f0dcc3",
    stroke: "#b36a21",
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16
  },
  text: {
    fill: "#1e2523",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    fontSize: 28
  },
  triangle: {
    fill: "#c4b5fd",
    stroke: "#7c6cfc",
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16
  },
  star: {
    fill: "#fde68a",
    stroke: "#f59e0b",
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16
  },
  arrow: {
    fill: "#a5f3fc",
    stroke: "#0891b2",
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16
  },
  diamond: {
    fill: "#fca5a5",
    stroke: "#e05555",
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16
  },
  image: {
    fill: "transparent",
    stroke: "#7c6cfc",
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16
  }
} satisfies Record<CanvasElementType, CanvasElementStyle>;

function withCompatFields(element: CanvasElement): CanvasElement {
  return {
    ...element,
    name: element.name ?? element.label,
    label: element.label ?? element.name,
    layerOrder: element.layerOrder ?? element.layer_order,
    layer_order: element.layer_order ?? element.layerOrder
  };
}

function normalizeElements(elements: CanvasElement[]) {
  return elements.map((element, index) =>
    withCompatFields({
      ...element,
      layerOrder: element.layerOrder ?? index,
      layer_order: element.layer_order ?? element.layerOrder ?? index,
      label: element.label ?? element.name,
      name: element.name ?? element.label
    })
  );
}

function createId(_prefix: string) {
  return crypto.randomUUID();
}

function createElement(type: CanvasElementType, layerOrder: number): CanvasElement {
  const isText = type === "text";
  const isCircle = type === "circle";
  const isImage = type === "image";
  const label = `${type[0].toUpperCase()}${type.slice(1)} ${layerOrder + 1}`;

  return withCompatFields({
    id: createId(type),
    name: label,
    label,
    type,
    x: 72 + layerOrder * 28,
    y: 72 + layerOrder * 22,
    width: isText ? 240 : isCircle ? 120 : isImage ? 200 : 120,
    height: isText ? 72 : isCircle ? 120 : isImage ? 200 : 120,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder,
    layer_order: layerOrder,
    text: isText ? "New text block" : undefined,
    imageUrl: undefined,
    style: { ...defaultElementStyle[type] }
  });
}

function cloneElements(elements: CanvasElement[]) {
  return normalizeElements(
    elements.map((element) => ({
      ...element,
      style: { ...element.style }
    }))
  );
}

const starterElements: CanvasElement[] = normalizeElements([
  {
    id: "hero-rect",
    name: "Rectangle 1",
    label: "Rectangle 1",
    type: "rectangle",
    x: 80,
    y: 84,
    width: 280,
    height: 148,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 0,
    layer_order: 0,
    style: { ...defaultElementStyle.rectangle }
  },
  {
    id: "hero-circle",
    name: "Circle 1",
    label: "Circle 1",
    type: "circle",
    x: 410,
    y: 110,
    width: 118,
    height: 118,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 1,
    layer_order: 1,
    style: { ...defaultElementStyle.circle }
  },
  {
    id: "welcome-copy",
    name: "Text 1",
    label: "Text 1",
    type: "text",
    x: 200,
    y: 280,
    width: 280,
    height: 90,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 2,
    layer_order: 2,
    text: "Workspace store branch ready",
    style: { ...defaultElementStyle.text }
  }
]);

function setElementCollections(elements: CanvasElement[]) {
  const normalized = normalizeElements(elements);
  return {
    elements: normalized,
    elementList: normalized
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspace: null,
  workspaceName: "Harsh Workspace",
  selectedElementId: starterElements[2]?.id ?? null,
  elements: starterElements,
  elementList: starterElements,
  snapshots: [],
  loading: false,

  selectElement: (selectedElementId) => set({ selectedElementId }),
  setSelectedElementId: (selectedElementId) => set({ selectedElementId }),

  setWorkspace: (workspace) =>
    set({
      workspace,
      workspaceName: workspace?.name ?? get().workspaceName
    }),

  setElements: (elements) =>
    set((state) => {
      const next = normalizeElements(elements);
      const selectedElementId = next.find((e) => e.id === state.selectedElementId)
        ? state.selectedElementId
        : null;
      return { ...setElementCollections(next), selectedElementId };
    }),

  setLoading: (loading) => set({ loading }),

  clear: () =>
    set({
      workspace: null,
      workspaceName: "Harsh Workspace",
      elements: [],
      elementList: [],
      selectedElementId: null,
      snapshots: [],
      loading: false
    }),

  addElement: (type) =>
    set((state) => {
      const nextElement = createElement(type, state.elements.length);
      const nextElements = [...state.elements, nextElement];
      return {
        ...setElementCollections(nextElements),
        selectedElementId: nextElement.id
      };
    }),

  updateElement: (elementId, updates) =>
    set((state) => {
      const nextElements = state.elements.map((element) =>
        element.id === elementId
          ? withCompatFields({
              ...element,
              ...updates,
              label: updates.label ?? updates.name ?? element.label,
              name: updates.name ?? updates.label ?? element.name,
              layerOrder: updates.layerOrder ?? updates.layer_order ?? element.layerOrder,
              layer_order: updates.layer_order ?? updates.layerOrder ?? element.layer_order,
              style: updates.style ? { ...element.style, ...updates.style } : element.style
            })
          : element
      );
      return setElementCollections(nextElements);
    }),

  reorderElement: (elementId, direction) =>
    set((state) => {
      const ordered = [...state.elements].sort((a, b) => a.layerOrder - b.layerOrder);
      const currentIndex = ordered.findIndex((e) => e.id === elementId);
      if (currentIndex === -1) return state;
      const targetIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return state;
      const [moved] = ordered.splice(currentIndex, 1);
      ordered.splice(targetIndex, 0, moved);
      return setElementCollections(
        ordered.map((element, index) =>
          withCompatFields({ ...element, layerOrder: index, layer_order: index })
        )
      );
    }),

  duplicateSelectedElement: () =>
    set((state) => {
      const selected = state.elements.find((e) => e.id === state.selectedElementId);
      if (!selected) return state;
      const duplicate: CanvasElement = withCompatFields({
        ...selected,
        id: createId(selected.type),
        name: `${selected.name} Copy`,
        label: `${selected.label} Copy`,
        x: selected.x + 24,
        y: selected.y + 24,
        layerOrder: state.elements.length,
        layer_order: state.elements.length,
        style: { ...selected.style }
      });
      return {
        ...setElementCollections([...state.elements, duplicate]),
        selectedElementId: duplicate.id
      };
    }),

  deleteSelectedElement: () =>
    set((state) => {
      if (!state.selectedElementId) return state;
      const remaining = normalizeElements(
        state.elements
          .filter((e) => e.id !== state.selectedElementId)
          .map((e, index) => withCompatFields({ ...e, layerOrder: index, layer_order: index }))
      );
      return {
        ...setElementCollections(remaining),
        selectedElementId: remaining.at(-1)?.id ?? null
      };
    }),

  toggleVisibility: (elementId) =>
    set((state) => {
      const nextElements = state.elements.map((e) =>
        e.id === elementId ? withCompatFields({ ...e, visible: !e.visible }) : e
      );
      return setElementCollections(nextElements);
    }),

  toggleLock: (elementId) =>
    set((state) => {
      const nextElements = state.elements.map((e) =>
        e.id === elementId ? withCompatFields({ ...e, locked: !e.locked }) : e
      );
      return setElementCollections(nextElements);
    }),

  saveSnapshot: () =>
    set((state) => {
      const snapshot: WorkspaceSnapshot = {
        id: createId("snapshot"),
        label: `Snapshot ${state.snapshots.length + 1}`,
        createdAt: new Date().toLocaleString(),
        elements: cloneElements(state.elements),
        selectedElementId: state.selectedElementId
      };
      return { snapshots: [snapshot, ...state.snapshots].slice(0, 6) };
    }),

  restoreSnapshot: (snapshotId) =>
    set((state) => {
      const snapshot = state.snapshots.find((s) => s.id === snapshotId);
      if (!snapshot) return state;
      return {
        ...setElementCollections(cloneElements(snapshot.elements)),
        selectedElementId: snapshot.selectedElementId
      };
    })
}));

export function getWorkspaceExport() {
  const state = useWorkspaceStore.getState();
  return JSON.stringify(
    {
      workspace: state.workspace,
      workspaceName: state.workspaceName,
      selectedElementId: state.selectedElementId,
      elements: state.elements,
      snapshots: state.snapshots
    },
    null,
    2
  );
}