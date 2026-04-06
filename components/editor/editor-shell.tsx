"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { AvatarStack } from "@/components/presence/AvatarStack";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import {
  initPresenceChannel,
  leavePresenceChannel,
  onCursorBroadcast,
  type PresenceMeta,
} from "@/lib/collaboration";
import { loadWorkspace } from "@/lib/workspaceLoader";
import { useWorkspaceStore } from "@/store/workspaceStore";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
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
  const searchParams = useSearchParams();
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const undo = useWorkspaceStore((s) => s.undo);
  const redo = useWorkspaceStore((s) => s.redo);
  const elements = useWorkspaceStore((s) => s.elements);
  const updateElement = useWorkspaceStore((s) => s.updateElement);

  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>("saved");
  const [presences, setPresences] = useState<Record<string, PresenceMeta>>({});
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; updatedAt: number }>>({});
  const [mobilePanel, setMobilePanel] = useState<"canvas" | "layers" | "inspector">("canvas");
  const currentUserMeta = useMemo(() => buildLocalPresenceMeta(), []);
  const workspaceIdFromUrl = searchParams.get("workspaceId") ?? "";

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!workspaceIdFromUrl) return;

    const store = useWorkspaceStore.getState();
    store.setWorkspace({
      id: workspaceIdFromUrl,
      name: store.workspaceName || "Untitled Project",
      owner_id: currentUserMeta.user_id,
    });

    if (!workspaceIdFromUrl.startsWith("local-")) {
      void loadWorkspace(workspaceIdFromUrl);
    }
  }, [currentUserMeta.user_id, workspaceIdFromUrl]);

  useEffect(() => {
    if (!workspace?.id) {
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
    const unsubscribe = useWorkspaceStore.subscribe((state, prev) => {
      if (
        state.elements !== prev.elements ||
        state.selectedElementId !== prev.selectedElementId ||
        state.workspaceName !== prev.workspaceName
      ) {
        setSaveStatus("saving");
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus("saved"), 700);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(saveTimerRef.current);
    };
  }, []);

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
            <RightSidebar />
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
                <RightSidebar />
              </div>
            ) : null}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
