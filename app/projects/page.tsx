"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import { loadAllLocalWorkspaceSnapshots } from "@/lib/localWorkspacePersistence";
import "../globals.css";

type ProjectRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  storage?: "remote" | "local";
};

type SectionKey = "my-projects" | "shared" | "trash";
type DateFilterKey = "all" | "24h" | "7d" | "30d";
type SortKey = "name-asc" | "name-desc" | "created-asc" | "created-desc";
type ViewMode = "grid" | "list";

type TrashEntry = {
  id: string;
  source: "my" | "shared";
  deletedAt: string;
};

type TrashRemoteRow = {
  workspace_id: string;
  source: "my" | "shared";
  deleted_at: string;
};

type CanvasPreviewElement = {
  id: string;
  workspace_id: string;
  type: string;
  position?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
  };
  layer_order?: number;
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const LOCAL_PROJECTS_KEY = "collabcanvas_guest_projects";
const LOCAL_SHARED_PROJECTS_KEY = "collabcanvas_shared_projects";
const LOCAL_TRASH_KEY = "collabcanvas_project_trash";

const SECTION_COPY: Record<SectionKey, { heading: string; subheading: string }> = {
  "my-projects": {
    heading: "My Projects",
    subheading: "Your personal workspace library. Manage, revisit, and continue your active projects.",
  },
  shared: {
    heading: "Shared With Me",
    subheading: "Projects shared with you by collaborators across teams and workspaces.",
  },
  trash: {
    heading: "Trash",
    subheading: "Deleted projects from My Projects and Shared With Me.",
  },
};

function formatRelativeTime(dateValue?: string | null): string {
  if (!dateValue) return "Last edited recently";
  const time = new Date(dateValue).getTime();
  if (Number.isNaN(time)) return "Last edited recently";

  const diffSeconds = Math.round((time - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) return "Last edited just now";
  if (absSeconds < 3600) return `Last edited ${rtf.format(Math.round(diffSeconds / 60), "minute")}`;
  if (absSeconds < 86400) return `Last edited ${rtf.format(Math.round(diffSeconds / 3600), "hour")}`;
  if (absSeconds < 2592000) return `Last edited ${rtf.format(Math.round(diffSeconds / 86400), "day")}`;
  return `Last edited ${rtf.format(Math.round(diffSeconds / 2592000), "month")}`;
}

function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function buildPreviewMap(elements: CanvasPreviewElement[]): Record<string, CanvasPreviewElement[]> {
  const grouped: Record<string, CanvasPreviewElement[]> = {};
  for (const element of elements) {
    if (!grouped[element.workspace_id]) grouped[element.workspace_id] = [];
    grouped[element.workspace_id].push(element);
  }

  Object.keys(grouped).forEach((workspaceId) => {
    grouped[workspaceId] = grouped[workspaceId].slice(0, 20);
  });

  return grouped;
}

function buildLocalPreviewMap(workspaceIds: string[]): Record<string, CanvasPreviewElement[]> {
  const snapshots = loadAllLocalWorkspaceSnapshots();
  const result: Record<string, CanvasPreviewElement[]> = {};

  workspaceIds.forEach((workspaceId) => {
    const snapshot = snapshots[workspaceId];
    if (!snapshot?.elements?.length) return;

    result[workspaceId] = snapshot.elements.slice(0, 20).map((element) => ({
      id: element.id,
      workspace_id: workspaceId,
      type: element.type,
      position: {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      },
      style: {
        fill: element.style.fill,
        stroke: element.style.stroke,
        strokeWidth: element.style.strokeWidth,
        opacity: element.style.opacity,
        fontSize: element.style.fontSize,
      },
      layer_order: element.layerOrder,
    }));
  });

  return result;
}

function getLocalOwnerId(): string {
  if (typeof window === "undefined") return "";

  const storageKey = "collabcanvas_guest_owner_id";
  const existingId = window.localStorage.getItem(storageKey);
  if (existingId) return existingId;

  const nextId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `guest-${Date.now()}`;

  window.localStorage.setItem(storageKey, nextId);
  return nextId;
}

function loadLocalProjects(ownerId: string): ProjectRow[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as ProjectRow[]) : [];
    return parsed
      .filter((project) => project.owner_id === ownerId)
      .map((project) => ({ ...project, storage: "local" as const }))
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  } catch {
    return [];
  }
}

function upsertLocalProject(project: ProjectRow): void {
  if (typeof window === "undefined") return;

  const all = loadAllLocalProjects();
  const existingIndex = all.findIndex((row) => row.id === project.id);
  const next = { ...project, storage: "local" as const };

  if (existingIndex >= 0) {
    all[existingIndex] = next;
  } else {
    all.push(next);
  }

  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(all));
}

function deleteLocalProject(projectId: string): void {
  if (typeof window === "undefined") return;
  const all = loadAllLocalProjects().filter((project) => project.id !== projectId);
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(all));
}

function loadAllLocalProjects(): ProjectRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as ProjectRow[]) : [];
  } catch {
    return [];
  }
}

function loadLocalSharedProjects(userId: string): ProjectRow[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_SHARED_PROJECTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Array<ProjectRow & { recipient_id?: string }>) : [];
    return parsed
      .filter((project) => project.owner_id !== userId)
      .map((project) => ({ ...project, storage: "local" as const }))
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  } catch {
    return [];
  }
}

function loadTrashEntries(): TrashEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_TRASH_KEY);
    return raw ? (JSON.parse(raw) as TrashEntry[]) : [];
  } catch {
    return [];
  }
}

function saveTrashEntries(entries: TrashEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_TRASH_KEY, JSON.stringify(entries));
}

function ProjectPreview({ elements }: { elements: CanvasPreviewElement[] }) {
  if (!elements.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(78,161,255,0.2),transparent_45%),linear-gradient(135deg,#1a1a1a,#121212)] text-xs text-white/55">
        No preview yet
      </div>
    );
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  elements.forEach((element) => {
    const x = Number(element.position?.x ?? 0);
    const y = Number(element.position?.y ?? 0);
    const width = Math.max(10, Number(element.position?.width ?? 80));
    const height = Math.max(10, Number(element.position?.height ?? 50));

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  const previewW = 320;
  const previewH = 200;
  const padding = 16;
  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const scale = Math.min((previewW - padding * 2) / contentW, (previewH - padding * 2) / contentH);
  const offsetX = (previewW - contentW * scale) / 2;
  const offsetY = (previewH - contentH * scale) / 2;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#171717,#101010)]">
      {elements.map((element) => {
        const x = Number(element.position?.x ?? 0);
        const y = Number(element.position?.y ?? 0);
        const width = Math.max(10, Number(element.position?.width ?? 80));
        const height = Math.max(10, Number(element.position?.height ?? 50));
        const fill = element.style?.fill || "rgba(78, 161, 255, 0.2)";
        const stroke = element.style?.stroke || "rgba(255,255,255,0.22)";
        const strokeWidth = Math.max(1, Number(element.style?.strokeWidth ?? 1) * scale);
        const opacity = Number(element.style?.opacity ?? 1);

        const style: React.CSSProperties = {
          left: (x - minX) * scale + offsetX,
          top: (y - minY) * scale + offsetY,
          width: width * scale,
          height: height * scale,
          opacity,
          background: fill,
          border: `${strokeWidth}px solid ${stroke}`,
          borderRadius: element.type === "circle" ? 9999 : 8,
        };

        if (element.type === "text") {
          return (
            <div key={element.id} className="absolute flex items-center justify-center" style={style}>
              <span
                style={{
                  color: stroke,
                  fontSize: Math.max(8, Number(element.style?.fontSize ?? 16) * scale),
                  lineHeight: 1,
                }}
              >
                T
              </span>
            </div>
          );
        }

        return <div key={element.id} className="absolute" style={style} />;
      })}
    </div>
  );
}

export default function ProjectsDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionKey>("my-projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [myProjects, setMyProjects] = useState<ProjectRow[]>([]);
  const [sharedProjects, setSharedProjects] = useState<ProjectRow[]>([]);
  const [trashEntries, setTrashEntries] = useState<TrashEntry[]>([]);
  const [previewMap, setPreviewMap] = useState<Record<string, CanvasPreviewElement[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingLocalMode, setUsingLocalMode] = useState(false);
  const [usingLocalTrashMode, setUsingLocalTrashMode] = useState(false);
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("created-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUserId(getLocalOwnerId());
    setTrashEntries(loadTrashEntries());
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      if (!currentUserId) return;

      setLoadingProjects(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("owner_id", currentUserId)
        .order("name", { ascending: true });

      if (error) {
        const localMy = loadLocalProjects(currentUserId);
        const localShared = loadLocalSharedProjects(currentUserId);
        setMyProjects(localMy);
        setSharedProjects(localShared);
        setPreviewMap(buildLocalPreviewMap([...localMy, ...localShared].map((project) => project.id)));
        setUsingLocalMode(true);
        setUsingLocalTrashMode(true);
        setErrorMessage(null);
        setLoadingProjects(false);
        return;
      }

      const myRows = (data || []) as ProjectRow[];
      const remoteMy = myRows.map((project) => ({ ...project, storage: "remote" as const }));
      const localMy = loadLocalProjects(currentUserId);
      const myMerged = Array.from(
        new Map([...localMy, ...remoteMy].map((project) => [project.id, project])).values()
      );
      setMyProjects(myMerged);

      // Shared-with-me fetch: fallback to local storage if sharing table is unavailable.
      let sharedRows: ProjectRow[] = [];
      const { data: shareData, error: shareError } = await supabase
        .from("workspace_shares")
        .select("workspace_id")
        .eq("shared_with_id", currentUserId);

      if (!shareError && shareData?.length) {
        const sharedIds = shareData.map((row: { workspace_id: string }) => row.workspace_id);
        const { data: sharedWorkspaceData, error: sharedWorkspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .in("id", sharedIds)
          .order("updated_at", { ascending: false });

        if (!sharedWorkspaceError) {
          sharedRows = ((sharedWorkspaceData || []) as ProjectRow[]).map((project) => ({
            ...project,
            storage: "remote" as const,
          }));
        }
      } else {
        sharedRows = loadLocalSharedProjects(currentUserId);
      }

      setSharedProjects(sharedRows);
      setUsingLocalMode(false);

      const { data: trashData, error: trashError } = await supabase
        .from("workspace_trash")
        .select("workspace_id, source, deleted_at")
        .eq("user_id", currentUserId)
        .order("deleted_at", { ascending: false });

      if (trashError) {
        setTrashEntries(loadTrashEntries());
        setUsingLocalTrashMode(true);
      } else {
        const remoteTrash = ((trashData || []) as TrashRemoteRow[]).map((row) => ({
          id: row.workspace_id,
          source: row.source,
          deletedAt: row.deleted_at,
        }));
        setTrashEntries(remoteTrash);
        setUsingLocalTrashMode(false);
      }

      const workspaceIds = [...myMerged, ...sharedRows].map((project) => project.id);
      if (!workspaceIds.length) {
        setPreviewMap({});
        setLoadingProjects(false);
        return;
      }

      const { data: canvasData, error: canvasError } = await supabase
        .from("canvas_elements")
        .select("id, workspace_id, type, position, style, layer_order")
        .in("workspace_id", workspaceIds)
        .order("layer_order", { ascending: true });

      if (canvasError) {
        setPreviewMap(buildLocalPreviewMap(workspaceIds));
      } else {
        const remotePreviewMap = buildPreviewMap((canvasData || []) as CanvasPreviewElement[]);
        const localPreviewMap = buildLocalPreviewMap(workspaceIds);
        setPreviewMap({ ...localPreviewMap, ...remotePreviewMap });
      }

      setLoadingProjects(false);
    }

    fetchProjects();
  }, [currentUserId]);

  const visibleProjects = useMemo(() => {
    const trashedIds = new Set(trashEntries.map((entry) => entry.id));
    if (activeSection === "my-projects") {
      return myProjects.filter((project) => !trashedIds.has(project.id));
    }
    if (activeSection === "shared") {
      return sharedProjects.filter((project) => !trashedIds.has(project.id));
    }

    const allProjects = [...myProjects, ...sharedProjects];
    return allProjects.filter((project) => trashedIds.has(project.id));
  }, [activeSection, myProjects, sharedProjects, trashEntries]);

  const displayedProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = Date.now();

    const filtered = visibleProjects.filter((project) => {
      if (query && !project.name.toLowerCase().includes(query)) return false;

      if (dateFilter === "all") return true;
      const referenceTs = toTimestamp(project.updated_at || project.created_at);
      if (!referenceTs) return false;

      if (dateFilter === "24h") return now - referenceTs <= 24 * 60 * 60 * 1000;
      if (dateFilter === "7d") return now - referenceTs <= 7 * 24 * 60 * 60 * 1000;
      return now - referenceTs <= 30 * 24 * 60 * 60 * 1000;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);

      const aCreated = toTimestamp(a.created_at || a.updated_at);
      const bCreated = toTimestamp(b.created_at || b.updated_at);
      if (sortBy === "created-asc") return aCreated - bCreated;
      return bCreated - aCreated;
    });

    return sorted;
  }, [visibleProjects, searchQuery, dateFilter, sortBy]);

  const currentCopy = SECTION_COPY[activeSection];

  async function handleCreateProject() {
    if (!currentUserId) {
      setErrorMessage("Unable to create project right now. Please refresh once.");
      return;
    }

    // New projects always belong in My Projects.
    if (activeSection !== "my-projects") {
      setActiveSection("my-projects");
    }

    setCreatingProject(true);
    setErrorMessage(null);

    const projectCount = myProjects.length + 1;
    const name = `Untitled Project ${projectCount}`;
    const nowIso = new Date().toISOString();

    if (usingLocalMode) {
      const localProject: ProjectRow = {
        id: `local-${Date.now()}`,
        name,
        owner_id: currentUserId,
        created_at: nowIso,
        updated_at: nowIso,
        storage: "local",
      };

      upsertLocalProject(localProject);
      setMyProjects((prev) => [localProject, ...prev]);
      setPreviewMap((prev) => ({ ...prev, [localProject.id]: [] }));
      setCreatingProject(false);
      return;
    }

    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, owner_id: currentUserId })
      .select("*")
      .single();

    if (error || !data) {
      const localProject: ProjectRow = {
        id: `local-${Date.now()}`,
        name,
        owner_id: currentUserId,
        created_at: nowIso,
        updated_at: nowIso,
        storage: "local",
      };

      upsertLocalProject(localProject);
      setMyProjects((prev) => [localProject, ...prev]);
      setPreviewMap((prev) => ({ ...prev, [localProject.id]: [] }));
      setUsingLocalMode(true);
      setErrorMessage(null);
      setCreatingProject(false);
      return;
    }

    setMyProjects((prev) => [{ ...(data as ProjectRow), storage: "remote" }, ...prev]);
    setPreviewMap((prev) => ({ ...prev, [data.id]: [] }));
    setCreatingProject(false);
  }

  async function handleRenameProject(projectId: string) {
    const currentProject = [...myProjects, ...sharedProjects].find((project) => project.id === projectId);
    if (!currentProject) return;

    const nextName = window.prompt("Rename project", currentProject.name)?.trim();
    if (!nextName || nextName === currentProject.name) {
      setOpenMenuProjectId(null);
      return;
    }

    if (currentProject.storage === "local" || projectId.startsWith("local-")) {
      const updatedLocal: ProjectRow = {
        ...currentProject,
        name: nextName,
        updated_at: new Date().toISOString(),
        storage: "local",
      };
      upsertLocalProject(updatedLocal);
      setMyProjects((prev) => prev.map((project) => (project.id === projectId ? updatedLocal : project)));
      setSharedProjects((prev) => prev.map((project) => (project.id === projectId ? updatedLocal : project)));
      setOpenMenuProjectId(null);
      return;
    }

    setBusyProjectId(projectId);
    setErrorMessage(null);

    const query = supabase
      .from("workspaces")
      .update({ name: nextName })
      .eq("id", projectId);

    if (currentUserId) {
      query.eq("owner_id", currentUserId);
    }

    const { error } = await query;

    if (error) {
      setErrorMessage("Could not rename project. Please try again.");
      setBusyProjectId(null);
      setOpenMenuProjectId(null);
      return;
    }

    setMyProjects((prev) => prev.map((project) => (project.id === projectId ? { ...project, name: nextName } : project)));
    setSharedProjects((prev) => prev.map((project) => (project.id === projectId ? { ...project, name: nextName } : project)));
    setBusyProjectId(null);
    setOpenMenuProjectId(null);
  }

  async function handleDeleteProject(projectId: string) {
    setDeleteConfirmProjectId(projectId);
    setOpenMenuProjectId(null);
  }

  async function executeDeleteProject(projectId: string) {
    const sourceFromTrash = trashEntries.find((entry) => entry.id === projectId)?.source;
    const source: "my" | "shared" = sourceFromTrash || (myProjects.some((project) => project.id === projectId) ? "my" : "shared");

    if (activeSection !== "trash") {
      const nextEntries = [
        ...trashEntries.filter((entry) => entry.id !== projectId),
        { id: projectId, source, deletedAt: new Date().toISOString() },
      ];

      if (!usingLocalTrashMode && currentUserId) {
        await supabase
          .from("workspace_trash")
          .delete()
          .eq("user_id", currentUserId)
          .eq("workspace_id", projectId);

        const { error: addTrashError } = await supabase
          .from("workspace_trash")
          .insert({
            user_id: currentUserId,
            workspace_id: projectId,
            source,
            deleted_at: new Date().toISOString(),
          });

        if (addTrashError) {
          setUsingLocalTrashMode(true);
          saveTrashEntries(nextEntries);
        }
      } else {
        saveTrashEntries(nextEntries);
      }

      setTrashEntries(nextEntries);
      setDeleteConfirmProjectId(null);
      setOpenMenuProjectId(null);
      return;
    }

    const currentProject = [...myProjects, ...sharedProjects].find((project) => project.id === projectId);
    if (currentProject?.storage === "local" || projectId.startsWith("local-")) {
      deleteLocalProject(projectId);
      setMyProjects((prev) => prev.filter((project) => project.id !== projectId));
      setSharedProjects((prev) => prev.filter((project) => project.id !== projectId));
      const nextEntries = trashEntries.filter((entry) => entry.id !== projectId);
      setTrashEntries(nextEntries);
      saveTrashEntries(nextEntries);
      setPreviewMap((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      setDeleteConfirmProjectId(null);
      setOpenMenuProjectId(null);
      return;
    }

    // If this is a shared project in trash, only remove it from this user's trash.
    if (source === "shared") {
      if (!usingLocalTrashMode && currentUserId) {
        const { error: removeSharedTrashError } = await supabase
          .from("workspace_trash")
          .delete()
          .eq("user_id", currentUserId)
          .eq("workspace_id", projectId);

        if (removeSharedTrashError) {
          setErrorMessage("Could not update trash. Please try again.");
          setDeleteConfirmProjectId(null);
          setOpenMenuProjectId(null);
          return;
        }
      }

      const nextEntries = trashEntries.filter((entry) => entry.id !== projectId);
      setTrashEntries(nextEntries);
      if (usingLocalTrashMode) saveTrashEntries(nextEntries);
      setDeleteConfirmProjectId(null);
      setOpenMenuProjectId(null);
      return;
    }

    setBusyProjectId(projectId);
    setErrorMessage(null);

    const query = supabase
      .from("workspaces")
      .delete()
      .eq("id", projectId);

    if (currentUserId) {
      query.eq("owner_id", currentUserId);
    }

    const { error } = await query;

    if (error) {
      setErrorMessage("Could not delete project. Please try again.");
      setBusyProjectId(null);
      setDeleteConfirmProjectId(null);
      setOpenMenuProjectId(null);
      return;
    }

    setMyProjects((prev) => prev.filter((project) => project.id !== projectId));
    setSharedProjects((prev) => prev.filter((project) => project.id !== projectId));

    if (!usingLocalTrashMode && currentUserId) {
      await supabase
        .from("workspace_trash")
        .delete()
        .eq("user_id", currentUserId)
        .eq("workspace_id", projectId);
    }

    const nextEntries = trashEntries.filter((entry) => entry.id !== projectId);
    setTrashEntries(nextEntries);
    if (usingLocalTrashMode) saveTrashEntries(nextEntries);
    setPreviewMap((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    setBusyProjectId(null);
    setDeleteConfirmProjectId(null);
    setOpenMenuProjectId(null);
  }

  function handleOpenProject(projectId: string) {
    setOpenMenuProjectId(null);
    router.push(`/workspace-editor?workspaceId=${projectId}`);
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      onClick={() => {
        setOpenMenuProjectId(null);
        setFilterMenuOpen(false);
        setViewMenuOpen(false);
      }}
    >
      {/* Top Menu Bar */}
      <nav className="bg-[#121212] text-white flex items-center justify-between px-6 py-3 w-full border-b border-white/10">
        <div className="font-bold text-lg">CollabCanvas</div>
        <div className="flex-1 flex justify-center px-4">
          <div className="relative w-full max-w-md">
            <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-white/15 bg-[#2f2f34] text-[#bcd8ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <svg
                className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search Projects"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/15 bg-[#232327] py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/95 shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 focus:border-[#4ea1ff]/70 focus:outline-none focus:ring-2 focus:ring-[#4ea1ff]/45"
            />
          </div>
        </div>
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10" aria-label="Account" type="button">
          <img src="/account.png" alt="Account" className="h-5 w-5 object-contain" />
        </button>
      </nav>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          active={activeSection}
          onSectionChange={setActiveSection}
          onCreateProject={handleCreateProject}
          creatingProject={creatingProject}
          icons={{
            designStudio: "/design_studio.png",
            myProjects: "/my_projects.png",
            shared: "/shared_with_me.png",
            templates: "/templates.png",
            trash: "/trash.png",
            layers: "/layers.png"
          }}
        />
        {/* Main Content Area */}
        <main className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto bg-[#121212]">
          <section className="flex flex-1 flex-col px-8 py-7">
            <div className="flex w-full flex-1 flex-col">
              <h1 className="text-4xl font-semibold tracking-tight text-white">{currentCopy.heading}</h1>
              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="text-base text-white/70">{currentCopy.subheading}</p>
                <div className="relative ml-auto flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMenuOpen((prev) => !prev);
                        setViewMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <circle cx="9" cy="6" r="1.75" fill="currentColor" stroke="none" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <circle cx="15" cy="12" r="1.75" fill="currentColor" stroke="none" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                        <circle cx="12" cy="18" r="1.75" fill="currentColor" stroke="none" />
                      </svg>
                      Filter
                    </button>

                    {filterMenuOpen ? (
                      <div className="absolute right-0 top-9 z-40 w-56 overflow-hidden rounded-lg border border-white/15 bg-[#1b1b1b] shadow-xl">
                        <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/65">Date</div>
                        <button type="button" onClick={() => setDateFilter("all")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${dateFilter === "all" ? "text-[#8ec5ff]" : "text-white/85"}`}>All time</button>
                        <button type="button" onClick={() => setDateFilter("24h")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${dateFilter === "24h" ? "text-[#8ec5ff]" : "text-white/85"}`}>Last 24 hours</button>
                        <button type="button" onClick={() => setDateFilter("7d")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${dateFilter === "7d" ? "text-[#8ec5ff]" : "text-white/85"}`}>Last 7 days</button>
                        <button type="button" onClick={() => setDateFilter("30d")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${dateFilter === "30d" ? "text-[#8ec5ff]" : "text-white/85"}`}>Last 30 days</button>

                        <div className="border-y border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/65">Sort</div>
                        <button type="button" onClick={() => setSortBy("name-asc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${sortBy === "name-asc" ? "text-[#8ec5ff]" : "text-white/85"}`}>Alphabetical (A-Z)</button>
                        <button type="button" onClick={() => setSortBy("name-desc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${sortBy === "name-desc" ? "text-[#8ec5ff]" : "text-white/85"}`}>Alphabetical (Z-A)</button>
                        <button type="button" onClick={() => setSortBy("created-asc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${sortBy === "created-asc" ? "text-[#8ec5ff]" : "text-white/85"}`}>Created time (oldest first)</button>
                        <button type="button" onClick={() => setSortBy("created-desc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${sortBy === "created-desc" ? "text-[#8ec5ff]" : "text-white/85"}`}>Created time (newest first)</button>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMenuOpen((prev) => !prev);
                        setFilterMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3.5" y="4.5" width="7" height="6" rx="1.25" />
                        <rect x="13.5" y="4.5" width="7" height="6" rx="1.25" />
                        <rect x="3.5" y="13.5" width="7" height="6" rx="1.25" />
                        <rect x="13.5" y="13.5" width="7" height="6" rx="1.25" />
                      </svg>
                      View
                    </button>

                    {viewMenuOpen ? (
                      <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-lg border border-white/15 bg-[#1b1b1b] shadow-xl">
                        <button type="button" onClick={() => setViewMode("grid")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${viewMode === "grid" ? "text-[#8ec5ff]" : "text-white/85"}`}>Grid View</button>
                        <button type="button" onClick={() => setViewMode("list")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 ${viewMode === "list" ? "text-[#8ec5ff]" : "text-white/85"}`}>List View</button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <p className="mt-4 text-sm text-red-300">{errorMessage}</p>
              ) : null}

              <section className="mt-7 flex-1 pr-1">
                {loadingProjects ? (
                  <p className="text-sm text-white/70">Loading projects...</p>
                ) : displayedProjects.length === 0 ? (
                  activeSection === "my-projects" ? (
                    <div className="flex flex-wrap items-start gap-3">
                      {viewMode === "grid" ? (
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="group relative flex h-48 w-72 flex-none flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] border border-[#66b2ff]/40 bg-gradient-to-br from-[#1c6dff]/45 via-[#2894ff]/35 to-[#5bb8ff]/35 text-sm font-medium text-white shadow-[0_10px_30px_rgba(30,112,255,0.28)] transition-transform duration-200 hover:scale-[1.01]"
                        >
                          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.18),transparent_55%)]" aria-hidden="true" />
                          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-xl border border-[#9fd0ff]/35 bg-[#66b2ff]/20 text-2xl leading-none">+</span>
                          <span className="relative text-center">{creatingProject ? "Creating..." : "Create New Project"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[#66b2ff]/40 bg-gradient-to-r from-[#1c6dff]/30 via-[#2894ff]/24 to-[#5bb8ff]/26 px-5 py-2.5 text-sm text-white shadow-[0_8px_20px_rgba(30,112,255,0.2)] transition-colors hover:from-[#1c6dff]/38 hover:via-[#2894ff]/30 hover:to-[#5bb8ff]/32"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#66b2ff]/25 text-base leading-none">+</span>
                          {creatingProject ? "Creating..." : "Create New Project"}
                        </button>
                      )}
                      <p className="pt-2 text-sm text-white/70">No projects created yet.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-white/70">
                      {activeSection === "shared"
                        ? "No projects have been shared with you yet."
                        : "Trash is empty."}
                    </p>
                  )
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(18rem,18rem))] justify-between items-start gap-3" : "space-y-2"}>
                      {activeSection === "my-projects" && viewMode === "grid" ? (
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="group relative flex h-48 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] border border-[#66b2ff]/40 bg-gradient-to-br from-[#1c6dff]/45 via-[#2894ff]/35 to-[#5bb8ff]/35 text-sm font-medium text-white shadow-[0_10px_30px_rgba(30,112,255,0.28)] transition-transform duration-200 hover:scale-[1.01]"
                        >
                          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.18),transparent_55%)]" aria-hidden="true" />
                          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-xl border border-[#9fd0ff]/35 bg-[#66b2ff]/20 text-2xl leading-none">+</span>
                          <span className="relative text-center">{creatingProject ? "Creating..." : "Create New Project"}</span>
                        </button>
                      ) : null}

                      {activeSection === "my-projects" && viewMode === "list" ? (
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#66b2ff]/40 bg-gradient-to-r from-[#1c6dff]/30 via-[#2894ff]/24 to-[#5bb8ff]/26 px-5 py-2.5 text-sm text-white shadow-[0_8px_20px_rgba(30,112,255,0.2)] transition-colors hover:from-[#1c6dff]/38 hover:via-[#2894ff]/30 hover:to-[#5bb8ff]/32"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#66b2ff]/25 text-base leading-none">+</span>
                          {creatingProject ? "Creating..." : "Create New Project"}
                        </button>
                      ) : null}

                      {displayedProjects.map((project) => (
                        <article
                          key={project.id}
                          className={
                            viewMode === "grid"
                              ? "w-full cursor-pointer rounded-none border border-white/10 bg-[#171717] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors hover:border-white/20"
                              : "flex w-full cursor-pointer items-center justify-between rounded-none border border-white/10 bg-[#171717] px-4 py-3 transition-colors hover:border-white/20"
                          }
                          onClick={() => handleOpenProject(project.id)}
                        >
                          {viewMode === "grid" ? (
                            <>
                              <div className="aspect-[16/10] w-full overflow-hidden rounded-none border border-white/10">
                                <ProjectPreview elements={previewMap[project.id] || []} />
                              </div>

                              <div className="mt-3 flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h2 className="truncate text-sm font-semibold text-white">{project.name}</h2>
                                  <p className="mt-1 truncate text-xs text-white/60">
                                    {formatRelativeTime(project.updated_at || project.created_at)}
                                  </p>
                                </div>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenMenuProjectId((prev) => (prev === project.id ? null : project.id));
                                    }}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="Project actions"
                                  >
                                    <span className="text-lg leading-none">⋮</span>
                                  </button>

                                  {openMenuProjectId === project.id ? (
                                    <div className="absolute right-0 top-8 z-30 w-32 overflow-hidden rounded-lg border border-white/15 bg-[#1b1b1b] shadow-xl">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleOpenProject(project.id);
                                        }}
                                        className="block w-full px-3 py-2 text-left text-xs text-white/85 transition-colors hover:bg-white/10"
                                      >
                                        Open
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleRenameProject(project.id);
                                        }}
                                        disabled={busyProjectId === project.id}
                                        className="block w-full px-3 py-2 text-left text-xs text-white/85 transition-colors hover:bg-white/10 disabled:opacity-60"
                                      >
                                        Rename
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleDeleteProject(project.id);
                                        }}
                                        disabled={busyProjectId === project.id}
                                        className="block w-full px-3 py-2 text-left text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <h2 className="truncate text-sm font-medium text-white">{project.name}</h2>
                                <p className="mt-1 truncate text-xs text-white/60">
                                  {formatRelativeTime(project.updated_at || project.created_at)}
                                </p>
                              </div>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuProjectId((prev) => (prev === project.id ? null : project.id));
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                  aria-label="Project actions"
                                >
                                  <span className="text-lg leading-none">⋮</span>
                                </button>

                                {openMenuProjectId === project.id ? (
                                  <div className="absolute right-0 top-8 z-30 w-32 overflow-hidden rounded-lg border border-white/15 bg-[#1b1b1b] shadow-xl">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleOpenProject(project.id);
                                      }}
                                      className="block w-full px-3 py-2 text-left text-xs text-white/85 transition-colors hover:bg-white/10"
                                    >
                                      Open
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleRenameProject(project.id);
                                      }}
                                      disabled={busyProjectId === project.id}
                                      className="block w-full px-3 py-2 text-left text-xs text-white/85 transition-colors hover:bg-white/10 disabled:opacity-60"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeleteProject(project.id);
                                      }}
                                      disabled={busyProjectId === project.id}
                                      className="block w-full px-3 py-2 text-left text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </>
                          )}
                        </article>
                      ))}
                  </div>
                  )}
                </section>
              </div>
            </section>
            <footer className="w-full flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#121212] border-t border-white/10">
              <div className="mb-2 md:mb-0 text-center md:text-left">
                <div className="font-manrope font-bold text-white text-base">CollabCanvas</div>
                <div className="text-xs text-white/65">© 2026 CollabCanvas</div>
              </div>
            </footer>
          </main>
        </div>
        {deleteConfirmProjectId ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070d]/65 p-4 backdrop-blur-md" onClick={() => setDeleteConfirmProjectId(null)}>
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[#4ea1ff]/25 bg-[linear-gradient(160deg,rgba(18,23,36,0.9),rgba(10,13,22,0.92))] shadow-[0_18px_60px_rgba(4,8,18,0.7),0_0_0_1px_rgba(78,161,255,0.08)] backdrop-blur-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-[#4ea1ff]/20 bg-gradient-to-r from-[#4ea1ff]/18 via-[#2b5fa8]/10 to-transparent px-5 py-4">
                <h3 className="text-base font-semibold text-white">Confirm deletion</h3>
                <p className="mt-1 text-sm text-[#c9dcff]/85">
                  {activeSection === "trash"
                    ? "Permanently delete this project? This action cannot be undone."
                    : "Move this project to Trash?"}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmProjectId(null)}
                  className="rounded-lg border border-[#4ea1ff]/28 bg-[#0f1628]/70 px-4 py-2 text-sm text-[#d9e8ff] transition-colors hover:bg-[#172744]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteProject(deleteConfirmProjectId)}
                  className="rounded-lg border border-[#4ea1ff]/35 bg-gradient-to-r from-[#1d4f93]/55 to-[#2f7edc]/45 px-4 py-2 text-sm text-white transition-colors hover:from-[#2261b5] hover:to-[#3a90f0]"
                >
                  {activeSection === "trash" ? "Delete Permanently" : "Move to Trash"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Mobile Navigation (BottomNavBar) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full glass-panel flex justify-around items-center h-12 px-2 z-50">
          <a className="flex flex-col items-center gap-0.5 text-[#c0c1ff]" href="#">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: 'FILL 1' }}>folder_shared</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Projects</span>
          </a>
          <a className="flex flex-col items-center gap-0.5 text-[#e5e1e4]/60" href="#">
            <span className="material-symbols-outlined text-base">group</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Shared</span>
          </a>
          <div className="relative -top-4">
            <button className="bg-primary-container text-on-primary-container h-8 w-8 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
          <a className="flex flex-col items-center gap-0.5 text-[#e5e1e4]/60" href="#">
            <span className="material-symbols-outlined text-base">auto_awesome_motion</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Templates</span>
          </a>
          <a className="flex flex-col items-center gap-0.5 text-[#e5e1e4]/60" href="#">
            <span className="material-symbols-outlined text-base">settings</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Settings</span>
          </a>
        </nav>
      </div>
    );
  }