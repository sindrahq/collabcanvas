"use client";

import { useRef } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { CanvasElementType } from "@/store/workspaceStore";
import { useParticleBurst } from "@/components/editor/particle-burst";

const shapes = [
  { label: "Rect", icon: "⬜", action: "rectangle" as CanvasElementType, color: "#2563eb" },
  { label: "Circle", icon: "⭕", action: "circle" as CanvasElementType, color: "#10b981" },
  { label: "Triangle", icon: "△", action: "triangle" as CanvasElementType, color: "#7c3aed" },
  { label: "Star", icon: "★", action: "star" as CanvasElementType, color: "#f59e0b" },
  { label: "Arrow", icon: "→", action: "arrow" as CanvasElementType, color: "#0891b2" },
  { label: "Diamond", icon: "◇", action: "diamond" as CanvasElementType, color: "#ef4444" },
  { label: "Text", icon: "T", action: "text" as CanvasElementType, color: "#fde68a" },
];

const actionTools = [
  { label: "Edit", icon: "✏️" },
  { label: "BG Remove", icon: "🎭" },
  { label: "Eraser", icon: "🧹" },
  { label: "Flip", icon: "↔️" },
  { label: "Animate", icon: "🎬" },
  { label: "Position", icon: "📍" },
];

export function Toolbar() {
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const addElement = useWorkspaceStore((s) => s.addElement);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);
  const saveSnapshot = useWorkspaceStore((s) => s.saveSnapshot);
  const restoreSnapshot = useWorkspaceStore((s) => s.restoreSnapshot);
  const snapshots = useWorkspaceStore((s) => s.snapshots);
  const { burst } = useParticleBurst();

  function handleAdd(type: CanvasElementType, e: React.MouseEvent) {
    saveSnapshot();
    addElement(type);
    burst(e.clientX, e.clientY);
  }

  function handleDuplicate(e: React.MouseEvent) {
    if (!selectedElementId) return;
    saveSnapshot();
    duplicateSelectedElement();
    burst(e.clientX, e.clientY);
  }

  function handleDelete() {
    if (!selectedElementId) return;
    saveSnapshot();
    deleteSelectedElement();
  }

  function handleUndo() {
    if (snapshots.length === 0) return;
    restoreSnapshot(snapshots[0].id);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>

      {/* Action tools - Canva style */}
      {actionTools.map((tool) => (
        <button key={tool.label} className="toolbar-btn" title={tool.label} style={{
          gap: 4, padding: "4px 10px",
          color: selectedElementId ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
        }}>
          <span style={{ fontSize: 13 }}>{tool.icon}</span>
          <span style={{ fontSize: 11 }}>{tool.label}</span>
        </button>
      ))}

      <div style={{ width: 1, height: 16, background: "rgba(37,99,235,0.2)", margin: "0 4px" }} />

      {/* Shape tools */}
      {shapes.map((s) => (
        <button key={s.action} className="toolbar-btn"
          onClick={(e) => handleAdd(s.action, e)}
          title={`Add ${s.label}`} style={{ gap: 4, padding: "4px 10px" }}>
          <span style={{ fontSize: 13, color: s.color }}>{s.icon}</span>
          <span style={{ fontSize: 11 }}>{s.label}</span>
        </button>
      ))}

      <div style={{ width: 1, height: 16, background: "rgba(37,99,235,0.2)", margin: "0 4px" }} />

      {/* Edit actions */}
      <button className="toolbar-btn"
        onClick={(e) => handleDuplicate(e)}
        disabled={!selectedElementId}
        title="Duplicate (Ctrl+D)" style={{ gap: 4, padding: "4px 10px" }}>
        <span style={{ fontSize: 13 }}>⧉</span>
        <span style={{ fontSize: 11 }}>Duplicate</span>
      </button>

      <button className="toolbar-btn"
        onClick={handleDelete}
        disabled={!selectedElementId}
        title="Delete (Del)"
        style={{ gap: 4, padding: "4px 10px", color: selectedElementId ? "#ef4444" : undefined }}>
        <span style={{ fontSize: 13 }}>✕</span>
        <span style={{ fontSize: 11 }}>Delete</span>
      </button>

      <button className="toolbar-btn"
        onClick={handleUndo}
        disabled={snapshots.length === 0}
        title="Undo (Ctrl+Z)" style={{ gap: 4, padding: "4px 10px" }}>
        <span style={{ fontSize: 13 }}>↩</span>
        <span style={{ fontSize: 11 }}>Undo {snapshots.length > 0 ? `(${snapshots.length})` : ""}</span>
      </button>
    </div>
  );
}