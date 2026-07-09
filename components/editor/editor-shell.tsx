"use client";

import { subscribeToActivityFeed, broadcastActivity } from "@/lib/activityFeedRealtime";
import { logActivity as logActivityServer } from "@/lib/logActivity";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Check, ChevronDown, Download, LoaderCircle, Monitor, Pencil, Share2, Sparkles, X, Layers, LayoutGrid, MessageSquare, SlidersHorizontal, HelpCircle, Palette, Undo2, Redo2, Menu, LogOut, Plus, type LucideIcon } from "lucide-react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { AvatarStack } from "@/components/presence/AvatarStack";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { WorkspaceSidebar, type WorkspaceSidebarSection } from "@/components/editor/workspace-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import { GlassTooltip } from "@/components/ui/glass-tooltip";
import {
  acquireSelectionLock,
  broadcastCanvasUpdate,
  initPresenceChannel,
  leavePresenceChannel,
  onCursorBroadcast,
  onElementClickBroadcast,
  onSelectionBroadcast,
  type PresenceMeta,
} from "@/lib/collaboration";
import { CommandBrain, type BrainCommand } from "@/components/editor/command-brain";
import { createWorkspaceComment, loadWorkspaceComments, type WorkspaceComment } from "@/lib/comments";
import { exportWorkspaceAsJpeg, exportWorkspaceAsPdf, exportWorkspaceAsPng } from "@/lib/workspaceExport";
import { createSupabaseBrowserClient, getSessionSafely } from "@/lib/supabase/client";
import { saveWorkspaceHistorySnapshot } from "@/lib/history";
import { loadWorkspace } from "@/lib/workspaceLoader";
import { getDisplayNameFromMetadata } from "@/lib/profile";
import { type WorkspaceAccessLevel, type CanvasTheme, useWorkspaceStore, useWorkspaceStoreFactory } from "@/store/workspaceStore";
import { useGlobalThemeStore, THEME_BACKGROUNDS } from "@/store/globalThemeStore";
import PresenceOverlay from "@/components/ui/PresenceOverlay";
import TemplatePicker from "@/components/ui/TemplatePicker";
import AssetLibraryPanel from "@/components/ui/AssetLibraryPanel";
import RoleBadge from "@/components/ui/RoleBadge";
import { GenerativeUIModal } from "@/components/editor/generative-ui-modal";
import { MultiScreenPreview } from "@/components/editor/multi-screen-preview";
import { TemplatePanel } from "@/components/editor/template-panel";
import { PastelBlobBackground } from "@/components/landing/pastel-blob-background";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { FallingPetals } from "@/components/landing/falling-petals";
import { AccumulatedPetals } from "@/components/landing/accumulated-petals";
import { InteractiveTutorial } from "@/components/ui/interactive-tutorial";
import { VoiceCommandManager } from "@/components/voice/VoiceCommandManager";
import { Bookmark } from "lucide-react";
import { usePresenceStore } from "@/store/presenceStore";
import { useCanvasIntegration } from "@/hooks/useCanvasIntegration";
import { useRealtime } from "@/hooks/useRealtime";
import type { CanvasRole, CanvasTemplate } from "@/types/integration";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function isShareAccessLevel(value: unknown): value is WorkspaceAccessLevel {
  return value === "view" || value === "comment" || value === "edit";
}

function mapRoleToAccessLevel(role: CanvasRole): WorkspaceAccessLevel {
  if (role === "commenter") return "comment";
  if (role === "viewer") return "view";
  return "edit";
}

function slugify(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "workspace";
}

type AutoSaveStatus = "saved" | "saving";
const LOCAL_COMMENTS_STORAGE_PREFIX = "collabcanvas_workspace_comments_";
const LOCAL_WORKSPACE_DRAFT_PREFIX = "collabcanvas_workspace_draft_";

const PRESENCE_COLORS = ["#0b6e66", "#b35c1c", "#1f6fd6", "#7a3eb3", "#a03a58", "#3d6f2f"];

const NAV_SECTIONS: Array<{
  id: WorkspaceSidebarSection;
  label: string;
  icon: LucideIcon;
}> = [
    { id: "layers", label: "Layers", icon: Layers },
    { id: "actions", label: "Add", icon: LayoutGrid },
    { id: "inspector", label: "Inspector", icon: SlidersHorizontal },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "templates", label: "Templates", icon: Bookmark },
    { id: "activity", label: "Activity", icon: Activity },
  ];

function extractMissingColumnFromMessage(message?: string | null): string | null {
  if (!message) return null;
  const quoted = message.match(/Could not find the '([^']+)' column/i);
  if (quoted?.[1]) return quoted[1];
  const generic = message.match(/column\s+"([^"]+)"\s+does not exist/i);
  if (generic?.[1]) return generic[1];
  return null;
}

function removeColumnFromRows<T extends Record<string, unknown>>(rows: T[], column: string): T[] {
  return rows.map((row) => {
    if (!(column in row)) return row;
    const next = { ...row };
    delete next[column];
    return next;
  });
}

function isUuidValue(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isUuidSyntaxErrorMessage(message?: string | null): boolean {
  if (!message) return false;
  return /invalid input syntax for type uuid/i.test(message);
}

function isDuplicatePrimaryKeyMessage(message?: string | null): boolean {
  if (!message) return false;
  return /duplicate key value violates unique constraint\s+"canvas_elements_pkey"/i.test(message);
}

function buildLocalPresenceMeta(): PresenceMeta {
  if (typeof window === "undefined") {
    return {
      user_id: "local-user",
      name: "Local User",
      color: PRESENCE_COLORS[0],
      avatarUrl: "",
      cursor: { x: 0.5, y: 0.5 },
      selection: null,
      typing: false,
      viewport: { zoom: 1, panX: 0, panY: 0 },
    };
  }

  const key = "collabcanvas_presence_user";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing) as PresenceMeta;
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  const seed = crypto.randomUUID().slice(0, 8);
  const meta: PresenceMeta = {
    user_id: `guest-${seed}`,
    name: `Guest ${seed.slice(0, 4).toUpperCase()}`,
    color: PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)],
    avatarUrl: "",
    cursor: { x: 0.5, y: 0.5 },
    selection: null,
    typing: false,
    viewport: { zoom: 1, panX: 0, panY: 0 },
  };

  window.localStorage.setItem(key, JSON.stringify(meta));
  return meta;
}

function AutoSaveBadge({ status }: { status: AutoSaveStatus }) {
  return (
    <motion.div
      className={`autosave-badge autosave-badge-${status}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.16 }}
      key={status}
    >
      {status === "saving" ? (
        <>
          <LoaderCircle size={13} className="autosave-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check size={13} />
          <span>Saved</span>
        </>
      )}
    </motion.div>
  );
}



export function EditorShell() {
  // All hooks and state declarations must come first
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceIdFromUrl: string = useMemo(() => {
    const id = searchParams.get("workspaceId") || searchParams.get("id") || searchParams.get("projectId");
    return id || "";
  }, [searchParams]);

  // Use the factory store bound to the current workspace ID
  const useStore = useWorkspaceStoreFactory(workspaceIdFromUrl);

  const selectedElementId = useStore((s) => s.selectedElementId);
  const selectElement = useStore((s) => s.selectElement);
  const duplicateSelectedElement = useStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useStore((s) => s.deleteSelectedElement);
  const copySelectedElement = useStore((s) => s.copySelectedElement);
  const pasteElement = useStore((s) => s.pasteElement);
  const workspace = useStore((s) => s.workspace);
  const workspaceName = useStore((s) => s.workspaceName);
  const accessLevel = useStore((s) => s.accessLevel);
  const canEdit = useStore((s) => s.canEdit);
  const setWorkspaceAccess = useStore((s) => s.setWorkspaceAccess);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const elements = useStore((s) => s.elements);
  const updateElement = useStore((s) => s.updateElement);
  const addElement = useStore((s) => s.addElement);
  const setElevation = useStore((s) => s.setElevation);
  const pushActivityLog = useStore((s) => s.pushActivityLog);
  const clearActivityLog = useStore((s) => s.clearActivityLog);
  const canvasTheme = useGlobalThemeStore((s) => s.theme);
  const setCanvasTheme = useGlobalThemeStore((s) => s.setTheme);

  // Get the Zustand store instance
  // (Zustand does not expose store directly, so we use a workaround for imperative calls)
  const store = useStore;

  // Wrapped element actions to log and broadcast activity
  function handleAddElement(type: Parameters<typeof addElement>[0], extra?: Parameters<typeof addElement>[1]) {
    addElement(type, extra);
    logAndBroadcastActivity("added", extra?.name || type, type);
  }

  // Helper to log and broadcast activity
  const logAndBroadcastActivity = async (
    action: "added" | "deleted" | "updated" | "moved",
    elementName: string,
    elementType: string
  ) => {
    if (!workspace?.id || !authUser) return;
    const entry = {
      id: crypto.randomUUID(),
      action,
      elementName,
      elementType,
      userName: getDisplayNameFromMetadata(authUser.user_metadata || {}, authUser.email) || "User",
      timestamp: Date.now(),
    };
    // Push locally for instant feedback
    pushActivityLog(entry);
    // Broadcast to others
    broadcastActivity(workspace.id, entry);
    // Log to Supabase
    await logActivityServer({
      workspace_id: workspace.id,
      user_id: authUser.id,
      user_name: entry.userName,
      action,
      element_name: elementName,
      element_type: elementType,
    });
  };


  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>("saved");
  const [authChecked, setAuthChecked] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [presences, setPresences] = useState<Record<string, PresenceMeta>>({});
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; updatedAt: number }>>({});
  const [mobilePanel, setMobilePanel] = useState<"canvas" | "layers" | "inspector" | "templates">("canvas");
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<WorkspaceSidebarSection | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [genUIOpen, setGenUIOpen] = useState(false);
  const [commandBrainOpen, setCommandBrainOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<WorkspaceComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(workspaceName);
  const [workspaceRenameSaving, setWorkspaceRenameSaving] = useState(false);
  const browserClient = useMemo(() => createSupabaseBrowserClient(), []);
  const setLocalUserId = usePresenceStore((s) => s.setLocalUserId);
  const updatePresenceUser = usePresenceStore((s) => s.updateUser);
  const removePresenceUser = usePresenceStore((s) => s.removeUser);
  // Duplicate declaration removed
  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/workspace-editor?${query}` : "/workspace-editor";
  }, [searchParams]);

  const currentUserMeta = useMemo(() => {
    if (!authUser) {
      return buildLocalPresenceMeta();
    }

    const metadata = authUser.user_metadata || {};
    const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
    const displayName = getDisplayNameFromMetadata(metadata, authUser.email);
    const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";

    return {
      user_id: authUser.id,
      name: fullName || displayName,
      color: PRESENCE_COLORS[Math.abs(authUser.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PRESENCE_COLORS.length],
      avatarUrl,
      cursor: { x: 0.5, y: 0.5 },
      selection: null,
      typing: false,
      viewport: { zoom: 1, panX: 0, panY: 0 },
    } satisfies PresenceMeta;
  }, [authUser]);

  const {
    store: integrationStore,
    refreshAssets,
    refreshTemplates,
    saveTemplate,
    updateRoleOptimistically,
  } = useCanvasIntegration(workspaceIdFromUrl, Boolean(authUser));
  const currentUserRole = integrationStore((state) => state.currentUserRole);
  const roleAssignments = integrationStore((state) => state.roleAssignments);
  const assetList = integrationStore((state) => state.assetList);
  const templateList = integrationStore((state) => state.templateList);
  const assetStatus = integrationStore((state) => state.assetStatus);
  const templateStatus = integrationStore((state) => state.templateStatus);
  const assetError = integrationStore((state) => state.assetError);
  const templateError = integrationStore((state) => state.templateError);
  const lastLoadTimestampRef = useRef<number>(0);

  const handleRealtimeCanvasUpdate = useCallback(() => {
    if (workspace?.id && !workspace.id.startsWith("local-") && store.getState().elements.length === 0) {
      void loadWorkspace(workspace.id);
    }
  }, [workspace?.id, store]);

  const realtimeUser = authUser
    ? {
        id: currentUserMeta.user_id,
        name: currentUserMeta.name,
        color: currentUserMeta.color,
      }
    : null;
  const { sendCursor: sendRealtimeCursor } = useRealtime({
    canvasId: workspaceIdFromUrl,
    currentUser: realtimeUser,
    onCanvasUpdate: handleRealtimeCanvasUpdate,
  });

  const persistTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPersistedSignatureRef = useRef<string>("");
  const persistNowRef = useRef<(() => void) | null>(null);
  const persistInFlightRef = useRef(false);
  const pendingPersistRef = useRef(false);
  const fileBase = slugify(workspaceName);
  const workspaceDraftKey = useMemo(
    () => (workspaceIdFromUrl ? `${LOCAL_WORKSPACE_DRAFT_PREFIX}${workspaceIdFromUrl}` : ""),
    [workspaceIdFromUrl]
  );

  useEffect(() => {
    if (!workspaceDraftKey || typeof window === "undefined") return;

    const payload = {
      workspaceName,
      selectedElementId,
      elements,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(workspaceDraftKey, JSON.stringify(payload));
  }, [elements, selectedElementId, workspaceDraftKey, workspaceName]);

  useEffect(() => {
    if (!workspaceDraftKey || typeof window === "undefined") return;
    if (elements.length > 0) return;

    const raw = window.localStorage.getItem(workspaceDraftKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        elements?: typeof elements;
        selectedElementId?: string | null;
      };

      if (Array.isArray(parsed.elements) && parsed.elements.length > 0) {
        store.getState().setElements(parsed.elements);
        store.getState().setSelectedElementId(parsed.selectedElementId ?? null);
      }
    } catch {
      // Ignore malformed local drafts.
    }
  }, [elements.length, store, workspaceDraftKey]);

  useEffect(() => {
    // Switch to workspace theme
    document.body.classList.add("cc-workspace-theme");
    document.body.classList.remove("cc-landing-theme");

    return () => {
      // Restore landing theme or remove workspace theme
      document.body.classList.remove("cc-workspace-theme");
      document.body.classList.add("cc-landing-theme");
      document.body.classList.remove("theme-cherry", "theme-forest", "theme-ocean", "theme-sunset");
    };
  }, []);

  useEffect(() => {
    // Sync active theme class to document body
    document.body.classList.remove("theme-cherry", "theme-forest", "theme-ocean", "theme-sunset");
    document.body.classList.add(`theme-${canvasTheme}`);
  }, [canvasTheme]);

  useEffect(() => {
    if (!isRenamingWorkspace) {
      setWorkspaceNameDraft(workspaceName);
    }
  }, [isRenamingWorkspace, workspaceName]);

  useEffect(() => {
    if (selectedElementId) {
      setMobileInspectorOpen(true);
      setMobileAddOpen(false);
    } else {
      setMobileInspectorOpen(false);
    }
  }, [selectedElementId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const canRenameWorkspace = canEdit;

  async function handleWorkspaceRenameSubmit() {
    if (!workspace || !authUser || !canRenameWorkspace || workspaceRenameSaving) return;

    const nextName = workspaceNameDraft.trim();
    if (!nextName) {
      setWorkspaceNameDraft(workspaceName);
      setIsRenamingWorkspace(false);
      return;
    }

    if (nextName === workspaceName) {
      setIsRenamingWorkspace(false);
      return;
    }

    setWorkspaceRenameSaving(true);

    try {
      if (!workspace.id.startsWith("local-")) {
        const response = await fetch(`/api/workspaces/${workspace.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextName }),
        });
        const payload = (await response.json()) as {
          error?: string;
          workspace?: { id: string; name: string; owner_id: string };
        };
        if (payload.error || !payload.workspace) {
          throw new Error(payload.error || "Update failed");
        }
      }

      setWorkspaceNameDraft(nextName);
      store.getState().setWorkspace({ ...workspace, name: nextName });
      setIsRenamingWorkspace(false);
    } catch (e) {
      setWorkspaceNameDraft(workspaceName);
    } finally {
      setWorkspaceRenameSaving(false);
    }
  }

  function handleWorkspaceRenameCancel() {
    setWorkspaceNameDraft(workspaceName);
    setIsRenamingWorkspace(false);
  }

  useEffect(() => {
    if (!browserClient) {
      setAuthChecked(true);
      return;
    }

    let active = true;

    void getSessionSafely(browserClient).then((session) => {
      if (!active) return;

      if (!session?.user) {
        setAuthChecked(true);
        router.replace(`/auth?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setAuthUser(session.user);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = browserClient.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session?.user) {
        setAuthUser(null);
        router.replace(`/auth?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setAuthUser(session.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [browserClient, nextPath, router]);

  // Listen for tutorial events to open inspector sidebar
  useEffect(() => {
    const handleTutorialEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ section: string }>;
      if (customEvent.detail?.section === "inspector") {
        setActiveSection("inspector");
      }
    };

    window.addEventListener("tutorial-open-sidebar", handleTutorialEvent);
    return () => window.removeEventListener("tutorial-open-sidebar", handleTutorialEvent);
  }, []);

  // Load the workspace only when its ID or the authenticated user ID changes
  useEffect(() => {
    if (!workspaceIdFromUrl || !authUser?.id) return;

    const currentStore = store.getState();
    // Reset all workspace state before loading a new workspace
    currentStore.resetWorkspaceState();
    currentStore.setWorkspace({
      id: workspaceIdFromUrl,
      name: currentStore.workspaceName || "Untitled Project",
      owner_id: "__loading__",
    });

    if (!workspaceIdFromUrl.startsWith("local-")) {
      void loadWorkspace(workspaceIdFromUrl);
    }
  }, [authUser?.id, workspaceIdFromUrl]);

  // Resolve workspace access level – runs only when stable identifiers change
  useEffect(() => {
    console.log('Access effect start', { workspaceOwnerId: workspace?.owner_id, authUserId: authUser?.id, accessLevel });
    if (!workspace?.id || !authUser?.id || workspace.owner_id === "__loading__") return;

    const client = browserClient;
    if (!client) return;

    const authUserId = authUser.id;
    const authUserEmail = authUser.email?.trim().toLowerCase() ?? "";

    // Owner gets edit access automatically (robust trim)
    const trimmedOwnerId = (workspace.owner_id ?? "").trim();
    const trimmedUserId = (authUserId ?? "").trim();
    console.log('Owner check', { trimmedOwnerId, trimmedUserId, accessLevel });
    if (trimmedOwnerId && trimmedUserId && trimmedOwnerId === trimmedUserId) {
      if (accessLevel !== "edit") {
        setWorkspaceAccess("edit");
      }
      console.log('Owner detected, edit access set');
      return;
    }

    const accessFromUrl = searchParams.get("access");
    if (isShareAccessLevel(accessFromUrl)) {
      if (accessLevel !== accessFromUrl) {
        setWorkspaceAccess(accessFromUrl);
      }
      return;
    }

    let active = true;

    void client
      .from("workspace_shares")
      .select("access_level, shared_with_id, shared_with_email, active")
      .eq("workspace_id", workspace.id)
      .eq("active", true)
      .then(({ data, error }) => {
        if (!active) return;

        if (!error && data?.length) {
          const match = data.find((row) => (
            row.shared_with_id === authUserId ||
            (authUserEmail && typeof row.shared_with_email === "string" && row.shared_with_email.toLowerCase() === authUserEmail)
          ));

          if (match && isShareAccessLevel(match.access_level)) {
            if (accessLevel !== match.access_level) {
              setWorkspaceAccess(match.access_level);
            }
            return;
          }
        }

        // SAFEGUARD: ensure we are not the owner before redirect
        const ownerId = (workspace.owner_id ?? "").trim();
        const userId = (authUser?.id ?? "").trim();
        if (ownerId && userId && ownerId === userId) {
          // Owner – do nothing (owner case handled earlier)
          return;
        }
        router.replace("/projects");
      });

    return () => {
      active = false;
    };
  }, [accessLevel, authUser, setWorkspaceAccess, workspace?.id, workspace?.owner_id]);

  useEffect(() => {
    if (!workspace?.id || !authUser?.id || workspace.owner_id === "__loading__") return;
    const nextRole = workspace.owner_id === authUser.id
      ? "owner"
      : accessLevel === "edit"
        ? "editor"
        : accessLevel === "comment"
          ? "commenter"
          : "viewer";

    const currentRole = integrationStore.getState().currentUserRole;
    if (!workspace?.id || workspace.owner_id === "__loading__" || !authUser) {
      setComments([]);
      setCommentsError(null);
      setCommentsLoading(false);
      return;
    }

    if (workspace.id.startsWith("local-")) {
      setCommentsLoading(true);
      setCommentsError(null);

      try {
        const raw = typeof window !== "undefined"
          ? window.localStorage.getItem(`${LOCAL_COMMENTS_STORAGE_PREFIX}${workspace.id}`)
          : null;
        const parsed = raw ? (JSON.parse(raw) as WorkspaceComment[]) : [];
        setComments(parsed);
      } catch {
        setCommentsError("Could not load local comments.");
      } finally {
        setCommentsLoading(false);
      }

      return;
    }

    const client = browserClient;
    if (!client) return;

    let active = true;

    const reloadComments = async () => {
      setCommentsLoading(true);
      setCommentsError(null);

      const { comments: nextComments, error } = await loadWorkspaceComments(workspace.id);
      if (!active) return;

      if (error) {
        setCommentsError(error);
      } else {
        setComments(nextComments);
      }
      setCommentsLoading(false);
    };

    void reloadComments();

    const channel = client
      .channel(`workspace:${workspace.id}:comments`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_comments", filter: `workspace_id=eq.${workspace.id}` },
        () => {
          void reloadComments();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [authUser?.id, browserClient, workspace?.id, workspace?.owner_id]);



  async function handleAddComment(message: string, targetElementId: string | null) {
    if (!workspace?.id || !authUser) {
      return;
    }

    setCommentsError(null);

    const metadata = authUser.user_metadata || {};
    const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
    const authorName = fullName || authUser.email?.split("@")[0] || "User";

    if (workspace.id.startsWith("local-")) {
      const nextComment: WorkspaceComment = {
        id: `local-comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workspaceId: workspace.id,
        authorId: authUser.id,
        authorName,
        authorEmail: authUser.email ?? null,
        message: message.trim(),
        targetElementId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolved: false,
        resolvedAt: null,
      };

      setComments((previous) => {
        const next = [...previous, nextComment];
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`${LOCAL_COMMENTS_STORAGE_PREFIX}${workspace.id}`, JSON.stringify(next));
        }
        return next;
      });
      return;
    }

    const { comment: createdComment, error } = await createWorkspaceComment(
      workspace.id,
      {
        id: authUser.id,
        name: authorName,
        email: authUser.email ?? null,
      },
      message,
      targetElementId
    );

    if (error) {
      setCommentsError(error);
      return;
    }

    if (createdComment) {
      setComments((previous) => [...previous, createdComment]);
    }
  }

  async function syncLocalWorkspaceToSupabase(): Promise<{ workspaceId: string | null; error: string | null }> {
    if (!workspace?.id || !workspace.id.startsWith("local-") || !authUser || !browserClient) {
      return { workspaceId: workspace?.id ?? null, error: null };
    }

    const localCommentsKey = `${LOCAL_COMMENTS_STORAGE_PREFIX}${workspace.id}`;
    const localComments = typeof window !== "undefined"
      ? (() => {
        const raw = window.localStorage.getItem(localCommentsKey);
        if (!raw) return [] as WorkspaceComment[];
        try {
          return JSON.parse(raw) as WorkspaceComment[];
        } catch {
          return [] as WorkspaceComment[];
        }
      })()
      : [];

    const response = await fetch("/api/workspaces/sync-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceName,
        elements: elements.map((element) => ({
          id: element.id,
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation,
          text: element.text ?? null,
          layerOrder: element.layerOrder,
          visible: element.visible,
          locked: element.locked,
          style: element.style,
        })),
        comments: localComments,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      workspace?: { id: string; name: string; owner_id: string };
    };

    if (!response.ok || !payload.workspace) {
      const errorMessage = payload.error || "Could not create cloud workspace.";
      setCommentsError(errorMessage);
      return { workspaceId: null, error: errorMessage };
    }

    const createdWorkspace = payload.workspace;

    if (typeof window !== "undefined" && localComments.length) {
      window.localStorage.removeItem(localCommentsKey);
    }

    store.getState().setWorkspace({
      id: createdWorkspace.id,
      name: createdWorkspace.name,
      owner_id: createdWorkspace.owner_id,
    });

    const params = new URLSearchParams(searchParams.toString());
    params.set("workspaceId", createdWorkspace.id);
    params.delete("projectId");
    params.delete("id");
    params.delete("workspace");
    router.replace(`/workspace-editor?${params.toString()}`);

    return { workspaceId: createdWorkspace.id, error: null };
  }

  useEffect(() => {
    if (!workspace?.id || workspace.owner_id === "__loading__") {
      setPresences({});
      setRemoteCursors({});
      return;
    }

    initPresenceChannel(workspace.id, currentUserMeta, {
      onSync: (nextPresences) => {
        setPresences(nextPresences);

        const nextIds = new Set(Object.keys(nextPresences));
        for (const [userId, meta] of Object.entries(nextPresences)) {
          updatePresenceUser(userId, meta);
        }
        const currentUsers = usePresenceStore.getState().users;
        for (const userId of Object.keys(currentUsers)) {
          if (!nextIds.has(userId)) {
            removePresenceUser(userId);
          }
        }
        setRemoteCursors((previous) => {
          const next = { ...previous };
          for (const userId of Object.keys(next)) {
            if (!nextIds.has(userId)) {
              delete next[userId];
            }
          }
          return Object.keys(next).length === Object.keys(previous).length ? previous : next;
        });
      },
      onJoin: (userId, meta) => {
        setPresences((previous) => ({ ...previous, [userId]: meta }));
        updatePresenceUser(userId, meta);
      },
      onLeave: (userId) => {
        setPresences((previous) => {
          const next = { ...previous };
          delete next[userId];
          return next;
        });
        removePresenceUser(userId);
        setRemoteCursors((previous) => {
          if (!(userId in previous)) return previous;
          const next = { ...previous };
          delete next[userId];
          return next;
        });
      },
    });

    return () => leavePresenceChannel();
  }, [workspace?.id, currentUserMeta, removePresenceUser, updatePresenceUser]);

  useEffect(() => {
    setLocalUserId(currentUserMeta.user_id);
  }, [currentUserMeta.user_id, setLocalUserId]);

  useEffect(() => {
    if (!workspace?.id || workspace.owner_id === "__loading__") return;

    const client = browserClient;
    if (!client) return;

    const channel = client
      .channel(`workspace:${workspace.id}:sync`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "canvas_elements", filter: `workspace_id=eq.${workspace.id}` },
        () => {
          void loadWorkspace(workspace.id);
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [browserClient, workspace?.id, workspace?.owner_id]);

  useEffect(() => {
    const unsubscribe = onCursorBroadcast((payload) => {
      if (payload.user_id === currentUserMeta.user_id) return;
      setRemoteCursors((previous) => ({
        ...previous,
        [payload.user_id]: { x: payload.x, y: payload.y, updatedAt: Date.now() },
      }));
    });

    return unsubscribe;
  }, [currentUserMeta.user_id]);

  useEffect(() => {
    const unsubscribe = onSelectionBroadcast(({ user_id, element_id }) => {
      if (user_id === currentUserMeta.user_id) return;
      updatePresenceUser(user_id, { selection: element_id });
      setPresences((previous) => {
        const existing = previous[user_id];
        if (!existing) return previous;
        return {
          ...previous,
          [user_id]: {
            ...existing,
            selection: element_id,
          },
        };
      });
    });

    return unsubscribe;
  }, [currentUserMeta.user_id, updatePresenceUser]);

  useEffect(() => {
    if (!workspace?.id || workspace.owner_id === "__loading__") return;

    const result = acquireSelectionLock(currentUserMeta.user_id, selectedElementId);
    if (!result.ok && selectedElementId) {
      selectElement(null);
    }
  }, [currentUserMeta.user_id, selectedElementId, selectElement, workspace?.id, workspace?.owner_id]);

  // Collaborative elevation: boost shadow when remote users click the same element
  useEffect(() => {
    const unsubscribe = onElementClickBroadcast((payload) => {
      if (payload.user_id === currentUserMeta.user_id) return;
      setElevation(payload.element_id, 1);
      setTimeout(() => setElevation(payload.element_id, -1), 3000);
    });
    return unsubscribe;
  }, [currentUserMeta.user_id, setElevation]);

  // Remove stale cursors after 3 seconds of inactivity
  useEffect(() => {
    const id = setInterval(() => {
      setRemoteCursors((prev) => {
        const now = Date.now();
        const next: typeof prev = {};
        for (const [uid, cursor] of Object.entries(prev)) {
          if (now - cursor.updatedAt < 3000) next[uid] = cursor;
        }
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!workspace?.id || workspace.owner_id === "__loading__" || !authUser || !canEdit) return;

    const client = browserClient;
    if (!client) return;

    const signature = JSON.stringify({
      workspaceName,
      elements: elements.map((element) => ({
        id: element.id,
        type: element.type,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        visible: element.visible,
        locked: element.locked,
        layerOrder: element.layerOrder,
        text: element.text ?? null,
        style: element.style,
      })),
    });

    if (signature === lastPersistedSignatureRef.current) {
      return;
    }

    const persistNow = async () => {
      if (persistInFlightRef.current) {
        pendingPersistRef.current = true;
        return;
      }

      persistInFlightRef.current = true;

      try {
        const elementsPayload = elements.map((element) => ({
          id: element.id,
          workspace_id: workspace.id,
          type: element.type,
          position: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          },
          rotation: element.rotation,
          text_content: element.text ?? null,
          style: {
            fill: element.style.fill,
            stroke: element.style.stroke,
            strokeWidth: element.style.strokeWidth,
            opacity: element.style.opacity,
            fontSize: element.style.fontSize,
            fontFamily: element.style.fontFamily,
            fontStyle: element.style.fontStyle,
            fontWeight: element.style.fontWeight,
            textAlign: element.style.textAlign,
            shadowEnabled: element.style.shadowEnabled,
            shadowBlur: element.style.shadowBlur,
            shadowColor: element.style.shadowColor,
            shadowOffsetX: element.style.shadowOffsetX,
            shadowOffsetY: element.style.shadowOffsetY,
            brightness: element.style.brightness ?? 0,
            contrast: element.style.contrast ?? 0,
            tint: element.style.tint ?? 0,
            imageUrl: element.style.imageUrl ?? null,
            parentId: element.parentId ?? null,
            layoutProps: element.layoutProps ?? null,
            points: element.points ?? null,
          },
          style_ext: {
            fill: element.style.fill,
            stroke: element.style.stroke,
            strokeWidth: element.style.strokeWidth,
            opacity: element.style.opacity,
            fontSize: element.style.fontSize,
            fontFamily: element.style.fontFamily,
            fontStyle: element.style.fontStyle,
            fontWeight: element.style.fontWeight,
            textAlign: element.style.textAlign,
            shadowEnabled: element.style.shadowEnabled,
            shadowBlur: element.style.shadowBlur,
            shadowColor: element.style.shadowColor,
            shadowOffsetX: element.style.shadowOffsetX,
            shadowOffsetY: element.style.shadowOffsetY,
            brightness: element.style.brightness ?? 0,
            contrast: element.style.contrast ?? 0,
            tint: element.style.tint ?? 0,
            imageUrl: element.style.imageUrl ?? null,
            parentId: element.parentId ?? null,
            layoutProps: element.layoutProps ?? null,
            points: element.points ?? null,
          },
          layer_order: element.layerOrder,
          visible: element.visible,
          locked: element.locked,
          video_url: element.videoUrl ?? null,
          trim_start: element.trimStart ?? null,
          trim_end: element.trimEnd ?? null,
        }));

        const deleteResult = await client.from("canvas_elements").delete().eq("workspace_id", workspace.id);
        if (deleteResult.error) {
          throw new Error(deleteResult.error.message || "Failed to clear existing workspace elements.");
        }

        if (elementsPayload.length) {
          let candidatePayload = elementsPayload as Record<string, unknown>[];
          let inserted = false;

          for (let attempt = 0; attempt < 8; attempt += 1) {
            const insertResult = await client.from("canvas_elements").insert(candidatePayload);
            if (!insertResult.error) {
              inserted = true;
              break;
            }

            if (isUuidSyntaxErrorMessage(insertResult.error.message)) {
              const hasInvalidId = candidatePayload.some(
                (row) => typeof row.id === "string" && !isUuidValue(row.id)
              );
              if (hasInvalidId) {
                candidatePayload = removeColumnFromRows(candidatePayload, "id");
                continue;
              }
            }

            if (isDuplicatePrimaryKeyMessage(insertResult.error.message)) {
              const nextPayload = removeColumnFromRows(candidatePayload, "id");
              if (JSON.stringify(nextPayload) !== JSON.stringify(candidatePayload)) {
                candidatePayload = nextPayload;
                continue;
              }
            }

            const missingColumn = extractMissingColumnFromMessage(insertResult.error.message);
            if (!missingColumn) {
              throw new Error(insertResult.error.message || "Failed to insert workspace elements.");
            }

            const nextPayload = removeColumnFromRows(candidatePayload, missingColumn);
            if (JSON.stringify(nextPayload) === JSON.stringify(candidatePayload)) {
              throw new Error(insertResult.error.message || "Failed to adjust workspace element payload.");
            }

            candidatePayload = nextPayload;
          }

          if (!inserted) {
            throw new Error("Could not save workspace elements due to schema mismatch.");
          }
        }

        // History snapshot is optional — don't block the save if it fails
        void saveWorkspaceHistorySnapshot(workspace.id, {
          elements,
          selectedElementId,
          workspaceName,
        }, "Autosave");

        broadcastCanvasUpdate({
          workspaceId: workspace.id,
          workspaceName,
          elementCount: elements.length,
          selectedElementId,
          updatedAt: Date.now(),
        });

        lastPersistedSignatureRef.current = signature;
      } catch (error) {
        console.error("[EditorShell] Autosave failed:", error);
      } finally {
        persistInFlightRef.current = false;

        if (pendingPersistRef.current) {
          pendingPersistRef.current = false;
          setSaveStatus("saving");
          setTimeout(() => {
            persistNowRef.current?.();
          }, 0);
          return;
        }

        setSaveStatus("saved");
      }
    };

    persistNowRef.current = () => {
      void persistNow();
    };

    setSaveStatus("saving");
    clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistNowRef.current?.();
    }, 450);

    return () => clearTimeout(persistTimerRef.current);
  }, [authUser, browserClient, canEdit, elements, selectedElementId, workspace?.id, workspace?.owner_id, workspaceName]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const flushPendingChanges = () => {
      if (workspaceDraftKey && typeof window !== "undefined") {
        window.localStorage.setItem(
          workspaceDraftKey,
          JSON.stringify({ workspaceName, selectedElementId, elements, updatedAt: Date.now() })
        );
      }
      clearTimeout(persistTimerRef.current);
      persistNowRef.current?.();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushPendingChanges();
      }
    };

    window.addEventListener("pagehide", flushPendingChanges);
    window.addEventListener("beforeunload", flushPendingChanges);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pagehide", flushPendingChanges);
      window.removeEventListener("beforeunload", flushPendingChanges);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [elements, selectedElementId, workspaceDraftKey, workspaceName]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const ctrl = event.ctrlKey || event.metaKey;

      if (ctrl && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandBrainOpen((o) => !o);
        return;
      }

      if (ctrl && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (ctrl && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (ctrl && event.key.toLowerCase() === "c") {
        if (selectedElementId) copySelectedElement();
        return;
      }

      if (ctrl && event.key.toLowerCase() === "v") {
        event.preventDefault();
        if (canEdit) pasteElement();
        return;
      }

      if (ctrl && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (selectedElementId) duplicateSelectedElement();
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedElementId) {
        event.preventDefault();
        deleteSelectedElement();
        return;
      }

      const nudge = event.shiftKey ? 10 : 1;
      if (selectedElementId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const el = elements.find((e) => e.id === selectedElementId);
        if (!el) return;
        const delta =
          event.key === "ArrowUp"
            ? { y: el.y - nudge }
            : event.key === "ArrowDown"
              ? { y: el.y + nudge }
              : event.key === "ArrowLeft"
                ? { x: el.x - nudge }
                : { x: el.x + nudge };
        updateElement(selectedElementId, delta);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, copySelectedElement, deleteSelectedElement, duplicateSelectedElement, elements, pasteElement, selectedElementId, undo, redo, updateElement]);

  const [openAssetLibrary, setOpenAssetLibrary] = useState(false);
  const [openTemplatePicker, setOpenTemplatePicker] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUseTemplate = useCallback((template: CanvasTemplate) => {
    const idMap = new Map(template.elements.map((element) => [element.id, crypto.randomUUID()]));
    template.elements.forEach((element) => {
      addElement(element.type, {
        ...element,
        id: idMap.get(element.id),
        parentId: element.parentId ? idMap.get(element.parentId) : undefined,
        x: element.x + 40,
        y: element.y + 40,
        style: { ...element.style },
      });
    });
  }, [addElement]);

  const mobileTabs = [
    { key: "canvas", label: "Canvas" },
    { key: "layers", label: "Layers" },
    { key: "inspector", label: "Inspector" },
    { key: "templates", label: "Templates" },
  ] as const;

  if (!authChecked) {
    return (
      <main className="editor-page">
        <section className="editor-shell flex items-center justify-center">
          <p className="text-sm text-[#6a6257]">Checking authentication...</p>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="editor-page">
        <section className="editor-shell flex items-center justify-center">
          <p className="text-sm text-[#6a6257]">Redirecting to login...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="editor-page cc-landing-theme relative">
      {/* Mirror Landing Background */}
      <div
        className="fixed inset-0 pointer-events-none z-[0] transition-all duration-1000"
        style={{
          backgroundImage: `url(${THEME_BACKGROUNDS[canvasTheme] || THEME_BACKGROUNDS.cherry})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-white/20 backdrop-blur-[2px] z-[1]" />

      <PastelBlobBackground theme={canvasTheme} />
      <FallingPetals theme={canvasTheme} />
      <AccumulatedPetals theme={canvasTheme} />
      <div className="workspace-aura" aria-hidden="true" />
      <CustomCursor />
      <InteractiveTutorial />
      <motion.section
        className="editor-shell relative z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}>
      
        {!previewOpen && (
  <motion.header
    className="editor-topbar"
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.06, duration: 0.24 }}
  >
    <div className="editor-topbar-left min-w-0">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <AvatarStack presences={presences} currentUserId={currentUserMeta.user_id} />
            <RoleBadge role={currentUserRole} />
          </div>
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#2d3436] opacity-70">Mode</span>
            <span className="text-[9px] font-medium text-[#2d3436] bg-[#D5A5B1]/10 px-1.5 py-0.5 rounded-full border border-[#D3A5B1]/15 leading-none">
              {workspace?.owner_id === authUser?.id ? "Personal Creator" : "Team Collab"}
            </span>
          </div>
        </div>
        <div className="workspace-name-wrap">
          {isRenamingWorkspace ? (
            <>
              <input type="text" className="workspace-name-input" value={workspaceNameDraft} onChange={(event) => setWorkspaceNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleWorkspaceRenameSubmit(); } if (event.key === "Escape") { event.preventDefault(); handleWorkspaceRenameCancel(); } }} autoFocus />
              <button type="button" className="workspace-name-action" onClick={() => void handleWorkspaceRenameSubmit()} disabled={workspaceRenameSaving} title="Save workspace name">
                {workspaceRenameSaving ? <LoaderCircle size={14} className="autosave-spin" /> : <Check size={14} />}
              </button>
              <button type="button" className="workspace-name-action" onClick={handleWorkspaceRenameCancel} disabled={workspaceRenameSaving} title="Cancel rename">
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="workspace-name-text" title={workspaceName}>{workspaceName}</h1>
              {canRenameWorkspace && (
                <button type="button" className="workspace-name-action" onClick={() => setIsRenamingWorkspace(true)} title="Rename workspace"><Pencil size={12} /></button>
              )}
            </div>
          )}
        </div>
        {/* Undo / Redo */}
        {canEdit && (
          <div className="flex items-center gap-0.5 ml-1">
            <GlassTooltip content="Undo (Ctrl+Z)">
              <button
                type="button"
                id="undo-button"
                className="workspace-name-action"
                onClick={() => undo()}
                title="Undo"
                aria-label="Undo"
              >
                <Undo2 size={14} />
              </button>
            </GlassTooltip>
            <GlassTooltip content="Redo (Ctrl+Shift+Z)">
              <button
                type="button"
                id="redo-button"
                className="workspace-name-action"
                onClick={() => redo()}
                title="Redo"
                aria-label="Redo"
              >
                <Redo2 size={14} />
              </button>
            </GlassTooltip>
          </div>
        )}
      </div>
    </div>
    <div className="editor-topbar-center flex w-max justify-center">
      <div className="inline-flex w-max items-center gap-1.5 rounded-full bg-[#D3A5B1]/5 px-1.5 py-1.5 border border-[#D3A5B1]/10 backdrop-blur-md">
        {NAV_SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = activeSection === section.id;
          return (
            <GlassTooltip key={section.id} content={section.label}>
              <motion.button type="button" onClick={() => setActiveSection(current => current === section.id ? null : section.id)} className={`nav-pill-btn flex-none flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${active ? "bg-[#D3A5B1] text-white shadow-lg shadow-[#D3A5B1]/25" : "text-[#2d3436] hover:bg-[#D3A5B1]/10"}`} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </motion.button>
            </GlassTooltip>
          );
        })}
      </div>
    </div>
    <div className="editor-topbar-right min-w-0">
      <button type="button" className="hidden md:inline-flex toolbar-button" onClick={() => setGenUIOpen(true)} title="Generative UI — generate elements with AI"><Sparkles size={14} /><span>Generate</span></button>
      <button type="button" className="hidden md:inline-flex toolbar-button" onClick={() => setPreviewOpen(true)} title="Multi-screen preview"><Monitor size={14} /><span>Preview</span></button>
      {/* Theme Dropdown */}
      <div className="hidden md:block toolbar-menu editor-export-menu" ref={themeMenuRef}>
        <button type="button" className="toolbar-button toolbar-button-compact" onClick={() => setThemeMenuOpen(open => !open)} title="Change canvas theme">
          <Palette size={14} />
          <span>Theme</span>
          <ChevronDown size={13} className={themeMenuOpen ? "toolbar-menu-chevron open" : "toolbar-menu-chevron"} />
        </button>
        <div className={`toolbar-menu-list${themeMenuOpen ? " open" : ""}`}>
          {([
            { id: "cherry", label: "Cherry Blossom", color: "#D3A5B1" },
            { id: "forest", label: "Forest Moss", color: "#708238" },
            { id: "ocean", label: "Ocean Breeze", color: "#3b7bb8" },
            { id: "sunset", label: "Sunset Dusk", color: "#d97d41" },
          ] satisfies Array<{ id: CanvasTheme; label: string; color: string }>).map((t) => (
            <button key={t.id} type="button" className={`toolbar-menu-item flex items-center gap-2 ${canvasTheme === t.id ? "font-bold text-[var(--accent)]" : ""}`} onClick={() => { setCanvasTheme(t.id); setThemeMenuOpen(false); }}>
              <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: t.color }} />
              <span>{t.label}</span>
              {canvasTheme === t.id && <span className="ml-auto text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="hidden md:inline-flex toolbar-button editor-share-button" onClick={() => setShareDialogOpen(true)} title={workspace?.owner_id === authUser.id ? "Share workspace" : "Open sharing dialog"}><Share2 size={14} /><span>Share</span></button>
      <motion.button type="button" className="hidden md:inline-flex toolbar-button" onClick={() => window.dispatchEvent(new CustomEvent('start-tutorial'))} title="Help & Tutorial" whileHover={{ y: -1, scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <HelpCircle size={14} />
      </motion.button>
      <div className="hidden md:block toolbar-menu editor-export-menu" ref={exportMenuRef}>
        <button type="button" className="toolbar-button toolbar-button-compact editor-export-button" onClick={() => setExportMenuOpen(open => !open)} title="Export workspace"><Download size={14} /><span>Export</span><ChevronDown size={13} className={exportMenuOpen ? "toolbar-menu-chevron open" : "toolbar-menu-chevron"} /></button>
        <div className={`toolbar-menu-list${exportMenuOpen ? " open" : ""}`}>
          <button type="button" className="toolbar-menu-item" onClick={() => { setExportMenuOpen(false); void exportWorkspaceAsPng(`${fileBase}.png`); }}>PNG</button>
          <button type="button" className="toolbar-menu-item" onClick={() => { setExportMenuOpen(false); void exportWorkspaceAsJpeg(`${fileBase}.jpeg`); }}>JPEG</button>
          <button type="button" className="toolbar-menu-item" onClick={() => { setExportMenuOpen(false); void exportWorkspaceAsPdf(`${fileBase}.pdf`); }}>PDF</button>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex md:hidden toolbar-button editor-mobile-menu-trigger"
        onClick={() => setMobileMenuOpen(open => !open)}
        title="Open workspace menu"
        aria-expanded={mobileMenuOpen}
        aria-controls="editor-mobile-menu"
      >
        <Menu size={14} />
        <span>Menu</span>
      </button>
      <AutoSaveBadge status={saveStatus} />
      <ProfileMenu displayName={getDisplayNameFromMetadata(authUser.user_metadata || {}, authUser.email)} email={authUser.email ?? null} avatarUrl={typeof authUser.user_metadata?.avatar_url === "string" ? authUser.user_metadata.avatar_url : null} onLogout={async () => { if (!browserClient) return; await browserClient.auth.signOut(); router.replace("/"); }} />
    </div>
  </motion.header>
)}
              <div className="workspace-layout">
                <motion.div
                  className="workspace-dock-shell"
                  initial={false}
                  animate={{
                    width: activeSection ? 'auto' : 0,
                    opacity: activeSection ? 1 : 0,
                    marginRight: activeSection ? 16 : 0
                  }}
                  transition={{ duration: 0.24 }}
                  style={{ overflow: 'hidden' }}
                >
                  <WorkspaceSidebar
                    workspaceName={workspaceName}
                    workspaceId={workspaceIdFromUrl}
                    comments={comments}
                    commentsLoading={commentsLoading}
                    commentsError={commentsError}
                    currentUserId={authUser.id}
                    canComment={accessLevel === "comment" || canEdit}
                    onAddComment={handleAddComment}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    openAssetLibrary={() => setOpenAssetLibrary(true)}
                    openTemplatePicker={() => setOpenTemplatePicker(true)}
                  />
                </motion.div>

                <motion.div
                  className="workspace-main-shell"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, duration: 0.24 }}
                >
                  <AnimatePresence mode="wait">
                    {selectedElementId ? (
                      <motion.div
                        key="canvas-selection-toolbar"
                        className="canvas-selection-toolbar-shell"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Toolbar
                          workspaceId={workspaceIdFromUrl || ""}
                          workspaceName={workspaceName}
                          openAssetLibrary={() => setOpenAssetLibrary(true)}
                          openTemplatePicker={() => setOpenTemplatePicker(true)}
                          showHistoryActions={false}
                          showAddActions={false}
                          showSelectionActions
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <CanvasWorkspace
                    workspaceId={workspaceIdFromUrl}
                    currentUserId={currentUserMeta.user_id}
                    presences={presences}
                    remoteCursors={remoteCursors}
                    onRealtimeCursorMove={sendRealtimeCursor}
                  />
                </motion.div>
              </div>

              <div className="editor-mobile-layout">
                <div className="editor-mobile-tabs" role="tablist" aria-label="Editor panels">
                  {mobileTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        if (tab.key === "inspector") {
                          setMobilePanel("canvas");
                          setMobileInspectorOpen((prev) => !prev);
                          setMobileAddOpen(false);
                        } else {
                          setMobilePanel(tab.key);
                          setMobileInspectorOpen(false);
                          setMobileAddOpen(false);
                        }
                      }}
                      className={`editor-mobile-tab${
                        (tab.key === "inspector" && mobileInspectorOpen) ||
                        (tab.key === "canvas" && mobilePanel === "canvas" && !mobileInspectorOpen) ||
                        (tab.key !== "inspector" && tab.key !== "canvas" && mobilePanel === tab.key)
                          ? " active"
                          : ""
                      }`}
                      aria-pressed={mobilePanel === tab.key}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="editor-mobile-panel">
                  {mobilePanel === "canvas" ? (
                    <div className="editor-mobile-panel-inner relative flex-1 flex flex-col min-h-0">
                      {/* Floating Add Element FAB */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileAddOpen((prev) => !prev);
                            setMobileInspectorOpen(false);
                          }}
                          className="fixed bottom-24 right-4 z-[39] flex items-center justify-center w-12 h-12 rounded-full bg-[#D3A5B1] text-white shadow-lg border border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
                          title="Add Elements"
                        >
                          <Plus size={24} strokeWidth={2.5} />
                        </button>
                      )}

                      <CanvasWorkspace
                        workspaceId={workspaceIdFromUrl || ""}
                        currentUserId={currentUserMeta.user_id}
                        presences={presences}
                        remoteCursors={remoteCursors}
                        onRealtimeCursorMove={sendRealtimeCursor}
                      />

                      {/* Add Menu Bottom Sheet */}
                      <AnimatePresence>
                        {mobileAddOpen && (
                          <>
                            {/* Backdrop overlay */}
                            <div className="fixed inset-0 bg-black/10 z-[40]" onClick={() => setMobileAddOpen(false)} />
                            
                            <motion.div
                              className="fixed bottom-0 left-0 right-0 z-[50] rounded-t-3xl border-t border-[#D3A5B1]/30 bg-white/95 shadow-2xl backdrop-blur-md px-4 pb-8 max-h-[50vh] overflow-y-auto"
                              initial={{ y: "100%" }}
                              animate={{ y: 0 }}
                              exit={{ y: "100%" }}
                              transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            >
                              {/* Drag handle / Header */}
                              <div className="flex flex-col items-center py-3 border-b border-black/[0.04] mb-3 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                                <div className="w-12 h-1 bg-[#8b7355]/20 rounded-full mb-2" />
                                <div className="w-full flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-[#8b7355]">Add to Canvas</span>
                                  <button
                                    type="button"
                                    onClick={() => setMobileAddOpen(false)}
                                    className="p-1 rounded-full hover:bg-black/5 text-[#8b7355] transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Add Tools Content */}
                              <div className="mobile-add-content pb-4">
                                <Toolbar
                                  workspaceId={workspaceIdFromUrl || ""}
                                  workspaceName={workspaceName}
                                  openAssetLibrary={() => {
                                    setMobileAddOpen(false);
                                    setOpenAssetLibrary(true);
                                  }}
                                  openTemplatePicker={() => {
                                    setMobileAddOpen(false);
                                    setOpenTemplatePicker(true);
                                  }}
                                  showHistoryActions={false}
                                  showAddActions={true}
                                  showSelectionActions={false}
                                  onActionComplete={() => setMobileAddOpen(false)}
                                />
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                      {/* Inspector Bottom Sheet */}
                      <AnimatePresence>
                        {mobileInspectorOpen && (
                          <>
                            {/* Backdrop overlay */}
                            <div className="fixed inset-0 bg-black/5 z-[40]" onClick={() => selectElement(null)} />
                            
                            <motion.div
                              className="fixed bottom-0 left-0 right-0 z-[50] rounded-t-3xl border-t border-[#D3A5B1]/30 bg-white/95 shadow-2xl backdrop-blur-md px-4 pb-8 max-h-[50vh] overflow-y-auto"
                              initial={{ y: "100%" }}
                              animate={{ y: 0 }}
                              exit={{ y: "100%" }}
                              transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            >
                              {/* Drag handle / Header */}
                              <div className="flex flex-col items-center py-3 border-b border-black/[0.04] mb-3 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                                <div className="w-12 h-1 bg-[#8b7355]/20 rounded-full mb-2" />
                                <div className="w-full flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-[#8b7355]">Inspector / Properties</span>
                                  <button
                                    type="button"
                                    onClick={() => selectElement(null)}
                                    className="p-1 rounded-full hover:bg-black/5 text-[#8b7355] transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Inspector Content */}
                              <div className="mobile-inspector-content pb-4">
                                <RightSidebar
                                  workspaceId={workspace?.id}
                                  comments={comments}
                                  commentsLoading={commentsLoading}
                                  commentsError={commentsError}
                                  currentUserId={authUser.id}
                                  canComment={accessLevel === "comment" || canEdit}
                                  onAddComment={handleAddComment}
                                />
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : null}

                  {mobilePanel === "layers" ? (
                    <div className="editor-mobile-panel-inner">
                      <LeftSidebar workspaceId={workspaceIdFromUrl || ""} />
                    </div>
                  ) : null}

                  {mobilePanel === "inspector" ? null : null}

                  {mobilePanel === "templates" ? (
                    <div className="editor-mobile-panel-inner">
                      <TemplatePanel workspaceId={workspaceIdFromUrl || "default"} />
                    </div>
                  ) : null}
                </div>
                {openAssetLibrary && (
                  <AssetLibraryPanel
                    open={openAssetLibrary}
                    onClose={() => setOpenAssetLibrary(false)}
                    onSelect={(url) => {
                      addElement("image", { imageUrl: url });
                      setOpenAssetLibrary(false);
                    }}
                    assets={assetList}
                    loading={assetStatus === "loading"}
                    error={assetError}
                    onRefresh={() => void refreshAssets()}
                  />
                )}
                <PresenceOverlay canvasId={workspaceIdFromUrl} />
                {openTemplatePicker && (
                  <TemplatePicker
                    open={openTemplatePicker}
                    onClose={() => setOpenTemplatePicker(false)}
                    onSelect={handleUseTemplate}
                    templates={templateList}
                    loading={templateStatus === "loading"}
                    error={templateError}
                    onRefresh={() => void refreshTemplates()}
                    onSaveCurrent={() => void saveTemplate(workspaceName, elements)}
                  />
                )}
              </div>

              <MultiScreenPreview open={previewOpen} onClose={() => setPreviewOpen(false)} workspaceId={workspaceIdFromUrl} />
              <GenerativeUIModal open={genUIOpen} onClose={() => setGenUIOpen(false)} workspaceId={workspaceIdFromUrl} />

              <AnimatePresence>
                {mobileMenuOpen && (
                  <div className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div
                      id="editor-mobile-menu"
                      className="absolute right-0 top-0 bottom-0 w-64 bg-[#fffdf8] shadow-2xl p-5 flex flex-col gap-4 border-l border-black/5"
                      initial={{ x: 260 }}
                      animate={{ x: 0 }}
                      exit={{ x: 260 }}
                      transition={{ type: "spring", damping: 25, stiffness: 350 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
                        <span className="font-bold text-[#8b7355] text-xs uppercase tracking-wider">Workspace Menu</span>
                        <button type="button" onClick={() => setMobileMenuOpen(false)} className="text-[#8b7355] hover:text-[#FF94B4] p-1">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 -mr-1">
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#D3A5B1]/10 text-xs font-bold text-[#2d2520] transition-colors"
                          onClick={() => { setMobileMenuOpen(false); setGenUIOpen(true); }}
                        >
                          <Sparkles size={14} className="text-[#D3A5B1]" />
                          <span>Generate with AI</span>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#D3A5B1]/10 text-xs font-bold text-[#2d2520] transition-colors"
                          onClick={() => { setMobileMenuOpen(false); setPreviewOpen(true); }}
                        >
                          <Monitor size={14} className="text-[#D3A5B1]" />
                          <span>Multi-Screen Preview</span>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#D3A5B1]/10 text-xs font-bold text-[#2d2520] transition-colors"
                          onClick={() => { setMobileMenuOpen(false); setShareDialogOpen(true); }}
                        >
                          <Share2 size={14} className="text-[#D3A5B1]" />
                          <span>Share Workspace</span>
                        </button>

                        <div className="border-t border-black/[0.05] my-2 pt-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b7355]/60 px-3">Canvas Theme</span>
                          <div className="grid grid-cols-2 gap-1.5 p-1">
                            {([
                              { id: "cherry", label: "Cherry", color: "#D3A5B1" },
                              { id: "forest", label: "Forest", color: "#708238" },
                              { id: "ocean", label: "Ocean", color: "#3b7bb8" },
                              { id: "sunset", label: "Sunset", color: "#d97d41" },
                            ] as const).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                className={`flex items-center gap-1.5 p-2 rounded-lg text-[10px] transition-colors ${canvasTheme === t.id ? "bg-[#D3A5B1]/15 text-[#8b7355] font-bold" : "hover:bg-black/5 text-[#2d2520]"}`}
                                onClick={() => { setCanvasTheme(t.id); setMobileMenuOpen(false); }}
                              >
                                <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: t.color }} />
                                <span>{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-black/[0.05] my-2 pt-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b7355]/60 px-3">Export As</span>
                          <div className="grid grid-cols-3 gap-1.5 p-1">
                            {(["PNG", "JPEG", "PDF"] as const).map((format) => (
                              <button
                                key={format}
                                type="button"
                                className="py-2 rounded-lg border border-black/[0.05] hover:bg-black/5 text-[10px] text-center font-bold text-[#2d2520] transition-colors"
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  if (format === "PNG") void exportWorkspaceAsPng(`${fileBase}.png`);
                                  else if (format === "JPEG") void exportWorkspaceAsJpeg(`${fileBase}.jpeg`);
                                  else void exportWorkspaceAsPdf(`${fileBase}.pdf`);
                                }}
                              >
                                {format}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto border-t border-black/[0.05] pt-3">
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors"
                          onClick={async () => {
                            setMobileMenuOpen(false);
                            if (!browserClient) return;
                            await browserClient.auth.signOut();
                            router.replace("/");
                          }}
                        >
                          <LogOut size={14} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {workspace?.id ? (
                <ShareDialog
                  workspaceId={workspace.id}
                  workspaceName={workspaceName}
                  open={shareDialogOpen}
                  onSyncLocalWorkspace={syncLocalWorkspaceToSupabase}
                  onClose={() => setShareDialogOpen(false)}
                  currentUserRole={currentUserRole}
                  roleAssignments={roleAssignments}
                  onRoleChange={async (userId, role) => {
                    await updateRoleOptimistically(userId, role);
                  }}
                />
              ) : null}

              <CommandBrain
                open={commandBrainOpen}
                onClose={() => setCommandBrainOpen(false)}
                commands={[
                  { id: "add-rect", label: "Add Rectangle", category: "Add Elements", icon: <span>▭</span>, action: () => handleAddElement("rectangle") },
                  { id: "add-circle", label: "Add Circle", category: "Add Elements", icon: <span>○</span>, action: () => handleAddElement("circle") },
                  { id: "add-text", label: "Add Text", category: "Add Elements", icon: <span>T</span>, action: () => handleAddElement("text") },
                  { id: "add-arrow", label: "Add Arrow", category: "Add Elements", icon: <span>→</span>, action: () => handleAddElement("arrow") },
                  { id: "add-star", label: "Add Star", category: "Add Elements", icon: <span>★</span>, action: () => handleAddElement("star") },
                  { id: "add-triangle", label: "Add Triangle", category: "Add Elements", icon: <span>△</span>, action: () => handleAddElement("triangle") },
                  { id: "add-diamond", label: "Add Diamond", category: "Add Elements", icon: <span>◆</span>, action: () => handleAddElement("diamond") },
                  { id: "add-frame", label: "Add Frame", category: "Add Elements", icon: <span>⬜</span>, action: () => handleAddElement("frame") },
                  { id: "undo", label: "Undo", category: "Edit", icon: <span>↩</span>, shortcut: "Ctrl+Z", action: undo },
                  { id: "redo", label: "Redo", category: "Edit", icon: <span>↪</span>, shortcut: "Ctrl+Y", action: redo },
                  { id: "layers", label: "Open Layers", category: "Navigate", icon: <span>≡</span>, action: () => setActiveSection("layers") },
                  { id: "inspector", label: "Open Inspector", category: "Navigate", icon: <span>⚙</span>, action: () => setActiveSection("inspector") },
                  { id: "comments", label: "Open Comments", category: "Navigate", icon: <span>💬</span>, action: () => setActiveSection("comments") },
                  { id: "templates", label: "Open Templates", category: "Navigate", icon: <span>🔖</span>, action: () => setActiveSection("templates") },
                  { id: "activity", label: "Open Activity", category: "Navigate", icon: <span>📋</span>, action: () => setActiveSection("activity") },
                  { id: "share", label: "Share Workspace", category: "Workspace", icon: <span>🔗</span>, action: () => setShareDialogOpen(true) },
                  { id: "preview", label: "Multi-Screen Preview", category: "Workspace", icon: <span>📱</span>, action: () => setPreviewOpen(true) },
                  { id: "export-png", label: "Export as PNG", category: "Export", icon: <span>🖼</span>, action: () => void exportWorkspaceAsPng(`${workspaceName}.png`) },
                  { id: "export-pdf", label: "Export as PDF", category: "Export", icon: <span>📄</span>, action: () => void exportWorkspaceAsPdf(`${workspaceName}.pdf`) },
                  { id: "gen-ui", label: "Generate UI with AI", category: "AI", icon: <span>✨</span>, action: () => setGenUIOpen(true) },
                ] satisfies BrainCommand[]}
              />
              <VoiceCommandManager workspaceId={workspaceIdFromUrl || ""} />
            </motion.section>
          </main>
        );
}
