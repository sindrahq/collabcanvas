"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function RightSidebar() {
  const elements = useWorkspaceStore((s) => s.elements);
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );

  return (
    <aside className="editor-panel editor-panel-right">
      <div className="panel-header">Inspector</div>

      {!selectedElement ? (
        <p className="inspector-empty">
          Select an element on the canvas to inspect its properties.
        </p>
      ) : (
        <>
          <div className="inspector-section">
            <div className="inspector-section-title">Element</div>
            <div className="inspector-row">
              <span className="inspector-label">Name</span>
              <span className="inspector-value">{selectedElement.name}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">Type</span>
              <span className="inspector-value">{selectedElement.type}</span>
            </div>
          </div>

          <div className="inspector-section">
            <div className="inspector-section-title">Position & Size</div>
            <div className="inspector-row">
              <span className="inspector-label">X / Y</span>
              <span className="inspector-value">{selectedElement.x} / {selectedElement.y}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">W / H</span>
              <span className="inspector-value">{selectedElement.width} / {selectedElement.height}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">Layer</span>
              <span className="inspector-value">{selectedElement.layerOrder + 1}</span>
            </div>
          </div>

          <div className="inspector-section">
            <div className="inspector-section-title">State</div>
            <div className="inspector-row">
              <span className="inspector-label">Visibility</span>
              <span className={`inspector-badge ${selectedElement.visible ? "visible" : "hidden"}`}>
                {selectedElement.visible ? "Visible" : "Hidden"}
              </span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">Lock</span>
              <span className={`inspector-badge ${selectedElement.locked ? "locked" : "visible"}`}>
                {selectedElement.locked ? "Locked" : "Unlocked"}
              </span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}