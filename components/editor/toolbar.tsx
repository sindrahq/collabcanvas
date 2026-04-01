"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowRight,
  Bold, Circle, Copy, Italic, Minus, Redo2,
  RectangleHorizontal, Star, Trash2, Triangle, Type, Undo2, Baseline,
} from "lucide-react";
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

export function Toolbar() {
  const selectedElementId        = useWorkspaceStore((s) => s.selectedElementId);
  const elements                 = useWorkspaceStore((s) => s.elements);
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

  function toggleStyle<K extends "fontWeight" | "fontStyle">(
    field: K,
    on: CanvasElementStyle[K],
    off: CanvasElementStyle[K]
  ) {
    if (!selectedElement) return;
    const current = selectedElement.style[field];
    updateElementStyle(selectedElement.id, { [field]: current === on ? off : on } as Partial<CanvasElementStyle>);
  }

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
              type="button" className="toolbar-button"
              onClick={() => addElement(item.action)}
              title={`Add ${item.label}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.2 }}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
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
              title="Bold"
            >
              <Bold size={14} />
            </button>

            <button
              type="button"
              className={`toolbar-icon-btn${selectedElement.style.fontStyle === "italic" ? " active" : ""}`}
              onClick={() => toggleStyle("fontStyle", "italic", "normal")}
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
                title={`Align ${align}`}
              >
                <Icon size={14} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit actions */}
      {selectedElementId && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <span className="toolbar-label">Edit</span>
            <motion.button
              type="button" className="toolbar-button"
              onClick={duplicateSelectedElement} title="Duplicate (Ctrl+D)"
              whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </motion.button>
            <motion.button
              type="button" className="toolbar-button toolbar-button-danger"
              onClick={deleteSelectedElement} title="Delete (Del)"
              whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}
