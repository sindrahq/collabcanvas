"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Cormorant_Garamond, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { supabase } from "@/lib/supabaseClient";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDisplayNameFromMetadata } from "@/lib/profile";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { PastelBlobBackground } from "@/components/landing/pastel-blob-background";
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
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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
  style_ext?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
  };
  layer_order?: number;
};

type WorkspaceHistoryPreviewRow = {
  workspace_id?: string;
  created_at?: string;
  snapshot?: {
    elements?: Array<{
      id?: string;
      type?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      layerOrder?: number;
      layer_order?: number;
      style?: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        opacity?: number;
        fontSize?: number;
      };
    }>;
  };
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const LOCAL_PROJECTS_KEY = "collabcanvas_guest_projects";
const LOCAL_SHARED_PROJECTS_KEY = "collabcanvas_shared_projects";
const LOCAL_TRASH_KEY = "collabcanvas_project_trash";

const headingSerif = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const accentSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["italic"],
});

const bodySans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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

function normalizePreviewElement(input: Partial<CanvasPreviewElement>): CanvasPreviewElement | null {
  const workspaceId = input.workspace_id;
  const elementId = input.id;
  const elementType = input.type;
  if (!workspaceId || !elementId || !elementType) return null;

  const position = input.position || {
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
  };

  const style = input.style || input.style_ext;

  return {
    id: elementId,
    workspace_id: workspaceId,
    type: elementType,
    position,
    style,
    layer_order: input.layer_order,
  };
}

function buildPreviewMap(elements: CanvasPreviewElement[]): Record<string, CanvasPreviewElement[]> {
  const grouped: Record<string, CanvasPreviewElement[]> = {};
  for (const raw of elements) {
    const element = normalizePreviewElement(raw);
    if (!element) continue;
    if (!grouped[element.workspace_id]) grouped[element.workspace_id] = [];
    grouped[element.workspace_id].push(element);
  }

  Object.keys(grouped).forEach((workspaceId) => {
    grouped[workspaceId] = grouped[workspaceId].slice(0, 20);
  });

  return grouped;
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
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_12%_18%,rgba(211,165,177,0.18),transparent_46%),linear-gradient(150deg,rgba(255,255,255,0.4),rgba(255,255,255,0.2))] backdrop-blur-md text-xs text-[#6f6558]">
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
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(140deg,#f7f3ed,#efe8de)]">
      {elements.map((element) => {
        const x = Number(element.position?.x ?? 0);
        const y = Number(element.position?.y ?? 0);
        const width = Math.max(10, Number(element.position?.width ?? 80));
        const height = Math.max(10, Number(element.position?.height ?? 50));
        const fill = element.style?.fill || "rgba(139, 115, 85, 0.2)";
        const stroke = element.style?.stroke || "rgba(54,45,38,0.24)";
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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string | null>(null);
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
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
  const browserClient = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!browserClient) {
      setErrorMessage("Authentication is unavailable. Missing Supabase environment variables.");
      setLoadingProjects(false);
      return;
    }

    let active = true;

    void browserClient.auth.getSession().then(({ data }) => {
      if (!active) return;

      if (!data.session?.user) {
        router.replace("/auth?next=%2Fprojects");
        return;
      }

      const user = data.session.user;
      const metadata = user.user_metadata || {};

      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email?.trim().toLowerCase() ?? null);
      setCurrentUserDisplayName(getDisplayNameFromMetadata(metadata, user.email));
      setCurrentUserAvatarUrl(typeof metadata.avatar_url === "string" ? metadata.avatar_url : null);
      setTrashEntries(loadTrashEntries());
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = browserClient.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session?.user) {
        setCurrentUserId(null);
        setCurrentUserEmail(null);
        setCurrentUserDisplayName(null);
        setCurrentUserAvatarUrl(null);
        setAuthReady(false);
        router.replace("/auth?next=%2Fprojects");
        return;
      }

      const metadata = session.user.user_metadata || {};

      setCurrentUserId(session.user.id);
      setCurrentUserEmail(session.user.email?.trim().toLowerCase() ?? null);
      setCurrentUserDisplayName(getDisplayNameFromMetadata(metadata, session.user.email));
      setCurrentUserAvatarUrl(typeof metadata.avatar_url === "string" ? metadata.avatar_url : null);
      setAuthReady(true);
    });

    document.body.classList.add("cc-workspace-theme");

    return () => {
      active = false;
      subscription.unsubscribe();
      document.body.classList.remove("cc-workspace-theme");
    };
  }, [router]);

  useEffect(() => {
    async function fetchProjects() {
      if (!authReady || !currentUserId) return;

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
        setPreviewMap({});
        setUsingLocalMode(true);
        setUsingLocalTrashMode(true);
        setErrorMessage(null);
        setLoadingProjects(false);
        return;
      }

      const myRows = (data || []) as ProjectRow[];
      setMyProjects(myRows.map((project) => ({ ...project, storage: "remote" as const })));

      // Shared-with-me fetch: fallback to local storage if sharing table is unavailable.
      let sharedRows: ProjectRow[] = [];
      const sharedIds = new Set<string>();

      const { data: idShareData, error: idShareError } = await supabase
        .from("workspace_shares")
        .select("workspace_id")
        .eq("shared_with_id", currentUserId);

      if (!idShareError && idShareData?.length) {
        idShareData.forEach((row: { workspace_id: string }) => sharedIds.add(row.workspace_id));
      }

      if (currentUserEmail) {
        const { data: emailShareData, error: emailShareError } = await supabase
          .from("workspace_shares")
          .select("workspace_id")
          .eq("shared_with_email", currentUserEmail);

        if (!emailShareError && emailShareData?.length) {
          emailShareData.forEach((row: { workspace_id: string }) => sharedIds.add(row.workspace_id));
        }
      }

      if (sharedIds.size) {
        const { data: sharedWorkspaceData, error: sharedWorkspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .in("id", [...sharedIds])
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

      const workspaceIds = [...myRows, ...sharedRows].map((project) => project.id);
      if (!workspaceIds.length) {
        setPreviewMap({});
        setLoadingProjects(false);
        return;
      }

      const { data: canvasData, error: canvasError } = await supabase
        .from("canvas_elements")
        .select("*")
        .in("workspace_id", workspaceIds)
        .order("layer_order", { ascending: true });

      let nextPreviewMap: Record<string, CanvasPreviewElement[]> = {};
      if (!canvasError) {
        nextPreviewMap = buildPreviewMap((canvasData || []) as CanvasPreviewElement[]);
      }

      const missingPreviewWorkspaceIds = workspaceIds.filter((workspaceId) => !(nextPreviewMap[workspaceId]?.length));

      if (missingPreviewWorkspaceIds.length) {
        const { data: historyData, error: historyError } = await supabase
          .from("workspace_history")
          .select("workspace_id, created_at, snapshot")
          .in("workspace_id", missingPreviewWorkspaceIds)
          .order("created_at", { ascending: false });

        if (!historyError && historyData?.length) {
          const latestByWorkspace: Record<string, WorkspaceHistoryPreviewRow> = {};
          for (const row of historyData as WorkspaceHistoryPreviewRow[]) {
            if (!row.workspace_id || latestByWorkspace[row.workspace_id]) continue;
            latestByWorkspace[row.workspace_id] = row;
          }

          for (const workspaceId of Object.keys(latestByWorkspace)) {
            const elementsFromSnapshot = latestByWorkspace[workspaceId].snapshot?.elements || [];
            const previewElements: CanvasPreviewElement[] = elementsFromSnapshot
              .map((element, index) =>
                normalizePreviewElement({
                  id: element.id || `${workspaceId}-snapshot-${index}`,
                  workspace_id: workspaceId,
                  type: element.type || "rectangle",
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  style: element.style,
                  layer_order: element.layer_order ?? element.layerOrder ?? index,
                })
              )
              .filter((element): element is CanvasPreviewElement => Boolean(element))
              .slice(0, 20);

            if (previewElements.length) {
              nextPreviewMap[workspaceId] = previewElements;
            }
          }
        }
      }

      setPreviewMap(nextPreviewMap);

      setLoadingProjects(false);
    }

    fetchProjects();
  }, [authReady, currentUserEmail, currentUserId]);

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

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F6] text-sm text-[#645C52]">
        Checking authentication...
      </div>
    );
  }

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
    <>
      <div 
        className="fixed inset-0 pointer-events-none z-[0]"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1522228115018-d838bcce5c38?q=80&w=2670&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-white/30 backdrop-blur-[2px] z-[1]" />
      <PastelBlobBackground />
      <CustomCursor />

      <div
        className={`${bodySans.className} flex h-screen flex-col overflow-hidden text-[var(--projects-text)] relative z-10`}
        style={{
          ["--projects-bg" as string]: "transparent",
          ["--projects-surface" as string]: "rgba(255, 255, 255, 0.4)",
          ["--projects-panel" as string]: "rgba(255, 255, 255, 0.6)",
          ["--projects-text" as string]: "#1A1A1A",
          ["--projects-muted" as string]: "#645C52",
          ["--projects-line" as string]: "rgba(211, 165, 177, 0.14)",
          ["--projects-accent" as string]: "#FF94B4",
          ["--projects-success" as string]: "#4ADE80",
        } as React.CSSProperties}
        onClick={() => {
          setOpenMenuProjectId(null);
          setFilterMenuOpen(false);
          setViewMenuOpen(false);
        }}
      >
      {/* Top Menu Bar */}
      <nav className="flex w-full items-center justify-between border-b border-[var(--projects-line)] bg-[var(--projects-bg)] px-6 py-4 text-[var(--projects-text)]">
        <div className="flex items-center gap-5">
          <div className={`${headingSerif.className} text-xl font-black tracking-[-0.02em]`}>CollabCanvas</div>
        </div>
        <div className="flex-1 px-4">
          <div className="relative w-full max-w-md">
            <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--projects-line)] bg-[var(--projects-panel)] text-[var(--projects-muted)]">
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
              className="h-10 w-full rounded-xl border border-[var(--projects-line)] bg-[var(--projects-panel)] py-2 pl-10 pr-4 text-sm text-[var(--projects-text)] placeholder:text-[var(--projects-muted)]/80 shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-[var(--projects-accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(139,115,85,0.16)]"
            />
          </div>
        </div>
        <ProfileMenu
          displayName={currentUserDisplayName}
          email={currentUserEmail}
          avatarUrl={currentUserAvatarUrl}
          onLogout={async () => {
            if (!browserClient) return;
            await browserClient.auth.signOut();
            router.replace("/");
          }}
        />
      </nav>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          theme="projects"
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
        <main className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto bg-[var(--projects-bg)]">
          <section className="flex flex-1 flex-col px-8 py-8 lg:px-10 lg:py-10">
            <div className="flex w-full flex-1 flex-col">
              <div className="flex flex-col gap-6 border-b border-[var(--projects-line)] pb-10 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-5">
                  <h1 className={`${headingSerif.className} text-5xl font-black leading-[0.95] tracking-[-0.03em] text-[var(--projects-text)] md:text-6xl`}>{currentCopy.heading}</h1>
                  <p className="max-w-2xl text-base text-[var(--projects-muted)]">{currentCopy.subheading}</p>
                </div>
                <div className="relative flex items-center gap-2 self-start lg:mt-2" onClick={(event) => event.stopPropagation()}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMenuOpen((prev) => !prev);
                        setViewMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--projects-line)] bg-[var(--projects-panel)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--projects-muted)] transition-colors hover:bg-[#ede6db]"
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
                      <div className="absolute right-0 top-9 z-40 w-56 overflow-hidden rounded-lg border border-[var(--projects-line)] bg-[var(--projects-panel)] shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
                        <div className="border-b border-[var(--projects-line)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--projects-muted)]">Date</div>
                        <button type="button" onClick={() => setDateFilter("all")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${dateFilter === "all" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>All time</button>
                        <button type="button" onClick={() => setDateFilter("24h")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${dateFilter === "24h" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Last 24 hours</button>
                        <button type="button" onClick={() => setDateFilter("7d")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${dateFilter === "7d" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Last 7 days</button>
                        <button type="button" onClick={() => setDateFilter("30d")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${dateFilter === "30d" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Last 30 days</button>

                        <div className="border-y border-[var(--projects-line)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--projects-muted)]">Sort</div>
                        <button type="button" onClick={() => setSortBy("name-asc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${sortBy === "name-asc" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Alphabetical (A-Z)</button>
                        <button type="button" onClick={() => setSortBy("name-desc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${sortBy === "name-desc" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Alphabetical (Z-A)</button>
                        <button type="button" onClick={() => setSortBy("created-asc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${sortBy === "created-asc" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Created time (oldest first)</button>
                        <button type="button" onClick={() => setSortBy("created-desc")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${sortBy === "created-desc" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Created time (newest first)</button>
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
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--projects-line)] bg-[var(--projects-panel)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--projects-muted)] transition-colors hover:bg-[#ede6db]"
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
                      <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-lg border border-[var(--projects-line)] bg-[var(--projects-panel)] shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
                        <button type="button" onClick={() => setViewMode("grid")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${viewMode === "grid" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>Grid View</button>
                        <button type="button" onClick={() => setViewMode("list")} className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#ede6db] ${viewMode === "list" ? "text-[var(--projects-accent)]" : "text-[var(--projects-text)]"}`}>List View</button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <p className="mt-4 text-sm text-[#9b3f3f]">{errorMessage}</p>
              ) : null}

              <section className="mt-8 flex-1 pr-1">
                {loadingProjects ? (
                  <p className="text-sm text-[var(--projects-muted)]">Loading projects...</p>
                ) : displayedProjects.length === 0 ? (
                  activeSection === "my-projects" ? (
                    <div className="flex flex-wrap items-start gap-3">
                      {viewMode === "grid" ? (
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="group relative flex h-48 w-72 flex-none flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] border border-[#f4e9d9]/30 bg-[linear-gradient(145deg,rgba(38,38,38,0.78),rgba(18,18,18,0.82))] text-sm font-semibold text-[#FAF9F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-10px_24px_rgba(0,0,0,0.22),0_24px_44px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-200 hover:-translate-y-px"
                        >
                          <span className="pointer-events-none absolute inset-x-3 top-2 h-10 rounded-full bg-gradient-to-b from-[#fff5e7]/28 to-transparent blur-[1px]" aria-hidden="true" />
                          <span className="relative text-3xl leading-none text-[#EDE3D3]">+</span>
                          <span className="relative text-center">{creatingProject ? "Creating..." : "Create New Project"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-[14px] border border-[#f4e9d9]/30 bg-[linear-gradient(145deg,rgba(38,38,38,0.78),rgba(18,18,18,0.82))] px-5 py-2.5 text-sm text-[#FAF9F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-8px_18px_rgba(0,0,0,0.18),0_20px_36px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all hover:-translate-y-px"
                        >
                          <span className="pointer-events-none absolute inset-x-2 top-1.5 h-6 rounded-full bg-gradient-to-b from-[#fff5e7]/25 to-transparent" aria-hidden="true" />
                          <span className="relative text-lg leading-none text-[#EDE3D3]">+</span>
                          {creatingProject ? "Creating..." : "Create New Project"}
                        </button>
                      )}
                      <p className="pt-2 text-sm text-[var(--projects-muted)]">No projects created yet.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--projects-muted)]">
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
                          className="group relative flex h-48 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] border border-[#f4e9d9]/30 bg-[linear-gradient(145deg,rgba(38,38,38,0.78),rgba(18,18,18,0.82))] text-sm font-semibold text-[#FAF9F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-10px_24px_rgba(0,0,0,0.22),0_24px_44px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-200 hover:-translate-y-px"
                        >
                          <span className="pointer-events-none absolute inset-x-3 top-2 h-10 rounded-full bg-gradient-to-b from-[#fff5e7]/28 to-transparent blur-[1px]" aria-hidden="true" />
                          <span className="relative text-3xl leading-none text-[#EDE3D3]">+</span>
                          <span className="relative text-center">{creatingProject ? "Creating..." : "Create New Project"}</span>
                        </button>
                      ) : null}

                      {activeSection === "my-projects" && viewMode === "list" ? (
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="group relative inline-flex w-fit items-center gap-2 overflow-hidden rounded-[14px] border border-[#f4e9d9]/30 bg-[linear-gradient(145deg,rgba(38,38,38,0.78),rgba(18,18,18,0.82))] px-5 py-2.5 text-sm text-[#FAF9F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-8px_18px_rgba(0,0,0,0.18),0_20px_36px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all hover:-translate-y-px"
                        >
                          <span className="pointer-events-none absolute inset-x-2 top-1.5 h-6 rounded-full bg-gradient-to-b from-[#fff5e7]/25 to-transparent" aria-hidden="true" />
                          <span className="relative text-lg leading-none text-[#EDE3D3]">+</span>
                          {creatingProject ? "Creating..." : "Create New Project"}
                        </button>
                      ) : null}

                      {displayedProjects.map((project) => (
                        <article
                          key={project.id}
                          className={
                            viewMode === "grid"
                              ? "group/card relative isolate w-full cursor-pointer overflow-hidden rounded-xl border border-[#f4e9d9]/26 bg-[linear-gradient(148deg,rgba(46,46,46,0.74),rgba(20,20,20,0.84))] p-3 text-[#FAF9F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-14px_28px_rgba(0,0,0,0.22),0_24px_44px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#f4e9d9]/42 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-18px_30px_rgba(0,0,0,0.25),0_28px_52px_rgba(0,0,0,0.24)]"
                              : "group/card relative isolate flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-lg border border-[#f4e9d9]/26 bg-[linear-gradient(148deg,rgba(46,46,46,0.74),rgba(20,20,20,0.84))] px-4 py-3 text-[#FAF9F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-10px_20px_rgba(0,0,0,0.2),0_20px_36px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[#f4e9d9]/42 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-12px_24px_rgba(0,0,0,0.22),0_24px_40px_rgba(0,0,0,0.22)]"
                          }
                          onClick={() => handleOpenProject(project.id)}
                        >
                          <span
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_5%_0%,rgba(255,255,255,0.16),transparent_45%),radial-gradient(120%_100%_at_100%_100%,rgba(139,115,85,0.2),transparent_56%)] opacity-80 transition-opacity duration-300 group-hover/card:opacity-100"
                            aria-hidden="true"
                          />
                          <span
                            className="pointer-events-none absolute -top-8 left-10 h-24 w-48 rotate-[-8deg] bg-white/20 blur-2xl opacity-25 transition-all duration-300 group-hover/card:translate-x-5 group-hover/card:opacity-40"
                            aria-hidden="true"
                          />
                          {viewMode === "grid" ? (
                            <>
                              <div className="relative z-10 aspect-[16/10] w-full overflow-hidden rounded-lg border border-[#f4e9d9]/26">
                                <ProjectPreview elements={previewMap[project.id] || []} />
                              </div>

                              <div className="relative z-10 mt-3 flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h2 className="truncate text-sm font-semibold text-[#FAF9F6]">{project.name}</h2>
                                  <p className="mt-1 truncate text-xs text-[#E7DCCB]/75">
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
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#E7DCCB]/80 transition-colors hover:bg-white/10 hover:text-[#FAF9F6]"
                                    aria-label="Project actions"
                                  >
                                    <span className="text-lg leading-none">⋮</span>
                                  </button>

                                  {openMenuProjectId === project.id ? (
                                    <div className="absolute right-0 top-8 z-30 w-32 overflow-hidden rounded-lg border border-[var(--projects-line)] bg-[var(--projects-panel)] shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleOpenProject(project.id);
                                        }}
                                        className="block w-full px-3 py-2 text-left text-xs text-[var(--projects-text)] transition-colors hover:bg-[#ede6db]"
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
                                        className="block w-full px-3 py-2 text-left text-xs text-[var(--projects-text)] transition-colors hover:bg-[#ede6db] disabled:opacity-60"
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
                                        className="block w-full px-3 py-2 text-left text-xs text-[#9b3f3f] transition-colors hover:bg-[#f5dcd9] disabled:opacity-60"
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
                              <div className="relative z-10 min-w-0">
                                <h2 className="truncate text-sm font-medium text-[#FAF9F6]">{project.name}</h2>
                                <p className="mt-1 truncate text-xs text-[#E7DCCB]/75">
                                  {formatRelativeTime(project.updated_at || project.created_at)}
                                </p>
                              </div>

                              <div className="relative z-10">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuProjectId((prev) => (prev === project.id ? null : project.id));
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#E7DCCB]/80 transition-colors hover:bg-white/10 hover:text-[#FAF9F6]"
                                  aria-label="Project actions"
                                >
                                  <span className="text-lg leading-none">⋮</span>
                                </button>

                                {openMenuProjectId === project.id ? (
                                  <div className="absolute right-0 top-8 z-30 w-32 overflow-hidden rounded-lg border border-[var(--projects-line)] bg-[var(--projects-panel)] shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleOpenProject(project.id);
                                      }}
                                      className="block w-full px-3 py-2 text-left text-xs text-[var(--projects-text)] transition-colors hover:bg-[#ede6db]"
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
                                      className="block w-full px-3 py-2 text-left text-xs text-[var(--projects-text)] transition-colors hover:bg-[#ede6db] disabled:opacity-60"
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
                                      className="block w-full px-3 py-2 text-left text-xs text-[#9b3f3f] transition-colors hover:bg-[#f5dcd9] disabled:opacity-60"
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
            <footer className="flex w-full flex-col items-center justify-between border-t border-[var(--projects-line)] bg-[var(--projects-bg)] px-6 py-4 md:flex-row">
              <div className="mb-2 md:mb-0 text-center md:text-left">
                <div className={`${headingSerif.className} text-base font-black tracking-[-0.02em] text-[var(--projects-text)]`}>CollabCanvas</div>
                <div className="text-xs text-[var(--projects-muted)]">© 2026 CollabCanvas</div>
              </div>
            </footer>
          </main>
        </div>
        {deleteConfirmProjectId ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(15,12,10,0.36)] p-4 backdrop-blur-sm" onClick={() => setDeleteConfirmProjectId(null)}>
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--projects-line)] bg-[var(--projects-panel)] shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-[var(--projects-line)] bg-[radial-gradient(circle_at_10%_10%,rgba(139,115,85,0.14),transparent_48%)] px-5 py-4">
                <h3 className={`${headingSerif.className} text-base font-bold text-[var(--projects-text)]`}>Confirm deletion</h3>
                <p className="mt-1 text-sm text-[var(--projects-muted)]">
                  {activeSection === "trash"
                    ? "Permanently delete this project? This action cannot be undone."
                    : "Move this project to Trash?"}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmProjectId(null)}
                  className="rounded-[10px] border border-[var(--projects-line)] bg-[var(--projects-bg)] px-4 py-2 text-sm text-[var(--projects-text)] transition-colors hover:bg-[#ede6db]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteProject(deleteConfirmProjectId)}
                  className="rounded-[10px] bg-[#1A1A1A] px-4 py-2 text-sm text-[#FAF9F6] transition-colors hover:bg-[#2a2a2a]"
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
    </>
  );
}