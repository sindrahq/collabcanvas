"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, LoaderCircle, Share2 } from "lucide-react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { AvatarStack } from "@/components/presence/AvatarStack";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Toolbar } from "@/components/editor/toolbar";
import {
  initPresenceChannel,
  leavePresenceChannel,
  onCursorBroadcast,
  type PresenceMeta,
} from "@/lib/collaboration";
import { createWorkspaceComment, loadWorkspaceComments, type WorkspaceComment } from "@/lib/comments";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveWorkspaceHistorySnapshot } from "@/lib/history";
import { loadWorkspace } from "@/lib/workspaceLoader";
import { type WorkspaceAccessLevel, useWorkspaceStore } from "@/store/workspaceStore";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function isShareAccessLevel(value: unknown): value is WorkspaceAccessLevel {
  return value === "view" || value === "comment" || value === "edit";
}

type AutoSaveStatus = "saved" | "saving";

const PRESENCE_COLORS = ["#0b6e66", "#b35c1c", "#1f6fd6", "#7a3eb3", "#a03a58", "#3d6f2f"];

function buildLocalPresenceMeta(): PresenceMeta {
  if (typeof window === "undefined") {
    return {
      user_id: "local-user",
      name: "Local User",
      color: PRESENCE_COLORS[0],
      avatarUrl: "",
      cursor: { x: 0.5, y: 0.5 },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const accessLevel = useWorkspaceStore((s) => s.accessLevel);
  const canEdit = useWorkspaceStore((s) => s.canEdit);
  const setWorkspaceAccess = useWorkspaceStore((s) => s.setWorkspaceAccess);
  const undo = useWorkspaceStore((s) => s.undo);
  const redo = useWorkspaceStore((s) => s.redo);
  const elements = useWorkspaceStore((s) => s.elements);
  const updateElement = useWorkspaceStore((s) => s.updateElement);

  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>("saved");
  const [authChecked, setAuthChecked] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [presences, setPresences] = useState<Record<string, PresenceMeta>>({});
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; updatedAt: number }>>({});
  const [mobilePanel, setMobilePanel] = useState<"canvas" | "layers" | "inspector">("canvas");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [comments, setComments] = useState<WorkspaceComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const browserClient = useMemo(() => createSupabaseBrowserClient(), []);
  const workspaceIdFromUrl =
    searchParams.get("workspaceId") ??
    searchParams.get("projectId") ??
    searchParams.get("id") ??
    searchParams.get("workspace") ??
    "";
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
    const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";

    return {
      user_id: authUser.id,
      name: fullName || authUser.email?.split("@")[0] || "User",
      color: PRESENCE_COLORS[Math.abs(authUser.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PRESENCE_COLORS.length],
      avatarUrl,
      cursor: { x: 0.5, y: 0.5 },
    } satisfies PresenceMeta;
  }, [authUser]);

  const persistTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPersistedSignatureRef = useRef<string>("");

  useEffect(() => {
    if (!browserClient) {
      setAuthChecked(true);
      return;
    }

    let active = true;

    void browserClient.auth.getUser().then(({ data }) => {
      if (!active) return;

      if (!data.user) {
        setAuthChecked(true);
        router.replace(`/auth?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setAuthUser(data.user);
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

  useEffect(() => {
    if (!workspaceIdFromUrl || !authUser) return;

    const store = useWorkspaceStore.getState();
    store.setWorkspace({
      id: workspaceIdFromUrl,
      name: store.workspaceName || "Untitled Project",
      owner_id: "__loading__",
    });

    if (!workspaceIdFromUrl.startsWith("local-")) {
      void loadWorkspace(workspaceIdFromUrl);
    }
  }, [authUser, workspaceIdFromUrl]);

  useEffect(() => {
    if (!workspace?.id || !authUser || workspace.owner_id === "__loading__") return;

    const client = browserClient;
    if (!client) return;

    if (workspace.owner_id === authUser.id) {
      setWorkspaceAccess("edit");
      return;
    }

    const accessFromUrl = searchParams.get("access");
    if (isShareAccessLevel(accessFromUrl)) {
      setWorkspaceAccess(accessFromUrl);
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
          const email = authUser.email?.trim().toLowerCase() ?? "";
          const match = data.find((row) => (
            row.shared_with_id === authUser.id ||
            (email && typeof row.shared_with_email === "string" && row.shared_with_email.toLowerCase() === email)
          ));

          if (match && isShareAccessLevel(match.access_level)) {
            setWorkspaceAccess(match.access_level);
            return;
          }
        }

        router.replace("/projects");
      });

    return () => {
      active = false;
    };
  }, [authUser, browserClient, router, searchParams, setWorkspaceAccess, workspace?.id, workspace?.owner_id]);

  useEffect(() => {
    if (!workspace?.id || workspace.owner_id === "__loading__" || !authUser) {
      setComments([]);
      setCommentsError(null);
      setCommentsLoading(false);
      return;
    }

    const client = browserClient;
    if (!client) return;

    let active = true;

    const reloadComments = async () => {
      setCommentsLoading(true);
      setCommentsError(null);

      const nextComments = await loadWorkspaceComments(workspace.id);
      if (!active) return;

      setComments(nextComments);
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
  }, [authUser, browserClient, workspace?.id, workspace?.owner_id]);

  async function handleAddComment(message: string, targetElementId: string | null) {
    if (!workspace?.id || !authUser) {
      return;
    }

    const metadata = authUser.user_metadata || {};
    const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
    const authorName = fullName || authUser.email?.split("@")[0] || "User";

    const createdComment = await createWorkspaceComment(
      workspace.id,
      {
        id: authUser.id,
        name: authorName,
        email: authUser.email ?? null,
      },
      message,
      targetElementId
    );

    if (createdComment) {
      setComments((previous) => [...previous, createdComment]);
    }
  }

  useEffect(() => {
    if (!workspace?.id || workspace.owner_id === "__loading__") {
      setPresences({});
      setRemoteCursors({});
      return;
    }

    initPresenceChannel(workspace.id, currentUserMeta, {
      onSync: (nextPresences) => setPresences(nextPresences),
      onJoin: (userId, meta) => setPresences((previous) => ({ ...previous, [userId]: meta })),
      onLeave: (userId) =>
        setPresences((previous) => {
          const next = { ...previous };
          delete next[userId];
          return next;
        }),
    });

    return () => leavePresenceChannel();
  }, [workspace?.id, currentUserMeta]);

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

    setSaveStatus("saving");
    clearTimeout(persistTimerRef.current);

    persistTimerRef.current = setTimeout(() => {
      void (async () => {
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
            },
            layer_order: element.layerOrder,
            visible: element.visible,
            locked: element.locked,
          }));

          const deleteResult = await client.from("canvas_elements").delete().eq("workspace_id", workspace.id);
          if (deleteResult.error) {
            throw deleteResult.error;
          }

          if (elementsPayload.length) {
            const insertResult = await client.from("canvas_elements").insert(elementsPayload);
            if (insertResult.error) {
              throw insertResult.error;
            }
          }

          const historyResult = await saveWorkspaceHistorySnapshot(workspace.id, {
            elements,
            selectedElementId,
            workspaceName,
          }, "Autosave");

          if (!historyResult) {
            throw new Error("Unable to save workspace history.");
          }

          lastPersistedSignatureRef.current = signature;
          setSaveStatus("saved");
        } catch {
          setSaveStatus("saved");
        }
      })();
    }, 450);

    return () => clearTimeout(persistTimerRef.current);
  }, [authUser, browserClient, canEdit, elements, selectedElementId, workspace?.id, workspace?.owner_id, workspaceName]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const ctrl = event.ctrlKey || event.metaKey;

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
  }, [deleteSelectedElement, duplicateSelectedElement, elements, selectedElementId, undo, redo, updateElement]);

  const mobileTabs = [
    { key: "canvas", label: "Canvas" },
    { key: "layers", label: "Layers" },
    { key: "inspector", label: "Inspector" },
  ] as const;

  if (!authChecked) {
    return (
      <main className="editor-page">
        <section className="editor-shell flex items-center justify-center">
          <p className="text-sm text-white/70">Checking authentication...</p>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="editor-page">
        <section className="editor-shell flex items-center justify-center">
          <p className="text-sm text-white/70">Redirecting to login...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="editor-page">
      <motion.section
        className="editor-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <motion.header
          className="editor-topbar"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.24 }}
        >
          <div className="editor-topbar-left">
            <div className="editor-logo-mark" />
            <div>
              <p className="eyebrow" style={{ marginBottom: 2 }}>
                Editor
              </p>
              <h1 className="editor-heading">{workspaceName}</h1>
            </div>
          </div>

          <div className="editor-topbar-right">
            <AvatarStack presences={presences} currentUserId={currentUserMeta.user_id} />
            {workspace?.owner_id === authUser.id ? (
              <button
                type="button"
                className="toolbar-button editor-share-button"
                onClick={() => setShareDialogOpen(true)}
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            ) : (
              <span className="toolbar-label editor-access-badge">
                {accessLevel === "comment" ? "Can comment" : canEdit ? "Can edit" : "Read only"}
              </span>
            )}
            <AutoSaveBadge status={saveStatus} />
          </div>
        </motion.header>

        <div className="editor-grid">
          <motion.div
            className="editor-column editor-column-left"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.24 }}
          >
            <LeftSidebar />
          </motion.div>

          <motion.div
            className="editor-column editor-column-main"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.24 }}
          >
            <Toolbar workspaceName={workspaceName} />
            <CanvasWorkspace
              currentUserId={currentUserMeta.user_id}
              presences={presences}
              remoteCursors={remoteCursors}
            />
          </motion.div>

          <motion.div
            className="editor-column editor-column-right"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.24 }}
          >
            <RightSidebar
              workspaceId={workspace?.id}
              comments={comments}
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              currentUserId={authUser.id}
              canComment={accessLevel === "comment" || canEdit}
              onAddComment={handleAddComment}
            />
          </motion.div>
        </div>

        <div className="editor-mobile-layout">
          <div className="editor-mobile-tabs" role="tablist" aria-label="Editor panels">
            {mobileTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobilePanel(tab.key)}
                className={`editor-mobile-tab${mobilePanel === tab.key ? " active" : ""}`}
                aria-pressed={mobilePanel === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="editor-mobile-panel">
            {mobilePanel === "canvas" ? (
              <div className="editor-mobile-panel-inner">
                <Toolbar workspaceName={workspaceName} />
                <CanvasWorkspace
                  currentUserId={currentUserMeta.user_id}
                  presences={presences}
                  remoteCursors={remoteCursors}
                />
              </div>
            ) : null}

            {mobilePanel === "layers" ? (
              <div className="editor-mobile-panel-inner">
                <LeftSidebar />
              </div>
            ) : null}

            {mobilePanel === "inspector" ? (
              <div className="editor-mobile-panel-inner">
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
            ) : null}
          </div>
        </div>

        {workspace?.id ? (
          <ShareDialog
            workspaceId={workspace.id}
            workspaceName={workspaceName}
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
          />
        ) : null}
      </motion.section>
    </main>
  );
}
