// Types for canvas elements as stored in PostgreSQL
export interface CanvasElement {
	id: string;
	workspace_id: string;
	type: 'rectangle' | 'circle' | 'text';
	position: { x: number; y: number; width: number; height: number };
	style: {
		fill: string;
		stroke: string;
		strokeWidth: number;
		opacity: number;
		fontSize?: number;
	};
	layer_order: number;
	visible: boolean;
	locked: boolean;
}

// Types for workspace metadata
export interface WorkspaceMeta {
	id: string;
	name: string;
	owner_id: string;
}


import { supabase } from './supabaseClient';
import { useWorkspaceStore } from '../store/workspaceStore';

/**
 * Loads workspace metadata and canvas elements, sorted by layer_order.
 * @param workspaceId The ID of the workspace to load
 */
/**
 * Loads workspace metadata and canvas elements, sorts by layer_order, and hydrates Zustand store.
 * Handles loading state, error handling, and clean initialization.
 * @param workspaceId The ID of the workspace to load
 * @param redirect404 Optional callback for 404 handling
 */
export async function loadWorkspace(
	workspaceId: string,
	redirect404?: () => void
): Promise<void> {
	const store = useWorkspaceStore.getState();
	// Start loading and clear previous state
	store.setLoading(true);
	store.clear();
	try {
		// 1. Fetch workspace metadata
		const { data: workspace, error: workspaceError } = await supabase
			.from('workspaces')
			.select('id, name, owner_id')
			.eq('id', workspaceId)
			.single();

		if (workspaceError || !workspace) {
			console.error('Error fetching workspace metadata:', workspaceError);
			if (redirect404) redirect404();
			store.setLoading(false);
			return;
		}
		store.setWorkspace(workspace);

		// 2. Fetch all canvas elements for this workspace, ordered by layer_order
		const { data: elements, error: elementsError } = await supabase
			.from('canvas_elements')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('layer_order', { ascending: true });

		if (elementsError) {
			console.error('Error fetching canvas elements:', elementsError);
			store.setElements([]);
			store.setLoading(false);
			return;
		}

		// 3. Hydrate Zustand store
		store.setElements((elements || []) as CanvasElement[]);
		store.setSelectedElementId(null); // Reset selection
	} catch (err) {
		console.error('Unexpected error loading workspace:', err);
		store.setWorkspace(null);
		store.setElements([]);
	} finally {
		store.setLoading(false);
	}
}

