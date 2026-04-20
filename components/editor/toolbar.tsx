"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowRight,
  Baseline, Bold, Circle, Copy, Eraser,
  Italic, Minus, Pencil, Redo2, RectangleHorizontal, Sparkles,
  Star, Trash2, Triangle, Type, Undo2, Image as ImageIcon
} from "lucide-react";
import { type CanvasElementStyle, useWorkspaceStore } from "@/store/workspaceStore";
import { FramePicker } from "@/components/editor/frame-picker";
import { GlassTooltip } from "@/components/ui/glass-tooltip";
import React, { useRef, useState } from "react";


function UploadPictureButton() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addElement = useWorkspaceStore((s) => s.addElement);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      // Debug: log the uploaded image URL
      console.log("Uploaded image URL:", data.url);
      // Add image element to canvas
      addElement("image", { imageUrl: data.url });
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "inline-block", marginLeft: 8 }}>
      <input
        type="file"
        accept="image/png, image/jpeg"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={uploading}
      />
      <GlassTooltip content="Upload Picture">
        <button
          type="button"
          className="toolbar-icon-btn toolbar-shape-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ position: "relative" }}
        >
          <ImageIcon size={15} />
        </button>
      </GlassTooltip>
      {uploadError && <div style={{ color: "#c00", fontSize: 11 }}>{uploadError}</div>}
    </div>
  );
}

const FONTS = [
  "Inter", "Roboto", "Montserrat", "Oswald",
  "Playfair Display", "Dancing Script",
  "Arial", "Georgia", "Courier New", "Trebuchet MS",
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

const ADD_BUTTONS = [
  { label: "Rectangle", action: "rectangle" as const, icon: RectangleHorizontal },
  { label: "Circle",    action: "circle"    as const, icon: Circle },
  { label: "Triangle",  action: "triangle"  as const, icon: Triangle },
  { label: "Star",      action: "star"      as const, icon: Star },
  { label: "Arrow",     action: "arrow"     as const, icon: ArrowRight },
  { label: "Line",      action: "line"      as const, icon: Minus },
  { label: "Text",      action: "text"      as const, icon: Type },
];

const ALIGNMENTS = [
  { align: "left"   as const, icon: AlignLeft },
  { align: "center" as const, icon: AlignCenter },
  { align: "right"  as const, icon: AlignRight },
];

export function Toolbar({
  workspaceName,
  layout = "horizontal",
  showHistoryActions = true,
  showAddActions = true,
  showSelectionActions = true,
}: {
  workspaceName: string;
  layout?: "horizontal" | "vertical";
  showHistoryActions?: boolean;
  showAddActions?: boolean;
  showSelectionActions?: boolean;
}) {
  const selectedElementId        = useWorkspaceStore((s) => s.selectedElementId);
  const elements                 = useWorkspaceStore((s) => s.elements);
  const canEdit                  = useWorkspaceStore((s) => s.canEdit);
  const addElement               = useWorkspaceStore((s) => s.addElement);
  const duplicateSelectedElement = useWorkspaceStore((s) => s.duplicateSelectedElement);
  const deleteSelectedElement    = useWorkspaceStore((s) => s.deleteSelectedElement);
  const updateElementStyle       = useWorkspaceStore((s) => s.updateElementStyle);
  const undo                     = useWorkspaceStore((s) => s.undo);
  const redo                     = useWorkspaceStore((s) => s.redo);
  const historyIndex             = useWorkspaceStore((s) => s.historyIndex);
  const history                  = useWorkspaceStore((s) => s.history);
  const activeTool               = useWorkspaceStore((s) => s.activeTool);
  const setActiveTool            = useWorkspaceStore((s) => s.setActiveTool);
  const eraserSize               = useWorkspaceStore((s) => s.eraserSize);
  const setEraserSize            = useWorkspaceStore((s) => s.setEraserSize);

  const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null;
  const isText = selectedElement?.type === "text";
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const isVertical = layout === "vertical";

  function toggleStyle<K extends "fontWeight" | "fontStyle">(
    field: K,
    on: CanvasElementStyle[K],
    off: CanvasElementStyle[K]
  ) {
    if (!selectedElement) return;
    const current = selectedElement.style[field];
    updateElementStyle(selectedElement.id, { [field]: current === on ? off : on } as Partial<CanvasElementStyle>);
  }

  function slugify(value: string) {
    const trimmed = value.trim().toLowerCase();
    return trimmed.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "workspace";
  }

  function get3DStylePreset(type: "rectangle" | "text" | "image", currentStyle: CanvasElementStyle): Partial<CanvasElementStyle> {
    // 3D for text: bold, stroke, shadow
    if (type === "text") {
      return {
        fontWeight: "bold",
        stroke: currentStyle.stroke === "transparent" ? currentStyle.fill : currentStyle.stroke,
        strokeWidth: Math.max(1.4, currentStyle.strokeWidth || 0),
        shadowEnabled: true,
        shadowColor: "rgba(10, 16, 28, 0.72)",
        shadowBlur: 20,
        shadowOffsetX: 7,
        shadowOffsetY: 10
      };
    }
    // 3D for images: shadow only
    if (type === "image") {
      return {
        shadowEnabled: true,
        shadowColor: "rgba(8, 14, 26, 0.68)",
        shadowBlur: 28,
        shadowOffsetX: 13,
        shadowOffsetY: 16
      };
    }
    // 3D for shapes
    return {
      strokeWidth: Math.max(3.8, currentStyle.strokeWidth || 0),
      shadowEnabled: true,
      shadowColor: "rgba(8, 14, 26, 0.68)",
      shadowBlur: 28,
      shadowOffsetX: 13,
      shadowOffsetY: 16
    };
  }

  function apply3DToSelected() {
    if (!selectedElement) return;
    let type: "rectangle" | "text" | "image" = "rectangle";
    if (selectedElement.type === "text") type = "text";
    else if (selectedElement.type === "image") type = "image";
    updateElementStyle(selectedElement.id, get3DStylePreset(type, selectedElement.style));
  }

  function remove3DFromSelected() {
    if (!selectedElement) return;
    const reset: Partial<CanvasElementStyle> = {
      shadowEnabled: false,
      shadowBlur: 16,
      shadowColor: "rgba(20,32,28,0.3)",
      shadowOffsetX: 0,
      shadowOffsetY: 6,
    };
    if (selectedElement.type === "text") {
      reset.stroke = "transparent";
      reset.strokeWidth = 0;
      reset.fontWeight = "normal";
    }
    updateElementStyle(selectedElement.id, reset);
  }

  const fileBase = slugify(workspaceName);

  return (
    <motion.div
      className={`toolbar${isVertical ? " toolbar-vertical" : ""}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >


      {/* Add section with requested order and layout */}
      {showAddActions ? (
        <div className="toolbar-group toolbar-group-add glass-panel-deep" style={{ minWidth: 200, padding: '16px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.35)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
          <span className="toolbar-label" style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8b7355', marginBottom: 4 }}>Add</span>
          <div className="toolbar-divider" style={{ margin: '10px 0', opacity: 0.1, backgroundColor: '#8b7355' }} />

          {/* Shapes subheading and grid */}
          <span className="toolbar-subheading" style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#636E72', marginBottom: 6, display: 'block' }}>Shapes</span>
          <div className="toolbar-shapes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '8px 0 16px 0' }}>
            {ADD_BUTTONS.filter(b => b.action !== 'text').map((item, i) => {
              const Icon = item.icon;
              return (
                <GlassTooltip key={item.label} content={`Add ${item.label}`}>
                  <motion.button
                    type="button" className="toolbar-icon-btn"
                    style={{ 
                      backgroundColor: 'rgba(211, 165, 177, 0.15)', 
                      color: '#8b7355', 
                      border: '1px solid rgba(211, 165, 177, 0.2)',
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px'
                    }}
                    onClick={() => addElement(item.action)}
                    disabled={!canEdit}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(211, 165, 177, 0.25)', border: '1px solid rgba(211, 165, 177, 0.4)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon size={18} />
                  </motion.button>
                </GlassTooltip>
              );
            })}
          </div>
          <div className="toolbar-divider" style={{ margin: '12px 0', opacity: 0.06, backgroundColor: '#8b7355' }} />

          {/* Text subheading and icon */}
          <span className="toolbar-subheading" style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#636E72', marginBottom: 6, display: 'block' }}>Text</span>
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 16px 0' }}>
            <motion.button
              type="button"
              className="toolbar-icon-btn"
              style={{ 
                backgroundColor: 'rgba(211, 165, 177, 0.15)', 
                color: '#8b7355', 
                border: '1px solid rgba(211, 165, 177, 0.2)',
                width: '38px',
                height: '38px',
                borderRadius: '12px'
              }}
              onClick={() => addElement('text')}
              disabled={!canEdit}
              title="Add Text"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(211, 165, 177, 0.25)', border: '1px solid rgba(211, 165, 177, 0.4)' }}
              whileTap={{ scale: 0.9 }}
            >
              <Type size={18} />
            </motion.button>
          </div>
          <div className="toolbar-divider" style={{ margin: '12px 0', opacity: 0.06, backgroundColor: '#8b7355' }} />

          {/* Upload subheading and icon */}
          <span className="toolbar-subheading" style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#636E72', marginBottom: 6, display: 'block' }}>Upload</span>
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 16px 0' }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <UploadPictureButton />
            </motion.div>
          </div>
          <div className="toolbar-divider" style={{ margin: '12px 0', opacity: 0.06, backgroundColor: '#8b7355' }} />

          {/* Draw subheading and pencil tool toggle */}
          <span className="toolbar-subheading" style={{ fontWeight: 500, fontSize: 12, marginBottom: 2 }}>Draw</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 10px 0' }}>
            <motion.button
              type="button"
              className={`toolbar-icon-btn toolbar-shape-btn${activeTool === "pencil" ? " active" : ""}`}
              onClick={() => setActiveTool(activeTool === "pencil" ? "select" : "pencil")}
              disabled={!canEdit}
              title={activeTool === "pencil" ? "Pencil (active — click to deactivate)" : "Pencil tool"}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <Pencil size={16} />
            </motion.button>
            <motion.button
              type="button"
              className={`toolbar-icon-btn toolbar-shape-btn${activeTool === "eraser" ? " active" : ""}`}
              onClick={() => setActiveTool(activeTool === "eraser" ? "select" : "eraser")}
              disabled={!canEdit}
              title={activeTool === "eraser" ? "Eraser (active — click to deactivate)" : "Eraser tool"}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <Eraser size={16} />
            </motion.button>
          </div>
          {activeTool === "eraser" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '0 0 10px 0' }}>
              <span style={{ fontSize: 11, color: '#888' }}>Size: {eraserSize}px</span>
              <input
                type="range"
                min={4}
                max={60}
                step={1}
                value={eraserSize}
                onChange={(e) => setEraserSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#4f8cff' }}
                title="Eraser size"
              />
            </div>
          )}
          <div className="toolbar-divider" style={{ margin: '8px 0' }} />

          {/* Frame subheading and picker */}
          <span className="toolbar-subheading" style={{ fontWeight: 500, fontSize: 12, marginBottom: 2 }}>Frame</span>
          <div style={{ margin: '6px 0 0 0' }}>
            <FramePicker />
          </div>
        </div>
      ) : null}

      {/* Text formatting context bar */}
      <AnimatePresence>
        {showSelectionActions && isText && selectedElement && (
          <motion.div
            className="toolbar-group"
            initial={{ opacity: 0, scaleX: 0.85 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.85 }}
            transition={{ duration: 0.18 }}
            style={{ transformOrigin: "left" }}
          >
            <div className="toolbar-divider" />

            <select
              className="toolbar-select"
              value={selectedElement.style.fontFamily}
              onChange={(e) => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })}
              disabled={!canEdit}
              title="Font Family"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <select
              className="toolbar-select toolbar-select-sm"
              value={selectedElement.style.fontSize}
              onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: Number(e.target.value) })}
              disabled={!canEdit}
              title="Font Size"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <GlassTooltip content="Bold">
              <button
                type="button"
                className={`toolbar-icon-btn${selectedElement.style.fontWeight === "bold" ? " active" : ""}`}
                onClick={() => toggleStyle("fontWeight", "bold", "normal")}
                disabled={!canEdit}
              >
                <Bold size={14} />
              </button>
            </GlassTooltip>

            <GlassTooltip content="Italic">
              <button
                type="button"
                className={`toolbar-icon-btn${selectedElement.style.fontStyle === "italic" ? " active" : ""}`}
                onClick={() => toggleStyle("fontStyle", "italic", "normal")}
                disabled={!canEdit}
              >
                <Italic size={14} />
              </button>
            </GlassTooltip>

            {/* Text color */}
            <div className="toolbar-color-field" title="Text Color">
              <Baseline size={13} />
              <input
                type="color"
                value={selectedElement.style.fill}
                onChange={(e) => updateElementStyle(selectedElement.id, { fill: e.target.value })}
                disabled={!canEdit}
                title="Text Color"
              />
            </div>

            <div className="toolbar-divider" />

            {ALIGNMENTS.map(({ align, icon: Icon }) => (
              <button
                key={align}
                type="button"
                className={`toolbar-icon-btn${selectedElement.style.textAlign === align ? " active" : ""}`}
                onClick={() => updateElementStyle(selectedElement.id, { textAlign: align })}
                disabled={!canEdit}
                title={`Align ${align}`}
              >
                <Icon size={14} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit actions + Opacity control */}
      <AnimatePresence>
        {showSelectionActions && selectedElementId ? (
          <motion.div
            className="toolbar-group"
            initial={{ opacity: 0, scaleX: 0.85 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.85 }}
            transition={{ duration: 0.18 }}
            style={{ transformOrigin: "left" }}
          >
            <div className="toolbar-divider" />
            <span className="toolbar-label">Edit</span>

            {/* Opacity slider for images, text, and shapes */}
            {selectedElement && (selectedElement.type === "image" || selectedElement.type === "text" || ["rectangle","circle","triangle","star","arrow","line"].includes(selectedElement.type)) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 12px 0 0" }}>
                <span style={{ fontSize: 13, color: "#444" }}>Opacity</span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={selectedElement.style.opacity}
                  onChange={e => updateElementStyle(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                  style={{ width: 80 }}
                  disabled={!canEdit}
                  title="Opacity"
                />
                <span style={{ fontSize: 12, color: "#666", minWidth: 28, textAlign: "right" }}>{Math.round(selectedElement.style.opacity * 100)}%</span>
              </div>
            )}

            <motion.button
              type="button" className="toolbar-button toolbar-button-compact"
              onClick={apply3DToSelected}
              disabled={!canEdit}
              title="Apply 3D to selected element"
              whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              <Sparkles size={14} />
              <span>3D</span>
            </motion.button>
            <motion.button
              type="button" className="toolbar-button toolbar-button-compact"
              onClick={remove3DFromSelected}
              disabled={!canEdit}
              title="Remove 3D from selected element"
              whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              <Type size={14} />
              <span>Reset</span>
            </motion.button>
            <motion.button
              type="button" className="toolbar-button toolbar-button-compact"
              onClick={duplicateSelectedElement} title="Duplicate (Ctrl+D)"
              disabled={!canEdit}
              whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </motion.button>
            <motion.button
              type="button" className="toolbar-button toolbar-button-danger toolbar-button-compact"
              onClick={deleteSelectedElement} title="Delete (Del)"
              disabled={!canEdit}
              whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
