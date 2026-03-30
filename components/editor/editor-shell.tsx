"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import { useWorkspaceStore } from "@/store/workspaceStore";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

const panelMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 }
};

export function EditorShell() {
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const duplicateSelectedElement = useWorkspaceStore((state) => state.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((state) => state.deleteSelectedElement);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();

        if (selectedElementId) {
          duplicateSelectedElement();
        }

        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedElementId) {
        event.preventDefault();
        deleteSelectedElement();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelectedElement, duplicateSelectedElement, selectedElementId]);

  return (
    <main className="editor-page">
      <div className="editor-ambient editor-ambient-one" />
      <div className="editor-ambient editor-ambient-two" />

      <motion.section
        className="editor-shell"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.header
          className="editor-topbar"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
        >
          <div>
            <p className="eyebrow">Live Editor</p>
            <h1 className="editor-heading">Harsh Workspace Canvas</h1>
          </div>
          <div className="editor-status">
            <span className="status-dot" />
            Konva canvas active
          </div>
        </motion.header>

        <div className="editor-grid">
          <motion.div
            className="editor-column editor-column-left"
            {...panelMotion}
            transition={{ delay: 0.12, duration: 0.35 }}
          >
            <LeftSidebar />
          </motion.div>

          <motion.div
            className="editor-column editor-column-main"
            {...panelMotion}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            <Toolbar />
            <CanvasWorkspace />
          </motion.div>

          <motion.div
            className="editor-column editor-column-right"
            {...panelMotion}
            transition={{ delay: 0.24, duration: 0.35 }}
          >
            <RightSidebar />
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
