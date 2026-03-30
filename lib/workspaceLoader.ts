
import type { CanvasElement, WorkspaceMeta } from '../types/canvas.ts';


import { supabase } from './supabaseClient.ts';
import { useWorkspaceStore } from '../store/workspaceStore.ts';

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
	console.log('[loadWorkspace] Called with workspaceId:', workspaceId);
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
		console.log('[loadWorkspace] Workspace fetch result:', { workspace, workspaceError });

		if (workspaceError || !workspace) {
			console.error('Error fetching workspace metadata:', workspaceError);
			if (redirect404) redirect404();
			store.setLoading(false);
			return;
		}
		console.log('[loadWorkspace] Workspace found:', workspace);
		store.setWorkspace(workspace);

		// 2. Fetch all canvas elements for this workspace, ordered by layer_order

		const { data: elements, error: elementsError } = await supabase
			.from('canvas_elements')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('layer_order', { ascending: true });
		console.log('[loadWorkspace] Canvas elements fetch result:', { elements, elementsError });

		if (elementsError) {
			console.error('Error fetching canvas elements:', elementsError);
			store.setElements([]);
			store.setLoading(false);
			return;
		}
		console.log('[loadWorkspace] Elements found:', elements);

		// 3. Hydrate Zustand store
		store.setElements((elements || []) as CanvasElement[]);
		store.setSelectedElementId(null); // Reset selection
		console.log('[loadWorkspace] Zustand store hydrated.');
	} catch (err) {
		console.error('Unexpected error loading workspace:', err);
		store.setWorkspace(null);
		store.setElements([]);
	} finally {
		store.setLoading(false);
	}
}

