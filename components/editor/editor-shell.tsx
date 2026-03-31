"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { syncAllElements } from "@/lib/styleSync";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

export function EditorShell() {
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);
  const elements = useWorkspaceStore((s) => s.elements);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Auto-save whenever elements change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setSaveStatus("saving");

    debounceRef.current = setTimeout(async () => {
      await syncAllElements(elements);
      setSaveStatus("saved");

      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [elements]);

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
          {saveStatus === "saving" && (
            <div className="autosave-badge" style={{ color: "var(--text-muted)" }}>
              <div className="autosave-dot" style={{ background: "var(--text-muted)" }} />
              Saving...
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="autosave-badge">
              <div className="autosave-dot" />
              Saved ✓
            </div>
          )}
          {saveStatus === "idle" && (
            <div className="autosave-badge">
              <div className="autosave-dot" />
              Autosave on
            </div>
          )}
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