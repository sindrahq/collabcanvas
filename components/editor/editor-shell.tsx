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
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

type AutoSaveStatus = "saved" | "saving";

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
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const undo = useWorkspaceStore((s) => s.undo);
  const redo = useWorkspaceStore((s) => s.redo);
  const elements = useWorkspaceStore((s) => s.elements);
  const updateElement = useWorkspaceStore((s) => s.updateElement);

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

      const NUDGE = event.shiftKey ? 10 : 1;
      if (selectedElementId && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const el = elements.find((e) => e.id === selectedElementId);
        if (!el) return;
        const delta =
          event.key === "ArrowUp"    ? { y: el.y - NUDGE } :
          event.key === "ArrowDown"  ? { y: el.y + NUDGE } :
          event.key === "ArrowLeft"  ? { x: el.x - NUDGE } :
                                       { x: el.x + NUDGE };
        updateElement(selectedElementId, delta);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedElement, duplicateSelectedElement, elements, selectedElementId, undo, redo, updateElement]);

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
            <Toolbar />
            <CanvasWorkspace />
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
      </motion.section>
    </main>
  );
}
