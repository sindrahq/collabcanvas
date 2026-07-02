"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, X, Search, LoaderCircle } from "lucide-react";
import type { CanvasTemplate } from "@/types/integration";
import { builtInTemplates, templateCategories, type TemplateCategory, type BuiltInTemplate } from "@/lib/templates/builtInTemplates";
import TemplatePreview from "./TemplatePreview";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: CanvasTemplate) => void;
  templates: CanvasTemplate[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSaveCurrent: () => void;
}

type UnifiedTemplate = (CanvasTemplate & { isUser: true }) | (BuiltInTemplate & { isUser: false });

export default function TemplatePicker({
  open,
  onClose,
  onSelect,
  templates,
  loading,
  error,
  onRefresh,
  onSaveCurrent,
}: TemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const [search, setSearch] = useState("");

  const userTemplates = templates;

  const allTemplates = React.useMemo<UnifiedTemplate[]>(() => {
    const userOnes = userTemplates.map((t) => ({ ...t, isUser: true as const }));
    const builtInOnes = builtInTemplates.map((t) => ({ ...t, isUser: false as const }));
    return [...builtInOnes, ...userOnes];
  }, [userTemplates]);

  const filtered = React.useMemo(() => {
    let list = allTemplates;
    if (activeCategory !== "All") {
      list = list.filter((t) => t.isUser === false && t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [allTemplates, activeCategory, search]);

  if (!open) return null;

  return (
    <motion.div
      className="template-picker-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        background: "rgba(0,0,0,0.25)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="glass-panel-deep"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderRadius: "20px",
          padding: "24px",
          width: "min(900px, 92vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 80px rgba(0,0,0,0.15)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#8b7355]">Template Gallery</h2>
            <p className="text-xs text-[#8b7355]/60 mt-0.5">
              Choose a design and make it yours
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-[#D3A5B1]/10 transition-colors disabled:opacity-50"
              title="Refresh templates"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-[#8b7355]" : "text-[#8b7355]"} />
            </button>
            <button
              type="button"
              onClick={onSaveCurrent}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D3A5B1]/10 hover:bg-[#D3A5B1]/20 text-xs font-semibold text-[#8b7355] transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              Save current
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-rose-50 transition-colors"
              aria-label="Close template picker"
            >
              <X size={18} className="text-[#8b7355]" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-[#8b7355]/40" size={16} />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#8b7355]/10 bg-white/50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#D3A5B1]/40 focus:ring-2 focus:ring-[#D3A5B1]/10 transition-all"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {templateCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-[#8b7355] text-white shadow-sm"
                  : "bg-white/60 text-[#8b7355] hover:bg-[#D3A5B1]/10 border border-[#8b7355]/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle size={24} className="animate-spin text-[#D3A5B1]" />
              <span className="ml-2 text-sm text-[#8b7355]/60">Loading...</span>
            </div>
          )}
          {error && (
            <p className="py-6 text-center text-sm text-rose-500">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[#8b7355]/40">No templates found</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((template) => {
                const isBuiltIn = template.isUser === false;
                const color = isBuiltIn ? template.color : "#D3A5B1";
                return (
                  <motion.button
                    key={template.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelect(template);
                      onClose();
                    }}
                    className="group flex flex-col items-start rounded-2xl border border-[#8b7355]/8 bg-white/60 p-3 shadow-sm hover:shadow-md hover:border-[#D3A5B1]/30 transition-all text-left"
                  >
                    <div className="relative w-full mb-2.5 overflow-hidden rounded-xl bg-white/80">
                      <TemplatePreview
                        elements={template.elements}
                        width={220}
                        height={isBuiltIn
                          ? 220 / (template.aspectRatio || 1)
                          : 140}
                        className="w-full"
                      />
                      {isBuiltIn && (
                        <span
                          className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white/90 uppercase tracking-wider"
                          style={{ backgroundColor: color + "cc" }}
                        >
                          Built-in
                        </span>
                      )}
                    </div>
                    <div className="px-0.5">
                      <p className="text-xs font-bold text-[#8b7355] group-hover:text-[#6a5a3f] transition-colors">
                        {template.name}
                      </p>
                      <p className="text-[10px] text-[#8b7355]/50 mt-0.5">
                        {template.elements.length} elements
                        {isBuiltIn && (
                          <span className="ml-1.5">
                            · {template.category}
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
