"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassTooltip } from "@/components/ui/glass-tooltip";
import { X } from "lucide-react";

// Simple placeholder TemplatePicker modal
// In a full implementation this would fetch templates from an API and allow insertion
export default function TemplatePicker({
  open,
  onClose,
  workspaceId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId?: string;
  onSelect: (templateId: string) => void;
}) {
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);

  // Placeholder: load dummy templates
  useEffect(() => {
    if (open) {
      // Simulate fetch
      setTemplates([
        { id: "tpl-1", name: "Blank Canvas" },
        { id: "tpl-2", name: "Presentation" },
        { id: "tpl-3", name: "Storyboard" },
      ]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="template-picker-modal glass-panel-deep"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          className="modal-content"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "24px",
            minWidth: "320px",
            maxWidth: "90%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#333" }}>Template Picker</h2>
            <button onClick={onClose} style={{ background: "none", border: "none" }}>
              <X size={20} />
            </button>
          </div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {templates.map((t) => (
              <li key={t.id} style={{ marginBottom: "8px" }}>
                <button
                  onClick={() => {
                    onSelect(t.id);
                    onClose();
                  }}
                  className="toolbar-icon-btn"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "rgba(211,165,177,0.15)",
                    color: "#8b7355",
                    border: "1px solid rgba(211,165,177,0.2)",
                    borderRadius: "8px",
                  }}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
