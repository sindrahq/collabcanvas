"use client";

import { useMemo, useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function RightSidebar() {
  const elements = useWorkspaceStore((s) => s.elements);
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const updateElement = useWorkspaceStore((s) => s.updateElement);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );

  return (
    <aside className="editor-panel editor-panel-right">
      <div className="panel-header">Inspector</div>

      {!selectedElement ? (
        <div className="inspector-empty">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          Select an element to inspect its properties.
        </div>
      ) : (
        <>
          {/* Element Info */}
          <div className="inspector-section">
            <div className="inspector-section-title">Element</div>
            <div className="inspector-row">
              <span className="inspector-label">Name</span>
              <span className="inspector-value">{selectedElement.name}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">Type</span>
              <span className="inspector-value" style={{ textTransform: "capitalize" }}>
                {selectedElement.type}
              </span>
            </div>
          </div>

          {/* Position & Size */}
          <div className="inspector-section">
            <div className="inspector-section-title">Position & Size</div>
            <div className="inspector-row">
              <span className="inspector-label">X</span>
              <span className="inspector-value">{Math.round(selectedElement.x)}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">Y</span>
              <span className="inspector-value">{Math.round(selectedElement.y)}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">W</span>
              <span className="inspector-value">{Math.round(selectedElement.width)}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">H</span>
              <span className="inspector-value">{Math.round(selectedElement.height)}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">Layer</span>
              <span className="inspector-value">{selectedElement.layerOrder + 1}</span>
            </div>
          </div>

          {/* Fill Color */}
          <div className="inspector-section">
            <div className="inspector-section-title">Fill</div>
            <div className="inspector-row">
              <span className="inspector-label">Color</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: selectedElement.style.fill,
                    border: "2px solid var(--border-hover)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  title="Click to change color"
                />
                <span className="inspector-value" style={{ fontSize: 11 }}>
                  {selectedElement.style.fill}
                </span>
              </div>
            </div>

            {showColorPicker && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="color"
                  value={selectedElement.style.fill}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, fill: e.target.value }
                    })
                  }
                  style={{
                    width: "100%",
                    height: 36,
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "none",
                  }}
                />

                {/* Quick color palette */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {["#7c6cfc","#4caf82","#f59e0b","#e05555","#3b82f6","#ec4899","#ffffff","#1a1a1a"].map((color) => (
                    <div
                      key={color}
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          style: { ...selectedElement.style, fill: color }
                        })
                      }
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: color,
                        border: selectedElement.style.fill === color
                          ? "2px solid white"
                          : "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opacity */}
          <div className="inspector-section">
            <div className="inspector-section-title">Opacity</div>
            <div className="inspector-row">
              <span className="inspector-label">{Math.round(selectedElement.style.opacity * 100)}%</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedElement.style.opacity}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, opacity: parseFloat(e.target.value) }
                  })
                }
                style={{ flex: 1, accentColor: "var(--accent)" }}
              />
            </div>
          </div>

          {/* State */}
          <div className="inspector-section">
            <div className="inspector-section-title">State</div>
            <div className="inspector-row">
              <span className="inspector-label">Visibility</span>
              <span className={`inspector-badge ${selectedElement.visible ? "visible" : "hidden"}`}>
                {selectedElement.visible ? "👁 Visible" : "🙈 Hidden"}
              </span>
            </div>
            <div className="inspector-row">
              <span className="inspector-label">Lock</span>
              <span className={`inspector-badge ${selectedElement.locked ? "locked" : "visible"}`}>
                {selectedElement.locked ? "🔒 Locked" : "🔓 Unlocked"}
              </span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}