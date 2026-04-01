"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { AlignLeft, Circle, Lock, MousePointer2, Palette, RectangleHorizontal, Type } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

const TYPE_ICONS = {
  rectangle: RectangleHorizontal, rect: RectangleHorizontal, circle: Circle, text: Type
};

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inspector-row">
      <label className="inspector-label">{label}</label>
      <div className="inspector-color-field">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="color-swatch" title={label} />
        <span className="inspector-mono">{value}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, display, onChange }:
  { label: string; value: number; min: number; max: number; step?: number; display?: string; onChange: (v: number) => void }) {
  return (
    <div className="inspector-row inspector-row-col">
      <div className="inspector-row-header">
        <label className="inspector-label">{label}</label>
        <span className="inspector-value">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="inspector-slider" />
    </div>
  );
}

export function RightSidebar() {
  const elements = useWorkspaceStore((state) => state.elements);
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const updateElementStyle = useWorkspaceStore((state) => state.updateElementStyle);
  const updateElement = useWorkspaceStore((state) => state.updateElement);
  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );
  const TypeIcon = selectedElement ? (TYPE_ICONS[selectedElement.type] ?? Palette) : MousePointer2;

  return (
    <motion.aside className="editor-panel inspector-panel"
      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
      <div className="inspector-header">
        <Palette size={14} className="inspector-header-icon" />
        <span className="eyebrow" style={{ margin: 0 }}>Inspector</span>
      </div>

      <AnimatePresence mode="wait">
        {selectedElement ? (
          <motion.div key={selectedElement.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <div className="inspector-identity">
              <div className="inspector-type-badge">
                <TypeIcon size={13} />
                <span>{selectedElement.type}</span>
              </div>
              <input type="text" className="inspector-name-input" value={selectedElement.name}
                onChange={(e) => updateElement(selectedElement.id, { name: e.target.value, label: e.target.value })} />
            </div>

            <div className="inspector-section">
              <div className="inspector-section-title"><AlignLeft size={12} /><span>Layout</span></div>
              <div className="inspector-grid-2">
                {(["x","y","width","height"] as const).map((field) => (
                  <div key={field} className="inspector-num-field">
                    <label>{field === "width" ? "W" : field === "height" ? "H" : field.toUpperCase()}</label>
                    <input type="number" value={Math.round(selectedElement[field])}
                      onChange={(e) => updateElement(selectedElement.id, { [field]: Number(e.target.value) })} />
                  </div>
                ))}
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section-title"><Palette size={12} /><span>Appearance</span></div>
              <ColorRow label="Fill" value={selectedElement.style.fill}
                onChange={(v) => updateElementStyle(selectedElement.id, { fill: v })} />
              <ColorRow label="Stroke" value={selectedElement.style.stroke}
                onChange={(v) => updateElementStyle(selectedElement.id, { stroke: v })} />
              <SliderRow label="Stroke width" value={selectedElement.style.strokeWidth}
                min={0} max={20} display={`${selectedElement.style.strokeWidth}px`}
                onChange={(v) => updateElementStyle(selectedElement.id, { strokeWidth: v })} />
              <SliderRow label="Opacity" value={selectedElement.style.opacity}
                min={0} max={1} step={0.01}
                display={`${Math.round(selectedElement.style.opacity * 100)}%`}
                onChange={(v) => updateElementStyle(selectedElement.id, { opacity: v })} />
            </div>

            {selectedElement.type === "text" && (
              <div className="inspector-section">
                <div className="inspector-section-title"><Type size={12} /><span>Text</span></div>
                <SliderRow label="Font size" value={selectedElement.style.fontSize}
                  min={8} max={72} display={`${selectedElement.style.fontSize}px`}
                  onChange={(v) => updateElementStyle(selectedElement.id, { fontSize: v })} />
                <div className="inspector-row inspector-row-col">
                  <label className="inspector-label">Content</label>
                  <textarea className="inspector-textarea" value={selectedElement.text ?? ""}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                    rows={3} />
                </div>
              </div>
            )}

            {selectedElement.locked && (
              <div className="inspector-lock-notice">
                <Lock size={12} />
                <span>Element is locked — unlock from layers to edit position</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="empty" className="inspector-empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MousePointer2 size={28} className="inspector-empty-icon" />
            <p>Select an element on the canvas to inspect and edit its properties.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
