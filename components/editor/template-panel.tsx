"use client";

import React, { useEffect, useState } from "react";
import { Layout, Plus, Trash2, Search } from "lucide-react";
import { templateService } from "@/lib/services/templateService";
import { LayoutTemplate } from "@/types/template";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { motion, AnimatePresence } from "framer-motion";

export function TemplatePanel() {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [search, setSearch] = useState("");
  const addElement = useWorkspaceStore((state) => state.addElement);
  const elements = useWorkspaceStore((state) => state.elements);

  const loadTemplates = async () => {
    const data = await templateService.getAll();
    setTemplates(data);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleUseTemplate = (template: LayoutTemplate) => {
    // Add each element from the template to the workspace
    // We need to offset them so they don't overlap exactly
    const offset = 50;
    
    // Map of old IDs to new IDs to maintain parent-child relationships
    const idMap: Record<string, string> = {};
    
    template.elements.forEach(el => {
      const newId = `${el.type}-${Math.random().toString(36).substring(2, 9)}`;
      idMap[el.id] = newId;
    });

    template.elements.forEach((el) => {
      const { id, ...rest } = el;
      useWorkspaceStore.getState().addElement(el.type, {
        ...rest,
        id: idMap[el.id],
        x: el.x + offset,
        y: el.y + offset,
        parentId: el.parentId ? idMap[el.parentId] : undefined,
      });
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await templateService.delete(id);
    loadTemplates();
  };

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#8b7355] uppercase tracking-wider">Saved Blocks</h3>
        <button onClick={loadTemplates} className="text-[10px] text-[#D3A5B1] hover:underline">Refresh</button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 text-[#8b7355]/40" size={14} />
        <input 
          type="text" 
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#8b7355]/10 bg-white/40 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#D3A5B1]/30"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {filtered.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleUseTemplate(template)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#8b7355]/10 bg-white/60 p-3 shadow-sm transition-all hover:border-[#D3A5B1]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D3A5B1]/10 text-[#D3A5B1]">
                      <Layout size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#8b7355]">{template.name}</p>
                      <p className="text-[10px] text-[#8b7355]/50">{template.elements.length} elements</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(template.id, e)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-rose-400 hover:text-rose-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-xs text-[#8b7355]/40">No blocks found</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#D3A5B1]/5 p-3 text-[10px] text-[#8b7355]/60 italic">
        Tip: Right-click any element on the canvas and select "Save as Template" to create a reusable block.
      </div>
    </div>
  );
}
