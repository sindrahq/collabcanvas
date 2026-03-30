<<<<<<< HEAD
import { create } from 'zustand';
import type { CanvasElement, WorkspaceMeta } from '../types/canvas.ts';

interface WorkspaceStore {
	workspace: WorkspaceMeta | null;
	elements: CanvasElement[];
	selectedElementId: string | null;
	loading: boolean;
	setWorkspace: (workspace: WorkspaceMeta | null) => void;
	setElements: (elements: CanvasElement[]) => void;
	setSelectedElementId: (id: string | null) => void;
	setLoading: (loading: boolean) => void;
	clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
	workspace: null,
	elements: [],
	selectedElementId: null,
	loading: false,
	setWorkspace: (workspace) => set({ workspace }),
	setElements: (elements) => set({ elements }),
	setSelectedElementId: (id) => set({ selectedElementId: id }),
	setLoading: (loading) => set({ loading }),
	clear: () => set({ workspace: null, elements: [], selectedElementId: null, loading: false }),
}));
=======
import { create } from "zustand"

export type ElementStyle = {
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  fontSize: number
}

export type CanvasElement = {
  id: string
  type: "rect" | "circle" | "text"
  x: number
  y: number
  width: number
  height: number
  style: ElementStyle
  layer_order: number
  visible: boolean
  locked: boolean
  label: string
}

type WorkspaceStore = {
  selectedElementId: string | null
  elementList: CanvasElement[]
  setSelectedElement: (id: string | null) => void
  updateElementStyle: (id: string, style: Partial<ElementStyle>) => void
  updateLayerOrder: (elements: CanvasElement[]) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  selectedElementId: "1",

  elementList: [
    {
      id: "1",
      type: "rect",
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      style: { fill: "#4f46e5", stroke: "#000000", strokeWidth: 2, opacity: 1, fontSize: 16 },
      layer_order: 1,
      visible: true,
      locked: false,
      label: "Rectangle 1",
    },
    {
      id: "2",
      type: "circle",
      x: 400,
      y: 200,
      width: 100,
      height: 100,
      style: { fill: "#10b981", stroke: "#000000", strokeWidth: 2, opacity: 0.8, fontSize: 16 },
      layer_order: 2,
      visible: true,
      locked: false,
      label: "Circle 1",
    },
    {
      id: "3",
      type: "text",
      x: 300,
      y: 400,
      width: 150,
      height: 50,
      style: { fill: "#f59e0b", stroke: "#000000", strokeWidth: 1, opacity: 1, fontSize: 24 },
      layer_order: 3,
      visible: false,
      locked: true,
      label: "Text 1",
    },
  ],

  setSelectedElement: (id) => set({ selectedElementId: id }),

  updateElementStyle: (id, style) =>
    set((state) => ({
      elementList: state.elementList.map((el) =>
        el.id === id ? { ...el, style: { ...el.style, ...style } } : el
      ),
    })),

  updateLayerOrder: (elements) => set({ elementList: elements }),

  toggleVisibility: (id) =>
    set((state) => ({
      elementList: state.elementList.map((el) =>
        el.id === id ? { ...el, visible: !el.visible } : el
      ),
    })),

  toggleLock: (id) =>
    set((state) => ({
      elementList: state.elementList.map((el) =>
        el.id === id ? { ...el, locked: !el.locked } : el
      ),
    })),
}))
>>>>>>> chetna
