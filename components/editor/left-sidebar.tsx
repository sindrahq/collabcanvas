"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";

const typeConfig: Record<string, { icon: string; color: string }> = {
  rectangle: { icon: "⬜", color: "#7c6cfc" },
  circle:    { icon: "⭕", color: "#4caf82" },
  text:      { icon: "T",  color: "#f59e0b" },
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
      <div className="panel-header">
        Layers
        <span style={{
          marginLeft: "auto",
          fontSize: 10,
          background: "var(--surface-3)",
          padding: "1px 6px",
          borderRadius: 10,
          color: "var(--text-muted)"
        }}>
          {ordered.length}
        </span>
      </div>

      <div className="panel-scroll">
        {ordered.length === 0 && (
          <div style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "var(--text-faint)",
            fontSize: 12,
            lineHeight: 1.6
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⬜</div>
            No layers yet.
            <br />Add a shape from the toolbar.
          </div>
        )}

        {ordered.map((el) => {
          const config = typeConfig[el.type] ?? { icon: "◻", color: "#888" };
          const isSelected = el.id === selectedElementId;

          return (
            <div
              key={el.id}
              className={`layer-item${isSelected ? " selected" : ""}`}
              onClick={() => selectElement(el.id)}
              style={{
                borderLeft: isSelected
                  ? `3px solid ${config.color}`
                  : "3px solid transparent",
                opacity: el.visible ? 1 : 0.4,
              }}
            >
              <span style={{
                fontSize: 13,
                width: 20,
                textAlign: "center",
                flexShrink: 0,
                color: config.color,
              }}>
                {config.icon}
              </span>

              <span className="layer-item-name" style={{
                fontSize: 12,
                color: isSelected ? "var(--text)" : "var(--text-muted)",
                fontWeight: isSelected ? 500 : 400,
              }}>
                {el.name}
              </span>

              <div className="layer-item-actions">
                <button
                  className="layer-action-btn"
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}
                  title={el.visible ? "Hide" : "Show"}
                  style={{ fontSize: 12 }}
                >
                  {el.visible ? "👁" : "🙈"}
                </button>
                <button
                  className="layer-action-btn"
                  onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
                  title={el.locked ? "Unlock" : "Lock"}
                  style={{ fontSize: 12 }}
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
          );
        })}
      </div>
    </aside>
  );
}