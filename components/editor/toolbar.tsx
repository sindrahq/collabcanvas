"use client";

import { useRef } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { CanvasElementType } from "@/store/workspaceStore";
import { useParticleBurst } from "@/components/editor/particle-burst";

const shapes = [
  { label: "Rect", icon: "⬜", action: "rectangle" as CanvasElementType, color: "#7c6cfc" },
  { label: "Circle", icon: "⭕", action: "circle" as CanvasElementType, color: "#4caf82" },
  { label: "Triangle", icon: "△", action: "triangle" as CanvasElementType, color: "#c4b5fd" },
  { label: "Star", icon: "★", action: "star" as CanvasElementType, color: "#f59e0b" },
  { label: "Arrow", icon: "→", action: "arrow" as CanvasElementType, color: "#0891b2" },
  { label: "Diamond", icon: "◇", action: "diamond" as CanvasElementType, color: "#e05555" },
  { label: "Text", icon: "T", action: "text" as CanvasElementType, color: "#fde68a" },
];

export function Toolbar() {
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const addElement = useWorkspaceStore((s) => s.addElement);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);
  const saveSnapshot = useWorkspaceStore((s) => s.saveSnapshot);
  const restoreSnapshot = useWorkspaceStore((s) => s.restoreSnapshot);
  const snapshots = useWorkspaceStore((s) => s.snapshots);
  const imageInputRef = useRef<HTMLInputElement>(null);
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

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = ev.target?.result as string;
      saveSnapshot();
      addElement("image");
      setTimeout(() => {
        const { elements, updateElement } = useWorkspaceStore.getState();
        const last = elements[elements.length - 1];
        if (last) updateElement(last.id, { imageUrl });
      }, 50);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap" }}>
      {shapes.map((s) => (
        <button
          key={s.action}
          className="toolbar-btn"
          onClick={(e) => handleAdd(s.action, e)}
          title={`Add ${s.label}`}
          style={{ gap: "6px" }}
        >
          <span style={{ fontSize: 14, color: s.color }}>{s.icon}</span>
          <span style={{ fontSize: 12 }}>{s.label}</span>
        </button>
      ))}

      {/* Image upload */}
      <button
        className="toolbar-btn"
        onClick={() => imageInputRef.current?.click()}
        title="Upload Image"
        style={{ gap: "6px" }}
      >
        <span style={{ fontSize: 14, color: "#a78bfa" }}>🖼</span>
        <span style={{ fontSize: 12 }}>Image</span>
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 6px" }} />

      <button
        className="toolbar-btn"
        onClick={(e) => handleDuplicate(e)}
        disabled={!selectedElementId}
        title="Duplicate (Ctrl+D)"
        style={{ gap: "6px" }}
      >
        <span style={{ fontSize: 14 }}>⧉</span>
        <span style={{ fontSize: 12 }}>Duplicate</span>
      </button>

      <button
        className="toolbar-btn"
        onClick={handleDelete}
        disabled={!selectedElementId}
        title="Delete (Del)"
        style={{ gap: "6px", color: selectedElementId ? "var(--danger)" : undefined }}
      >
        <span style={{ fontSize: 14 }}>✕</span>
        <span style={{ fontSize: 12 }}>Delete</span>
      </button>

      <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 6px" }} />

      <button
        className="toolbar-btn"
        onClick={handleUndo}
        disabled={snapshots.length === 0}
        title="Undo (Ctrl+Z)"
        style={{ gap: "6px" }}
      >
        <span style={{ fontSize: 14 }}>↩</span>
        <span style={{ fontSize: 12 }}>Undo {snapshots.length > 0 ? `(${snapshots.length})` : ""}</span>
      </button>
    </div>
  );
}