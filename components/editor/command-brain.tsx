"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Square, Circle, Type, Image, Minus, ArrowRight,
  Star, Triangle, Undo2, Redo2, Download, Share2, Layers,
  SlidersHorizontal, MessageSquare, LayoutGrid, Copy, Trash2,
  ZoomIn, ZoomOut, BarChart2, Bookmark, Activity,
} from "lucide-react";

const STORAGE_KEY = "cc_command_usage";

export interface BrainCommand {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

function getUsage(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

function bumpUsage(id: string) {
  const u = getUsage();
  u[id] = (u[id] ?? 0) + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

interface CommandBrainProps {
  open: boolean;
  onClose: () => void;
  commands: BrainCommand[];
}

export function CommandBrain({ open, onClose, commands }: CommandBrainProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const usage = getUsage();

  const filtered = commands
    .filter((c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      if (query) return 0;
      return (usage[b.id] ?? 0) - (usage[a.id] ?? 0);
    });

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const run = (cmd: BrainCommand) => {
    bumpUsage(cmd.id);
    cmd.action();
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    }
    if (e.key === "Enter" && filtered[selected]) {
      run(filtered[selected]);
    }
    if (e.key === "Escape") onClose();
  };

  // Group commands by category for display
  const groups: Record<string, BrainCommand[]> = {};
  for (const cmd of filtered) {
    if (!groups[cmd.category]) groups[cmd.category] = [];
    groups[cmd.category].push(cmd);
  }

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="command-brain-overlay" onClick={onClose}>
          <motion.div
            className="command-brain-modal"
            initial={{ opacity: 0, scale: 0.94, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="command-brain-search-row">
              <Search size={15} className="command-brain-search-icon" />
              <input
                ref={inputRef}
                className="command-brain-input"
                placeholder="Search commands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button type="button" className="command-brain-clear" onClick={() => setQuery("")}>×</button>
              )}
              <kbd className="command-brain-esc-key">ESC</kbd>
            </div>

            <div className="command-brain-list" ref={listRef}>
              {filtered.length === 0 ? (
                <div className="command-brain-empty">No commands match &quot;{query}&quot;</div>
              ) : (
                Object.entries(groups).map(([category, cmds]) => (
                  <div key={category} className="command-brain-group">
                    <div className="command-brain-group-label">{category}</div>
                    {cmds.map((cmd) => {
                      const idx = flatIndex++;
                      const isSelected = idx === selected;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          className={`command-brain-item${isSelected ? " selected" : ""}`}
                          onClick={() => run(cmd)}
                          onMouseEnter={() => setSelected(idx)}
                        >
                          <span className="command-brain-item-icon">{cmd.icon}</span>
                          <span className="command-brain-item-label">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="command-brain-shortcut">{cmd.shortcut}</kbd>
                          )}
                          {(usage[cmd.id] ?? 0) > 2 && (
                            <span className="command-brain-hot-dot" title="Frequently used" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="command-brain-footer">
              <span>↑↓ navigate</span>
              <span>↵ run</span>
              <span>ESC close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { Square, Circle, Type, Image, Minus, ArrowRight, Star, Triangle, Undo2, Redo2, Download, Share2, Layers, SlidersHorizontal, MessageSquare, LayoutGrid, Copy, Trash2, ZoomIn, ZoomOut, BarChart2, Bookmark, Activity };
