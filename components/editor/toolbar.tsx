"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";

const shapes = [
  { label: "Rectangle", icon: "⬜", action: "rectangle" as const, color: "#7c6cfc" },
  { label: "Circle", icon: "⭕", action: "circle" as const, color: "#4caf82" },
  { label: "Text", icon: "T", action: "text" as const, color: "#f59e0b" },
];

export function Toolbar() {
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const addElement = useWorkspaceStore((s) => s.addElement);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);
  const saveSnapshot = useWorkspaceStore((s) => s.saveSnapshot);
  const restoreSnapshot = useWorkspaceStore((s) => s.restoreSnapshot);
  const snapshots = useWorkspaceStore((s) => s.snapshots);

  function handleAdd(type: "rectangle" | "circle" | "text") {
    saveSnapshot();
    addElement(type);
  }

  function handleDuplicate() {
    if (!selectedElementId) return;
    saveSnapshot();
    duplicateSelectedElement();
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
    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
      {shapes.map((s) => (
        <button
          key={s.action}
          className="toolbar-btn"
          onClick={() => handleAdd(s.action)}
          title={`Add ${s.label}`}
          style={{ gap: "6px" }}
        >
          <span style={{ fontSize: 14, color: s.color }}>{s.icon}</span>
          <span style={{ fontSize: 12 }}>{s.label}</span>
        </button>
      ))}

      <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 6px" }} />

      <button
        className="toolbar-btn"
        onClick={handleDuplicate}
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