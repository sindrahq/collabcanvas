"use client";

import { useEffect } from "react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import { useWorkspaceStore } from "@/store/workspaceStore";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

export function EditorShell() {
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedElementId) duplicateSelectedElement();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
  e.preventDefault();
  deleteSelectedElement();
}
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
  e.preventDefault();
  const { snapshots, restoreSnapshot } = useWorkspaceStore.getState();
  if (snapshots.length > 0) restoreSnapshot(snapshots[0].id);
}
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedElement, duplicateSelectedElement, selectedElementId]);

  return (
    <main className="editor-page">
      <header className="editor-topbar">
        <div className="topbar-left">
          <span className="topbar-logo">CollabCanvas</span>
          <div className="topbar-divider" />
          <span className="topbar-filename">Untitled Project</span>
        </div>

        <div className="topbar-center">
          <Toolbar />
        </div>

        <div className="topbar-right">
          <div className="autosave-badge">
            <div className="autosave-dot" />
            Autosaved
          </div>
        </div>
      </header>

      <div className="editor-grid">
        <LeftSidebar />
        <div className="editor-column-main">
          <CanvasWorkspace />
        </div>
        <RightSidebar />
      </div>
    </main>
  );
}