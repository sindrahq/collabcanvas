"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";

const typeIcon: Record<string, string> = {
  rectangle: "▭",
  circle: "○",
  text: "T",
};

export function LeftSidebar() {
  const elements = useWorkspaceStore((s) => s.elements);
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const selectElement = useWorkspaceStore((s) => s.selectElement);
  const reorderElement = useWorkspaceStore((s) => s.reorderElement);
  const toggleVisibility = useWorkspaceStore((s) => s.toggleVisibility);
  const toggleLock = useWorkspaceStore((s) => s.toggleLock);

  const ordered = useMemo(
    () => [...elements].sort((a, b) => b.layerOrder - a.layerOrder),
    [elements]
  );

  return (
    <aside className="editor-panel">
      <div className="panel-header">Layers</div>
      <div className="panel-scroll">
        {ordered.length === 0 && (
          <p style={{ padding: "16px", color: "var(--text-faint)", fontSize: 12, textAlign: "center" }}>
            No layers yet. Add a shape from the toolbar.
          </p>
        )}
        {ordered.map((el) => (
          <div
            key={el.id}
            className={`layer-item${el.id === selectedElementId ? " selected" : ""}`}
            onClick={() => selectElement(el.id)}
          >
            <span className="layer-item-icon">{typeIcon[el.type] ?? "◻"}</span>
            <span className="layer-item-name">{el.name}</span>
            <div className="layer-item-actions">
              <button
                className="layer-action-btn"
                onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}
                title={el.visible ? "Hide" : "Show"}
              >
                {el.visible ? "◎" : "○"}
              </button>
              <button
                className="layer-action-btn"
                onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
                title={el.locked ? "Unlock" : "Lock"}
              >
                {el.locked ? "🔒" : "🔓"}
              </button>
              <button
                className="layer-action-btn"
                onClick={(e) => { e.stopPropagation(); reorderElement(el.id, "forward"); }}
                title="Move up"
              >↑</button>
              <button
                className="layer-action-btn"
                onClick={(e) => { e.stopPropagation(); reorderElement(el.id, "backward"); }}
                title="Move down"
              >↓</button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}