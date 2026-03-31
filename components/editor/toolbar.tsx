"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";

const shapes = [
  { label: "Rect", icon: "▭", action: "rectangle" as const },
  { label: "Circle", icon: "○", action: "circle" as const },
  { label: "Text", icon: "T", action: "text" as const },
];

export function Toolbar() {
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const addElement = useWorkspaceStore((s) => s.addElement);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((s) => s.deleteSelectedElement);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
      {shapes.map((s) => (
        <button
          key={s.action}
          className="toolbar-btn"
          onClick={() => addElement(s.action)}
          title={`Add ${s.label}`}
        >
          <span className="toolbar-btn-icon">{s.icon}</span>
          {s.label}
        </button>
      ))}

      <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />

      <button
        className="toolbar-btn"
        onClick={duplicateSelectedElement}
        disabled={!selectedElementId}
        title="Duplicate (Ctrl+D)"
      >
        ⧉ Duplicate
      </button>

      <button
        className="toolbar-btn danger"
        onClick={deleteSelectedElement}
        disabled={!selectedElementId}
        title="Delete (Del)"
      >
        ✕ Delete
      </button>
    </div>
  );
}