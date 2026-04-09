"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowRight,
  Baseline, Bold, ChevronDown, Circle, Copy, Download,
  Italic, Minus, Redo2, RectangleHorizontal, Sparkles,
  Star, Trash2, Triangle, Type, Undo2,
} from "lucide-react";
import { exportWorkspaceAsJpeg, exportWorkspaceAsPdf, exportWorkspaceAsPng } from "@/lib/workspaceExport";
import { type CanvasElementStyle, useWorkspaceStore } from "@/store/workspaceStore";

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

export function Toolbar({ workspaceName }: { workspaceName: string }) {
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

  const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null;
  const isText = selectedElement?.type === "text";
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

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

  function get3DStylePreset(type: "rectangle" | "text", currentStyle: CanvasElementStyle): Partial<CanvasElementStyle> {
    // Keep original colors; only add stronger depth treatment.
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
    const type = selectedElement.type === "text" ? "text" : "rectangle";
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
      className="toolbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Undo / Redo */}
      <div className="toolbar-group">
        <motion.button
          type="button" className="toolbar-icon-btn"
          onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
          whileHover={canUndo ? { scale: 1.08 } : undefined}
          whileTap={canUndo ? { scale: 0.94 } : undefined}
        >
          <Undo2 size={15} />
        </motion.button>
        <motion.button
          type="button" className="toolbar-icon-btn"
          onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
          whileHover={canRedo ? { scale: 1.08 } : undefined}
          whileTap={canRedo ? { scale: 0.94 } : undefined}
        >
          <Redo2 size={15} />
        </motion.button>
      </div>

      <div className="toolbar-divider" />

      {/* Add shapes */}
      <div className="toolbar-group">
        <span className="toolbar-label">Add</span>
        {ADD_BUTTONS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              type="button" className="toolbar-icon-btn toolbar-shape-btn"
              onClick={() => addElement(item.action)}
              disabled={!canEdit}
              title={`Add ${item.label}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.2 }}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <Icon size={14} />
            </motion.button>
          );
        })}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <span className="toolbar-label">Export</span>
        <div className="toolbar-menu" ref={exportMenuRef}>
          <motion.button
            type="button"
            className="toolbar-button toolbar-button-compact"
            onClick={() => setExportMenuOpen((open) => !open)}
            title="Export workspace"
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <Download size={14} />
            <span>Export</span>
            <ChevronDown size={13} className={exportMenuOpen ? "toolbar-menu-chevron open" : "toolbar-menu-chevron"} />
          </motion.button>

          <AnimatePresence>
            {exportMenuOpen ? (
              <motion.div
                className="toolbar-menu-list"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.16 }}
              >
                <button
                  type="button"
                  className="toolbar-menu-item"
                  onClick={() => {
                    setExportMenuOpen(false);
                    void exportWorkspaceAsPng(`${fileBase}.png`);
                  }}
                >
                  PNG
                </button>
                <button
                  type="button"
                  className="toolbar-menu-item"
                  onClick={() => {
                    setExportMenuOpen(false);
                    void exportWorkspaceAsJpeg(`${fileBase}.jpeg`);
                  }}
                >
                  JPEG
                </button>
                <button
                  type="button"
                  className="toolbar-menu-item"
                  onClick={() => {
                    setExportMenuOpen(false);
                    void exportWorkspaceAsPdf(`${fileBase}.pdf`);
                  }}
                >
                  PDF
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Text formatting context bar */}
      <AnimatePresence>
        {isText && selectedElement && (
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

            <button
              type="button"
              className={`toolbar-icon-btn${selectedElement.style.fontWeight === "bold" ? " active" : ""}`}
              onClick={() => toggleStyle("fontWeight", "bold", "normal")}
              disabled={!canEdit}
              title="Bold"
            >
              <Bold size={14} />
            </button>

            <button
              type="button"
              className={`toolbar-icon-btn${selectedElement.style.fontStyle === "italic" ? " active" : ""}`}
              onClick={() => toggleStyle("fontStyle", "italic", "normal")}
              disabled={!canEdit}
              title="Italic"
            >
              <Italic size={14} />
            </button>

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

      {/* Edit actions */}
      <AnimatePresence>
        {selectedElementId ? (
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
