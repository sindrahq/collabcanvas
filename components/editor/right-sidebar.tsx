"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowRight, Bold,
  Circle, Italic, Lock, Minus, MousePointer2, Palette,
  RectangleHorizontal, RotateCw, Star, Triangle, Type,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

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

const FONTS = [
  "Inter", "Roboto", "Montserrat", "Oswald",
  "Playfair Display", "Dancing Script",
  "Arial", "Georgia", "Courier New", "Trebuchet MS",
];

const ALIGNMENTS = [
  { align: "left"   as const, icon: AlignLeft,   label: "Left" },
  { align: "center" as const, icon: AlignCenter, label: "Center" },
  { align: "right"  as const, icon: AlignRight,  label: "Right" },
];

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

function SliderRow({ label, value, min, max, step = 1, display, onChange }: {
  label: string; value: number; min: number; max: number;
  step?: number; display?: string; onChange: (v: number) => void;
}) {
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
  const elements           = useWorkspaceStore((s) => s.elements);
  const selectedElementId  = useWorkspaceStore((s) => s.selectedElementId);
  const updateElementStyle = useWorkspaceStore((s) => s.updateElementStyle);
  const updateElement      = useWorkspaceStore((s) => s.updateElement);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );

  const TypeIcon = selectedElement
    ? (TYPE_ICONS[selectedElement.type as keyof typeof TYPE_ICONS] ?? Palette)
    : MousePointer2;

  return (
    <motion.aside
      className="editor-panel inspector-panel"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="inspector-header">
        <Palette size={14} className="inspector-header-icon" />
        <span className="eyebrow" style={{ margin: 0 }}>Inspector</span>
      </div>

      <AnimatePresence mode="wait">
        {selectedElement ? (
          <motion.div
            key={selectedElement.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* Identity */}
            <div className="inspector-identity">
              <div className="inspector-type-badge">
                <TypeIcon size={13} />
                <span>{selectedElement.type}</span>
              </div>
              <input
                type="text" className="inspector-name-input"
                value={selectedElement.name}
                onChange={(e) => updateElement(selectedElement.id, { name: e.target.value, label: e.target.value })}
              />
            </div>

            {/* Layout */}
            <div className="inspector-section">
              <div className="inspector-section-title">
                <AlignLeft size={12} /><span>Layout</span>
              </div>
              <div className="inspector-grid-2">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <div key={field} className="inspector-num-field">
                    <label>{field === "width" ? "W" : field === "height" ? "H" : field.toUpperCase()}</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement[field])}
                      onChange={(e) => updateElement(selectedElement.id, { [field]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div className="inspector-section">
              <div className="inspector-section-title">
                <Palette size={12} /><span>Appearance</span>
              </div>
              <ColorRow
                label={selectedElement.type === "text" ? "Text Color" : "Fill"}
                value={selectedElement.style.fill}
                onChange={(v) => updateElementStyle(selectedElement.id, { fill: v })}
              />
              <ColorRow label="Stroke" value={selectedElement.style.stroke}
                onChange={(v) => updateElementStyle(selectedElement.id, { stroke: v })} />
              <SliderRow label="Stroke width" value={selectedElement.style.strokeWidth}
                min={0} max={20} display={`${selectedElement.style.strokeWidth}px`}
                onChange={(v) => updateElementStyle(selectedElement.id, { strokeWidth: v })} />
              <SliderRow label="Opacity" value={selectedElement.style.opacity}
                min={0} max={1} step={0.01}
                display={`${Math.round(selectedElement.style.opacity * 100)}%`}
                onChange={(v) => updateElementStyle(selectedElement.id, { opacity: v })} />

              {/* Rotation */}
              <div className="inspector-row" style={{ marginTop: 8 }}>
                <label className="inspector-label">
                  <RotateCw size={11} style={{ display: "inline", marginRight: 4 }} />
                  Rotation
                </label>
                <div className="inspector-num-field" style={{ width: 72 }}>
                  <input
                    type="number"
                    min={-360} max={360} step={1}
                    value={Math.round(selectedElement.rotation)}
                    onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                  />
                </div>
                <span className="inspector-value" style={{ marginLeft: 4 }}>°</span>
              </div>
            </div>

            {/* Shadow */}
            <div className="inspector-section">
              <div className="inspector-section-title">
                <Palette size={12} /><span>Shadow</span>
              </div>
              <div className="inspector-row" style={{ marginBottom: 8 }}>
                <label className="inspector-label">Enable</label>
                <button
                  type="button"
                  className={`inspector-toggle-btn${selectedElement.style.shadowEnabled ? " active" : ""}`}
                  onClick={() => updateElementStyle(selectedElement.id, { shadowEnabled: !selectedElement.style.shadowEnabled })}
                  title="Toggle shadow"
                >
                  {selectedElement.style.shadowEnabled ? "On" : "Off"}
                </button>
              </div>
              {selectedElement.style.shadowEnabled && (
                <>
                  <ColorRow label="Color" value={selectedElement.style.shadowColor}
                    onChange={(v) => updateElementStyle(selectedElement.id, { shadowColor: v })} />
                  <SliderRow label="Blur" value={selectedElement.style.shadowBlur}
                    min={0} max={60} display={`${selectedElement.style.shadowBlur}px`}
                    onChange={(v) => updateElementStyle(selectedElement.id, { shadowBlur: v })} />
                  <SliderRow label="Offset X" value={selectedElement.style.shadowOffsetX}
                    min={-40} max={40} display={`${selectedElement.style.shadowOffsetX}px`}
                    onChange={(v) => updateElementStyle(selectedElement.id, { shadowOffsetX: v })} />
                  <SliderRow label="Offset Y" value={selectedElement.style.shadowOffsetY}
                    min={-40} max={40} display={`${selectedElement.style.shadowOffsetY}px`}
                    onChange={(v) => updateElementStyle(selectedElement.id, { shadowOffsetY: v })} />
                </>
              )}
            </div>

            {/* Text section */}
            {selectedElement.type === "text" && (
              <div className="inspector-section">
                <div className="inspector-section-title">
                  <Type size={12} /><span>Text</span>
                </div>

                {/* Font family */}
                <div className="inspector-row inspector-row-col" style={{ marginBottom: 8 }}>
                  <label className="inspector-label">Font</label>
                  <select
                    className="inspector-select"
                    value={selectedElement.style.fontFamily}
                    onChange={(e) => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })}
                  >
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Bold / Italic */}
                <div className="inspector-row" style={{ marginBottom: 10 }}>
                  <label className="inspector-label">Style</label>
                  <div className="inspector-toggle-group">
                    <button
                      type="button"
                      className={`inspector-toggle-btn${selectedElement.style.fontWeight === "bold" ? " active" : ""}`}
                      onClick={() => updateElementStyle(selectedElement.id, {
                        fontWeight: selectedElement.style.fontWeight === "bold" ? "normal" : "bold",
                      })}
                      title="Bold"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      className={`inspector-toggle-btn${selectedElement.style.fontStyle === "italic" ? " active" : ""}`}
                      onClick={() => updateElementStyle(selectedElement.id, {
                        fontStyle: selectedElement.style.fontStyle === "italic" ? "normal" : "italic",
                      })}
                      title="Italic"
                    >
                      <Italic size={13} />
                    </button>
                  </div>
                </div>

                {/* Alignment */}
                <div className="inspector-row" style={{ marginBottom: 10 }}>
                  <label className="inspector-label">Align</label>
                  <div className="inspector-toggle-group">
                    {ALIGNMENTS.map(({ align, icon: Icon, label }) => (
                      <button
                        key={align}
                        type="button"
                        className={`inspector-toggle-btn${selectedElement.style.textAlign === align ? " active" : ""}`}
                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: align })}
                        title={label}
                      >
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                </div>

                <SliderRow label="Font size" value={selectedElement.style.fontSize}
                  min={8} max={72} display={`${selectedElement.style.fontSize}px`}
                  onChange={(v) => updateElementStyle(selectedElement.id, { fontSize: v })} />

                <div className="inspector-row inspector-row-col">
                  <label className="inspector-label">Content</label>
                  <textarea
                    className="inspector-textarea"
                    value={selectedElement.text ?? ""}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                    rows={3}
                  />
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
          <motion.div
            key="empty" className="inspector-empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <MousePointer2 size={28} className="inspector-empty-icon" />
            <p>Select an element on the canvas to inspect and edit its properties.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
