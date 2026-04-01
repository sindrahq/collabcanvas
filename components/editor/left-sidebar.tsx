"use client";

import { useMemo, useState, useRef } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { CanvasElementType } from "@/store/workspaceStore";

const typeConfig: Record<string, { icon: string; color: string }> = {
  rectangle: { icon: "⬜", color: "#2563eb" },
  circle:    { icon: "⭕", color: "#10b981" },
  text:      { icon: "T",  color: "#f59e0b" },
  triangle:  { icon: "△", color: "#7c3aed" },
  star:      { icon: "★", color: "#f59e0b" },
  arrow:     { icon: "→", color: "#0891b2" },
  diamond:   { icon: "◇", color: "#ef4444" },
  image:     { icon: "🖼", color: "#60a5fa" },
};

const editTools = [
  { label: "Magic Layers", icon: "✨", desc: "AI-powered layer management", badge: "New" },
  { label: "BG Remover", icon: "🎭", desc: "Remove image backgrounds instantly", badge: "AI" },
  { label: "BG Generator", icon: "🌅", desc: "Generate AI backgrounds", badge: "AI" },
];

const styleTools = [
  { label: "None", icon: "⬜" },
  { label: "Scrapbook", icon: "📖" },
  { label: "Etching", icon: "✏️" },
];

const filters = [
  { label: "None", icon: "⬜" },
  { label: "Fresco", icon: "🎨" },
  { label: "Belvedere", icon: "🌟" },
];

const effects = [
  { label: "Shadows", icon: "🌑" },
  { label: "Duotone", icon: "🎭" },
  { label: "Blur", icon: "💫" },
];

type TabType = "layers" | "edit";

export function LeftSidebar() {
  const elements = useWorkspaceStore((s) => s.elements);
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const selectElement = useWorkspaceStore((s) => s.selectElement);
  const reorderElement = useWorkspaceStore((s) => s.reorderElement);
  const toggleVisibility = useWorkspaceStore((s) => s.toggleVisibility);
  const toggleLock = useWorkspaceStore((s) => s.toggleLock);
  const addElement = useWorkspaceStore((s) => s.addElement);
  const [tab, setTab] = useState<TabType>("edit");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const ordered = useMemo(
    () => [...elements].sort((a, b) => b.layerOrder - a.layerOrder),
    [elements]
  );

  return (
    <aside style={{
      background: "rgba(5,5,15,0.95)",
      borderRight: "1px solid rgba(37,99,235,0.1)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(37,99,235,0.1)",
      }}>
        {(["edit", "layers"] as TabType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 0",
            fontSize: 12, fontWeight: 600,
            background: "none", border: "none", cursor: "pointer",
            color: tab === t ? "#60a5fa" : "rgba(255,255,255,0.3)",
            borderBottom: tab === t ? "2px solid #2563eb" : "2px solid transparent",
            transition: "all 150ms",
            textTransform: "capitalize",
          }}>{t === "edit" ? "Edit Image" : "Layers"}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}
        className="panel-scroll">

        {tab === "layers" ? (
          <>
            {/* Layer count */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px 10px",
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Layers
              </span>
              <span style={{
                fontSize: 10, background: "rgba(37,99,235,0.15)",
                padding: "1px 7px", borderRadius: 10, color: "#60a5fa",
              }}>{ordered.length}</span>
            </div>

            {ordered.length === 0 && (
              <div style={{
                padding: "32px 16px", textAlign: "center",
                color: "rgba(255,255,255,0.2)", fontSize: 12, lineHeight: 1.6,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⬜</div>
                No layers yet.
                <br />Add a shape from the toolbar.
              </div>
            )}

            {ordered.map((el) => {
              const config = typeConfig[el.type] ?? { icon: "◻", color: "#888" };
              const isSelected = el.id === selectedElementId;
              return (
                <div key={el.id}
                  className={`layer-item${isSelected ? " selected" : ""}`}
                  onClick={() => selectElement(el.id)}
                  style={{
                    borderLeft: isSelected ? `3px solid ${config.color}` : "3px solid transparent",
                    opacity: el.visible ? 1 : 0.4,
                  }}
                >
                  <span style={{ fontSize: 13, width: 20, textAlign: "center", flexShrink: 0, color: config.color }}>
                    {config.icon}
                  </span>
                  <span className="layer-item-name" style={{
                    fontSize: 12,
                    color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
                    fontWeight: isSelected ? 500 : 400,
                  }}>{el.name}</span>
                  <div className="layer-item-actions">
                    <button className="layer-action-btn"
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}
                      title={el.visible ? "Hide" : "Show"} style={{ fontSize: 12 }}>
                      {el.visible ? "👁" : "🙈"}
                    </button>
                    <button className="layer-action-btn"
                      onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
                      title={el.locked ? "Unlock" : "Lock"} style={{ fontSize: 12 }}>
                      {el.locked ? "🔒" : "🔓"}
                    </button>
                    <button className="layer-action-btn"
                      onClick={(e) => { e.stopPropagation(); reorderElement(el.id, "forward"); }}
                      title="Move up">↑</button>
                    <button className="layer-action-btn"
                      onClick={(e) => { e.stopPropagation(); reorderElement(el.id, "backward"); }}
                      title="Move down">↓</button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* Edit Image tools - Canva style */}

            {/* AI Tools */}
            <div style={{ marginBottom: 16 }}>
              {editTools.map((tool) => (
                <div key={tool.label} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px", borderRadius: 8, cursor: "pointer",
                  transition: "all 150ms", marginBottom: 4,
                  border: "1px solid transparent",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(37,99,235,0.08)";
                    e.currentTarget.style.borderColor = "rgba(37,99,235,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "rgba(37,99,235,0.12)",
                    border: "1px solid rgba(37,99,235,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>{tool.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{tool.label}</span>
                      {tool.badge && (
                        <span style={{
                          fontSize: 9, padding: "1px 5px", borderRadius: 4,
                          background: "rgba(37,99,235,0.3)", color: "#60a5fa",
                          fontWeight: 700, letterSpacing: "0.05em",
                        }}>{tool.badge}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Style Match */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8, padding: "0 2px",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Style Match
                </span>
                <span style={{ fontSize: 11, color: "#2563eb", cursor: "pointer" }}>See all</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {styleTools.map((s) => (
                  <div key={s.label} style={{
                    aspectRatio: "1", borderRadius: 8,
                    background: "rgba(37,99,235,0.06)",
                    border: "1px solid rgba(37,99,235,0.12)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4, cursor: "pointer", transition: "all 150ms",
                    fontSize: 20,
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.06)";
                    }}
                  >
                    <span>{s.icon}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8, padding: "0 2px",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Filters
                </span>
                <span style={{ fontSize: 11, color: "#2563eb", cursor: "pointer" }}>See all</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {filters.map((f) => (
                  <div key={f.label} style={{
                    aspectRatio: "1", borderRadius: 8,
                    background: "rgba(37,99,235,0.06)",
                    border: "1px solid rgba(37,99,235,0.12)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4, cursor: "pointer", transition: "all 150ms",
                    fontSize: 20,
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.06)";
                    }}
                  >
                    <span>{f.icon}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Effects */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8, padding: "0 2px",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Effects
                </span>
                <span style={{ fontSize: 11, color: "#2563eb", cursor: "pointer" }}>See all</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {effects.map((ef) => (
                  <div key={ef.label} style={{
                    aspectRatio: "1", borderRadius: 8,
                    background: "rgba(37,99,235,0.06)",
                    border: "1px solid rgba(37,99,235,0.12)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4, cursor: "pointer", transition: "all 150ms",
                    fontSize: 20,
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.06)";
                    }}
                  >
                    <span>{ef.icon}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{ef.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Apps */}
            <div style={{ marginBottom: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8, padding: "0 2px",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Apps
                </span>
                <span style={{ fontSize: 11, color: "#2563eb", cursor: "pointer" }}>See all</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {[
                  { label: "Vectorify", icon: "🔷" },
                  { label: "Texture", icon: "🌊" },
                  { label: "Frame Maker", icon: "🖼️" },
                ].map((app) => (
                  <div key={app.label} style={{
                    aspectRatio: "1", borderRadius: 8,
                    background: "rgba(37,99,235,0.06)",
                    border: "1px solid rgba(37,99,235,0.12)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4, cursor: "pointer", transition: "all 150ms",
                    fontSize: 20,
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)";
                      e.currentTarget.style.background = "rgba(37,99,235,0.06)";
                    }}
                  >
                    <span>{app.icon}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{app.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload image button */}
            <div style={{ padding: "8px 0" }}>
              <button
                onClick={() => imageInputRef.current?.click()}
                style={{
                  width: "100%", padding: "10px",
                  background: "rgba(37,99,235,0.1)",
                  border: "1px dashed rgba(37,99,235,0.3)",
                  borderRadius: 8, color: "#60a5fa",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 150ms", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(37,99,235,0.15)";
                  e.currentTarget.style.borderColor = "rgba(37,99,235,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(37,99,235,0.1)";
                  e.currentTarget.style.borderColor = "rgba(37,99,235,0.3)";
                }}
              >
                📤 Upload Image
              </button>
              <input
                ref={imageInputRef}
                type="file" accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const imageUrl = ev.target?.result as string;
                    addElement("image" as CanvasElementType);
                    setTimeout(() => {
                      const { elements, updateElement } = useWorkspaceStore.getState();
                      const last = elements[elements.length - 1];
                      if (last) updateElement(last.id, { imageUrl });
                    }, 50);
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}