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
