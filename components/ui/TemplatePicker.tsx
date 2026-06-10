"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, X } from "lucide-react";
import type { CanvasTemplate } from "@/types/integration";

export default function TemplatePicker({
  open,
  onClose,
  onSelect,
  templates,
  loading,
  error,
  onRefresh,
  onSaveCurrent,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (template: CanvasTemplate) => void;
  templates: CanvasTemplate[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSaveCurrent: () => void;
}) {
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
            <div className="flex items-center gap-2">
              <button type="button" onClick={onRefresh} disabled={loading} className="p-1 disabled:opacity-50" title="Refresh templates">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none" }} aria-label="Close template picker">
                <X size={20} />
              </button>
            </div>
          </div>
          {loading && <p className="text-sm text-gray-500">Loading templates...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={onSaveCurrent}
            disabled={loading}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D3A5B1]/30 bg-[#D3A5B1]/10 px-3 py-2 text-sm font-semibold text-[#8b7355] disabled:opacity-50"
          >
            <Plus size={15} />
            Save current canvas
          </button>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {templates.map((t) => (
              <li key={t.id} style={{ marginBottom: "8px" }}>
                <button
                  onClick={() => {
                    onSelect(t);
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
                  <span className="ml-2 text-[10px] opacity-60">{t.elements.length} elements</span>
                </button>
              </li>
            ))}
          </ul>
          {!loading && !error && templates.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">No saved templates yet.</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
