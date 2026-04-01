"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import {
  ArrowDown, ArrowRight, ArrowUp, Circle, Eye, EyeOff,
  Layers, Lock, Minus, RectangleHorizontal, Star, Triangle, Type, Unlock
} from "lucide-react";
import { type CanvasElement, useWorkspaceStore } from "@/store/workspaceStore";

const TYPE_ICONS = {
  rectangle: RectangleHorizontal,
  rect: RectangleHorizontal,
  circle: Circle,
  text: Type,
  triangle: Triangle,
  star: Star,
  arrow: ArrowRight,
  line: Minus,
};

function LayerRow({ element, isSelected }: { element: CanvasElement; isSelected: boolean }) {
  const selectElement = useWorkspaceStore((state) => state.selectElement);
  const reorderElement = useWorkspaceStore((state) => state.reorderElement);
  const toggleVisibility = useWorkspaceStore((state) => state.toggleVisibility);
  const toggleLock = useWorkspaceStore((state) => state.toggleLock);
  const Icon = TYPE_ICONS[element.type] ?? RectangleHorizontal;

  return (
    <motion.article
      layout
      className={`layer-row${isSelected ? " selected" : ""}${!element.visible ? " layer-hidden" : ""}`}
      variants={{
        hidden: { opacity: 0, x: -12 },
        show:   { opacity: 1, x: 0 },
      }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
    >
      <button
        type="button"
        className="layer-row-main"
        onClick={() => selectElement(element.id)}
        title={element.name}
      >
        <Icon size={13} className="layer-type-icon" />
        <span className="layer-name">{element.name}</span>
      </button>

      <div className="layer-row-actions">
        <button type="button" className="layer-icon-btn"
          onClick={() => reorderElement(element.id, "forward")} title="Move up">
          <ArrowUp size={12} />
        </button>
        <button type="button" className="layer-icon-btn"
          onClick={() => reorderElement(element.id, "backward")} title="Move down">
          <ArrowDown size={12} />
        </button>
        <button type="button" className="layer-icon-btn"
          onClick={() => toggleVisibility(element.id)}
          title={element.visible ? "Hide" : "Show"}>
          {element.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button type="button"
          className={`layer-icon-btn${element.locked ? " active" : ""}`}
          onClick={() => toggleLock(element.id)}
          title={element.locked ? "Unlock" : "Lock"}>
          {element.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>
    </motion.article>
  );
}

export function LeftSidebar() {
  const elements = useWorkspaceStore((state) => state.elements);
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const orderedElements = useMemo(
    () => [...elements].sort((a, b) => b.layerOrder - a.layerOrder),
    [elements]
  );
  const visibleCount = orderedElements.filter((el) => el.visible).length;

  return (
    <motion.aside
      className="editor-panel layers-panel"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="layers-header">
        <Layers size={14} className="layers-header-icon" />
        <span className="eyebrow" style={{ margin: 0 }}>Layers</span>
        <span className="layers-count">{orderedElements.length}</span>
      </div>

      <div className="layers-meta">
        <span className="layers-stat">{visibleCount} visible</span>
        <span className="layers-stat">
          {orderedElements.filter((el) => el.locked).length} locked
        </span>
      </div>

      <motion.div
        className="layer-list"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {orderedElements.map((element) => (
            <LayerRow
              key={element.id}
              element={element}
              isSelected={element.id === selectedElementId}
            />
          ))}
        </AnimatePresence>
        {orderedElements.length === 0 && (
          <p className="layers-empty">No elements yet. Add shapes from the toolbar above.</p>
        )}
      </motion.div>
    </motion.aside>
  );
}
