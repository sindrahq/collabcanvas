"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { syncAllElements } from "@/lib/styleSync";
import Link from "next/link";

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
  const [projectName, setProjectName] = useState("Untitled Project");
  const [editingName, setEditingName] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      await syncAllElements(elements);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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
      {/* Top navbar - Canva style */}
      <header style={{
        height: 56, minHeight: 56,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(5, 5, 15, 0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(37, 99, 235, 0.15)",
        boxShadow: "0 1px 20px rgba(37, 99, 235, 0.08)",
        zIndex: 20, gap: 12,
      }}>
        {/* Left — Logo + back */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
          <Link href="/projects" style={{
            display: "flex", alignItems: "center", gap: 8,
            color: "rgba(255,255,255,0.5)", fontSize: 13,
            transition: "color 150ms", textDecoration: "none",
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#60a5fa"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            ← Back
          </Link>
          <div style={{
            width: 1, height: 18,
            background: "rgba(37,99,235,0.2)",
          }} />
          <div style={{
            fontSize: 16, fontWeight: 800,
            background: "linear-gradient(135deg, #60a5fa, #2563eb, #7c3aed)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>CollabCanvas</div>
        </div>

        {/* Center — Editable project name + action toolbar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {editingName ? (
            <input
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
              style={{
                background: "rgba(37,99,235,0.1)",
                border: "1px solid rgba(37,99,235,0.4)",
                borderRadius: 6, padding: "3px 10px",
                color: "#fff", fontSize: 13, fontWeight: 600,
                outline: "none", textAlign: "center", width: 200,
              }}
            />
          ) : (
            <div
              onClick={() => setEditingName(true)}
              style={{
                fontSize: 13, fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer", padding: "2px 8px",
                borderRadius: 4, transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(37,99,235,0.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              }}
              title="Click to rename"
            >
              {projectName} ✎
            </div>
          )}

          {/* Action toolbar row */}
          <Toolbar />
        </div>

        {/* Right — Save status + Share */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200, justifyContent: "flex-end" }}>
          {saveStatus === "saving" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "rgba(255,255,255,0.4)",
              }} />
              Saving...
            </div>
          )}
          {saveStatus === "saved" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 6px #10b981",
              }} />
              Saved ✓
            </div>
          )}
          {saveStatus === "idle" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#10b981",
                animation: "pulse-dot 2s ease-in-out infinite",
              }} />
              Autosave on
            </div>
          )}

          <button style={{
            padding: "7px 18px", borderRadius: 8,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none",
            boxShadow: "0 0 20px rgba(37,99,235,0.3)",
            transition: "all 150ms",
          }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 30px rgba(37,99,235,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 20px rgba(37,99,235,0.3)"}
          >
            Share
          </button>
        </div>
      </header>

      {/* Main editor area */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "64px 240px 1fr 280px",
        overflow: "hidden",
      }}>
        {/* Far left — Canva-style icon nav */}
        <div style={{
          background: "rgba(5,5,15,0.95)",
          borderRight: "1px solid rgba(37,99,235,0.1)",
          display: "flex", flexDirection: "column",
          alignItems: "center", paddingTop: 12, gap: 4,
        }}>
          {[
            { icon: "📄", label: "Templates" },
            { icon: "⬜", label: "Elements" },
            { icon: "T", label: "Text" },
            { icon: "🖼️", label: "Media" },
            { icon: "🎨", label: "Brand" },
            { icon: "📤", label: "Uploads" },
            { icon: "🔧", label: "Tools" },
            { icon: "📁", label: "Projects" },
            { icon: "✨", label: "Magic" },
          ].map((item) => (
            <div key={item.label} style={{
              width: 48, height: 52,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, cursor: "pointer", borderRadius: 8,
              transition: "all 150ms", color: "rgba(255,255,255,0.4)",
              fontSize: item.icon === "T" ? 18 : 20,
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(37,99,235,0.1)";
                e.currentTarget.style.color = "#60a5fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Left panel — Layers + Edit tools */}
        <LeftSidebar />

        {/* Center — Canvas */}
        <div className="editor-column-main">
          <CanvasWorkspace />
        </div>

        {/* Right — Inspector */}
        <RightSidebar />
      </div>
    </main>
  );
}