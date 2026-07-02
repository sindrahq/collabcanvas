"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, Search, Bookmark, Sparkles } from "lucide-react";
import { templateService } from "@/lib/services/templateService";
import { LayoutTemplate } from "@/types/template";
import { useWorkspaceStoreFactory, type WorkspaceState, type CanvasElement } from "@/store/workspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import { builtInTemplates, templateCategories, type TemplateCategory, type BuiltInTemplate } from "@/lib/templates/builtInTemplates";
import TemplatePreview from "@/components/ui/TemplatePreview";

type UnifiedTemplate = (LayoutTemplate & { isUser: true }) | (BuiltInTemplate & { isUser: false });

export function TemplatePanel({ workspaceId }: { workspaceId: string }) {
  const [userTemplates, setUserTemplates] = useState<LayoutTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const store = useWorkspaceStoreFactory(workspaceId);
  const addElement = store((state: WorkspaceState) => state.addElement);

  const loadTemplates = useCallback(async () => {
    const data = await templateService.getAll();
    setUserTemplates(data);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadTemplates);
  }, [loadTemplates]);

  const handleUseTemplate = (template: { id: string; name: string; elements: CanvasElement[] }) => {
    const idMap = new Map(template.elements.map((element) => [element.id, crypto.randomUUID()]));
    template.elements.forEach((element) => {
      store.getState().addElement(element.type, {
        ...element,
        id: idMap.get(element.id),
        parentId: element.parentId ? idMap.get(element.parentId) : undefined,
        x: element.x + 40,
        y: element.y + 40,
        style: { ...element.style },
      });
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await templateService.delete(id);
    loadTemplates();
  };

  const allTemplates = useMemo<UnifiedTemplate[]>(() => {
    const userOnes = userTemplates.map((t) => ({ ...t, isUser: true as const }));
    const builtInOnes = builtInTemplates.map((t) => ({ ...t, isUser: false as const }));
    return [...builtInOnes, ...userOnes];
  }, [userTemplates]);

  const filtered = useMemo(() => {
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

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#8b7355] uppercase tracking-wider">
          Templates
        </h3>
        <button onClick={loadTemplates} className="text-[10px] text-[#D3A5B1] hover:underline">
          Refresh
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2.5 text-[#8b7355]/40" size={14} />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#8b7355]/10 bg-white/40 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#D3A5B1]/30 transition-all"
        />
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {templateCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-[#8b7355] text-white"
                : "bg-white/50 text-[#8b7355]/70 hover:bg-[#D3A5B1]/10 border border-[#8b7355]/8"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {filtered.map((template) => {
              const isBuiltIn = template.isUser === false;
              const color = isBuiltIn ? template.color : "#D3A5B1";

              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  onClick={() => handleUseTemplate(template)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-[#8b7355]/10 bg-white/60 shadow-sm transition-all hover:border-[#D3A5B1]/40 hover:shadow-md"
                >
                  <div className="relative w-full overflow-hidden rounded-t-2xl bg-white/50">
                    <TemplatePreview
                      elements={template.elements}
                      width={260}
                      height={isBuiltIn
                        ? 260 / (template.aspectRatio || 1)
                        : 160}
                      className="w-full"
                    />
                    {isBuiltIn && (
                      <span
                        className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/90 uppercase tracking-wider"
                        style={{ backgroundColor: color + "cc" }}
                      >
                        Built-in
                      </span>
                    )}
                    {!isBuiltIn && (
                      <button
                        onClick={(e) => handleDelete(template.id, e)}
                        className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 bg-white/80 backdrop-blur-sm rounded-lg p-1.5 text-rose-400 hover:text-rose-600 shadow-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: color + "20", color }}
                      >
                        {isBuiltIn ? <Sparkles size={14} /> : <Bookmark size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#8b7355] truncate">
                          {template.name}
                        </p>
                        <p className="text-[10px] text-[#8b7355]/50">
                          {template.elements.length} elements
                          {isBuiltIn && (
                            <span className="ml-1">· {template.category}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs text-[#8b7355]/40">No templates found</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-[#D3A5B1]/5 p-3 text-[10px] text-[#8b7355]/60 italic leading-relaxed">
        <span className="font-semibold not-italic">Tip:</span> Built-in templates are fully editable — click any text to change it, drag elements to move them, and use the inspector to customize colors, fonts, and sizes.
      </div>
    </div>
  );
}
