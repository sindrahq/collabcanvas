"use client";

import { create } from "zustand";

import type { WorkspaceMeta } from "../types/canvas";

export type CanvasElementType = "rectangle" | "circle" | "text";

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
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  layerOrder: number;
  text?: string;
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
  duplicateSelectedElement: () => void;
  deleteSelectedElement: () => void;
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  reorderElement: (elementId: string, direction: "forward" | "backward") => void;
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
  }
} satisfies Record<CanvasElementType, CanvasElementStyle>;

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function createElement(type: CanvasElementType, layerOrder: number): CanvasElement {
  const isText = type === "text";

  return {
    id: createId(type),
    name: `${type[0].toUpperCase()}${type.slice(1)} ${layerOrder + 1}`,
    type,
    x: 72 + layerOrder * 28,
    y: 72 + layerOrder * 22,
    width: isText ? 240 : 180,
    height: isText ? 72 : 120,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder,
    text: isText ? "New text block" : undefined,
    style: { ...defaultElementStyle[type] }
  };
}

function cloneElements(elements: CanvasElement[]) {
  return elements.map((element) => ({
    ...element,
    style: { ...element.style }
  }));
}

const starterElements: CanvasElement[] = [
  {
    id: "hero-rect",
    name: "Rectangle 1",
    type: "rectangle",
    x: 80,
    y: 84,
    width: 280,
    height: 148,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 0,
    style: { ...defaultElementStyle.rectangle }
  },
  {
    id: "hero-circle",
    name: "Circle 1",
    type: "circle",
    x: 410,
    y: 110,
    width: 118,
    height: 118,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 1,
    style: { ...defaultElementStyle.circle }
  },
  {
    id: "welcome-copy",
    name: "Text 1",
    type: "text",
    x: 200,
    y: 280,
    width: 280,
    height: 90,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: 2,
    text: "Workspace store branch ready",
    style: { ...defaultElementStyle.text }
  }
];

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspace: null,
  workspaceName: "Harsh Workspace",
  selectedElementId: starterElements[2]?.id ?? null,
  elements: starterElements,
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
    set({
      elements,
      selectedElementId: elements.find((element) => element.id === get().selectedElementId)
        ? get().selectedElementId
        : null
    }),
  setLoading: (loading) => set({ loading }),
  clear: () =>
    set({
      workspace: null,
      workspaceName: "Harsh Workspace",
      elements: [],
      selectedElementId: null,
      snapshots: [],
      loading: false
    }),
  addElement: (type) =>
    set((state) => {
      const nextElement = createElement(type, state.elements.length);

      return {
        elements: [...state.elements, nextElement],
        selectedElementId: nextElement.id
      };
    }),
  updateElement: (elementId, updates) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === elementId
          ? {
              ...element,
              ...updates,
              style: updates.style ? { ...element.style, ...updates.style } : element.style
            }
          : element
      )
    })),
  duplicateSelectedElement: () =>
    set((state) => {
      const selected = state.elements.find((element) => element.id === state.selectedElementId);

      if (!selected) {
        return state;
      }

      const duplicate: CanvasElement = {
        ...selected,
        id: createId(selected.type),
        name: `${selected.name} Copy`,
        x: selected.x + 24,
        y: selected.y + 24,
        layerOrder: state.elements.length,
        style: { ...selected.style }
      };

      return {
        elements: [...state.elements, duplicate],
        selectedElementId: duplicate.id
      };
    }),
  deleteSelectedElement: () =>
    set((state) => {
      if (!state.selectedElementId) {
        return state;
      }

      const remaining = state.elements
        .filter((element) => element.id !== state.selectedElementId)
        .map((element, index) => ({
          ...element,
          layerOrder: index
        }));

      return {
        elements: remaining,
        selectedElementId: remaining.at(-1)?.id ?? null
      };
    }),
  toggleVisibility: (elementId) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === elementId ? { ...element, visible: !element.visible } : element
      )
    })),
  toggleLock: (elementId) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === elementId ? { ...element, locked: !element.locked } : element
      )
    })),
  reorderElement: (elementId, direction) =>
    set((state) => {
      const ordered = [...state.elements].sort((a, b) => a.layerOrder - b.layerOrder);
      const currentIndex = ordered.findIndex((element) => element.id === elementId);

      if (currentIndex === -1) {
        return state;
      }

      const targetIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;

      if (targetIndex < 0 || targetIndex >= ordered.length) {
        return state;
      }

      const [movedElement] = ordered.splice(currentIndex, 1);
      ordered.splice(targetIndex, 0, movedElement);

      return {
        elements: ordered.map((element, index) => ({
          ...element,
          layerOrder: index
        }))
      };
    }),
  saveSnapshot: () =>
    set((state) => {
      const snapshotNumber = state.snapshots.length + 1;
      const snapshot: WorkspaceSnapshot = {
        id: createId("snapshot"),
        label: `Snapshot ${snapshotNumber}`,
        createdAt: new Date().toLocaleString(),
        elements: cloneElements(state.elements),
        selectedElementId: state.selectedElementId
      };

      return {
        snapshots: [snapshot, ...state.snapshots].slice(0, 6)
      };
    }),
  restoreSnapshot: (snapshotId) =>
    set((state) => {
      const snapshot = state.snapshots.find((entry) => entry.id === snapshotId);

      if (!snapshot) {
        return state;
      }

      return {
        elements: cloneElements(snapshot.elements),
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
