import type { CanvasElement } from "@/store/workspaceStore";

export const LOCAL_PROJECTS_KEY = "collabcanvas_guest_projects";
export const LOCAL_OWNER_KEY = "collabcanvas_guest_owner_id";
const LOCAL_WORKSPACE_SNAPSHOTS_KEY = "collabcanvas_workspace_snapshots_v1";

export type LocalWorkspaceSnapshot = {
  workspaceId: string;
  workspaceName: string;
  elements: CanvasElement[];
  selectedElementId: string | null;
  updatedAt: string;
};

type LocalProjectRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  storage?: "local";
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getLocalOwnerId(): string {
  if (!canUseStorage()) return "";

  const existing = window.localStorage.getItem(LOCAL_OWNER_KEY);
  if (existing) return existing;

  const generated = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `guest-${Date.now()}`;

  window.localStorage.setItem(LOCAL_OWNER_KEY, generated);
  return generated;
}

export function loadAllLocalWorkspaceSnapshots(): Record<string, LocalWorkspaceSnapshot> {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(LOCAL_WORKSPACE_SNAPSHOTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalWorkspaceSnapshot>) : {};
  } catch {
    return {};
  }
}

export function loadLocalWorkspaceSnapshot(workspaceId: string): LocalWorkspaceSnapshot | null {
  const all = loadAllLocalWorkspaceSnapshots();
  return all[workspaceId] ?? null;
}

export function saveLocalWorkspaceSnapshot(snapshot: LocalWorkspaceSnapshot): void {
  if (!canUseStorage()) return;
  const all = loadAllLocalWorkspaceSnapshots();
  all[snapshot.workspaceId] = snapshot;
  window.localStorage.setItem(LOCAL_WORKSPACE_SNAPSHOTS_KEY, JSON.stringify(all));
}

export function loadAllLocalProjects(): LocalProjectRow[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as LocalProjectRow[]) : [];
  } catch {
    return [];
  }
}

export function upsertLocalProject(project: LocalProjectRow): void {
  if (!canUseStorage()) return;
  const all = loadAllLocalProjects();
  const index = all.findIndex((item) => item.id === project.id);
  if (index >= 0) {
    all[index] = project;
  } else {
    all.push(project);
  }
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(all));
}

export function touchLocalProject(workspaceId: string, workspaceName: string): void {
  if (!canUseStorage()) return;

  const ownerId = getLocalOwnerId();
  const nowIso = new Date().toISOString();
  const all = loadAllLocalProjects();
  const existing = all.find((project) => project.id === workspaceId);

  upsertLocalProject({
    id: workspaceId,
    name: workspaceName || existing?.name || "Untitled Project",
    owner_id: existing?.owner_id || ownerId,
    created_at: existing?.created_at || nowIso,
    updated_at: nowIso,
    storage: "local",
  });
}

export function getLocalProjectName(workspaceId: string): string | null {
  const project = loadAllLocalProjects().find((item) => item.id === workspaceId);
  return project?.name ?? null;
}