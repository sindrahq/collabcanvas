import { supabase } from "./supabaseClient";

export type WorkspaceComment = {
	id: string;
	workspaceId: string;
	authorId: string;
	authorName: string;
	authorEmail: string | null;
	message: string;
	targetElementId: string | null;
	createdAt: string;
	updatedAt: string;
	resolved: boolean;
	resolvedAt: string | null;
};

type WorkspaceCommentRow = {
	id?: string;
	workspace_id?: string;
	author_id?: string;
	author_name?: string;
	author_email?: string | null;
	message?: string;
	target_element_id?: string | null;
	created_at?: string;
	updated_at?: string;
	resolved?: boolean;
	resolved_at?: string | null;
};

type CommentAuthor = {
	id: string;
	name: string;
	email?: string | null;
};

function mapCommentRow(row: WorkspaceCommentRow): WorkspaceComment | null {
	if (!row.id || !row.workspace_id || !row.author_id || !row.message) {
		return null;
	}

	return {
		id: row.id,
		workspaceId: row.workspace_id,
		authorId: row.author_id,
		authorName: row.author_name ?? "User",
		authorEmail: row.author_email ?? null,
		message: row.message,
		targetElementId: row.target_element_id ?? null,
		createdAt: row.created_at ?? new Date().toISOString(),
		updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
		resolved: row.resolved ?? false,
		resolvedAt: row.resolved_at ?? null,
	};
}

export async function loadWorkspaceComments(workspaceId: string): Promise<WorkspaceComment[]> {
	const { data, error } = await supabase
		.from("workspace_comments")
		.select("id, workspace_id, author_id, author_name, author_email, message, target_element_id, created_at, updated_at, resolved, resolved_at")
		.eq("workspace_id", workspaceId)
		.order("created_at", { ascending: true });

	if (error || !data) {
		return [];
	}

	return (data as WorkspaceCommentRow[])
		.map(mapCommentRow)
		.filter((comment): comment is WorkspaceComment => Boolean(comment));
}

export async function createWorkspaceComment(
	workspaceId: string,
	author: CommentAuthor,
	message: string,
	targetElementId: string | null
): Promise<WorkspaceComment | null> {
	const { data, error } = await supabase
		.from("workspace_comments")
		.insert({
			workspace_id: workspaceId,
			author_id: author.id,
			author_name: author.name,
			author_email: author.email ?? null,
			message: message.trim(),
			target_element_id: targetElementId,
			resolved: false,
		})
		.select("id, workspace_id, author_id, author_name, author_email, message, target_element_id, created_at, updated_at, resolved, resolved_at")
		.single();

	if (error || !data) {
		return null;
	}

	return mapCommentRow(data as WorkspaceCommentRow);
}