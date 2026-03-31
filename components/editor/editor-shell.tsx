"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import { useWorkspaceStore } from "@/store/workspaceStore";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

type AutoSaveStatus = "saved" | "saving";

function AutoSaveBadge({ status }: { status: AutoSaveStatus }) {
  return (
    <motion.div
      className={`autosave-badge autosave-badge-${status}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      key={status}
    >
      {status === "saving" ? (
        <><LoaderCircle size={13} className="autosave-spin" /><span>Saving…</span></>
      ) : (
        <><Check size={13} /><span>All changes saved</span></>
      )}
    </motion.div>
  );
}

export function EditorShell() {
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const duplicateSelectedElement = useWorkspaceStore((state) => state.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((state) => state.deleteSelectedElement);
  const workspaceName = useWorkspaceStore((state) => state.workspaceName);

  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const unsubscribe = useWorkspaceStore.subscribe((state, prev) => {
      if (state.elements !== prev.elements) {
        setSaveStatus("saving");
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus("saved"), 700);
      }
    });
    return () => { unsubscribe(); clearTimeout(saveTimerRef.current); };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (selectedElementId) duplicateSelectedElement();
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedElementId) {
        event.preventDefault();
        deleteSelectedElement();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedElement, duplicateSelectedElement, selectedElementId]);

  return (
    <main className="editor-page">
      <div className="editor-ambient editor-ambient-one" />
      <div className="editor-ambient editor-ambient-two" />

      <motion.section className="editor-shell"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <motion.header className="editor-topbar"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.32 }}>
          <div className="editor-topbar-left">
            <div className="editor-logo-mark" />
            <div>
              <p className="eyebrow" style={{ marginBottom: 2 }}>Collaborative Canvas</p>
              <h1 className="editor-heading">{workspaceName}</h1>
            </div>
          </div>
          <div className="editor-topbar-right">
            <AutoSaveBadge status={saveStatus} />
            <div className="editor-status">
              <span className="status-dot" />
              Live
            </div>
          </div>
        </motion.header>

        <div className="editor-grid">
          <motion.div className="editor-column editor-column-left"
            initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14, duration: 0.32 }}>
            <LeftSidebar />
          </motion.div>

          <motion.div className="editor-column editor-column-main"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.32 }}>
            <Toolbar />
            <CanvasWorkspace />
          </motion.div>

          <motion.div className="editor-column editor-column-right"
            initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22, duration: 0.32 }}>
            <RightSidebar />
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
