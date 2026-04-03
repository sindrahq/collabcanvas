import { supabase } from "./supabaseClient";
import { type CanvasElement, useWorkspaceStore } from "../store/workspaceStore";

export type WorkspaceHistorySnapshot = {
	id: string;
	workspaceId: string;
	label: string;
	createdAt: string;
	elements: CanvasElement[];
	selectedElementId: string | null;
};

type WorkspaceHistoryRow = {
	id?: string;
	workspace_id?: string;
	label?: string;
	created_at?: string;
	snapshot?: {
		elements?: CanvasElement[];
		selectedElementId?: string | null;
		workspaceName?: string;
	};
};

type SnapshotPayload = {
	elements: CanvasElement[];
	selectedElementId: string | null;
	workspaceName?: string;
};

function asHistorySnapshot(row: WorkspaceHistoryRow): WorkspaceHistorySnapshot | null {
	if (!row.id || !row.workspace_id || !row.snapshot?.elements) {
		return null;
	}

	return {
		id: row.id,
		workspaceId: row.workspace_id,
		label: row.label ?? "Snapshot",
		createdAt: row.created_at ?? new Date().toISOString(),
		elements: row.snapshot.elements,
		selectedElementId: row.snapshot.selectedElementId ?? null
	};
}

export async function saveWorkspaceHistorySnapshot(
	workspaceId: string,
	payload: SnapshotPayload,
	label = "Autosave"
): Promise<WorkspaceHistorySnapshot | null> {
	const { data, error } = await supabase
		.from("workspace_history")
		.insert({
			workspace_id: workspaceId,
			label,
			snapshot: payload
		})
		.select("id, workspace_id, label, created_at, snapshot")
		.single();

	if (error || !data) {
		return null;
	}

	return asHistorySnapshot(data as WorkspaceHistoryRow);
}

export async function loadWorkspaceHistorySnapshots(
	workspaceId: string,
	limit = 20
): Promise<WorkspaceHistorySnapshot[]> {
	const { data, error } = await supabase
		.from("workspace_history")
		.select("id, workspace_id, label, created_at, snapshot")
		.eq("workspace_id", workspaceId)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error || !data) {
		return [];
	}

	return (data as WorkspaceHistoryRow[])
		.map(asHistorySnapshot)
		.filter((snapshot): snapshot is WorkspaceHistorySnapshot => Boolean(snapshot));
}

export function restoreWorkspaceHistorySnapshot(snapshot: WorkspaceHistorySnapshot): void {
	const store = useWorkspaceStore.getState();
	store.setElements(snapshot.elements);
	store.setSelectedElementId(snapshot.selectedElementId);
}
