"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Copy, Lock, Trash2, Unlock, Layers, ArrowUp, ArrowDown, LayoutGrid } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  isLocked?: boolean;
}

export function CustomContextMenu({ x, y, onClose, onAction, isLocked }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    const handleGlobalClick = () => onClose();
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const padding = 10;
      let nextX = x;
      let nextY = y;

      if (x + rect.width > window.innerWidth - padding) {
        nextX = window.innerWidth - rect.width - padding;
      }
      if (y + rect.height > window.innerHeight - padding) {
        nextY = window.innerHeight - rect.height - padding;
      }

      setPos({ x: nextX, y: nextY });
    }
  }, [x, y]);

  const menuItems = [
    { id: "duplicate", label: "Duplicate", icon: Copy, shortcut: "Ctrl+D" },
    { id: "lock", label: isLocked ? "Unlock" : "Lock", icon: isLocked ? Unlock : Lock },
    { id: "divider-frame", type: "divider" },
    { id: "group-frame", label: "Group into Smart Frame", icon: LayoutGrid },
    { id: "divider1", type: "divider" },
    { id: "forward", label: "Bring to Front", icon: ArrowUp },
    { id: "backward", label: "Send to Back", icon: ArrowDown },
    { id: "divider2", type: "divider" },
    { id: "delete", label: "Delete", icon: Trash2, danger: true, shortcut: "Del" },
  ];

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed z-[99999] min-w-[200px] overflow-hidden rounded-2xl border border-white/60 bg-white/45 p-1.5 shadow-2xl backdrop-blur-2xl"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-0.5">
        {menuItems.map((item) => {
          if (item.type === "divider") {
            return <div key={item.id} className="my-1 h-[1px] bg-[#8b7355]/10" />;
          }

          const Icon = item.icon!;
          return (
            <button
              key={item.id}
              onClick={() => {
                onAction(item.id);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                (item as any).danger 
                ? "text-rose-500 hover:bg-rose-500/10" 
                : "text-[#8b7355] hover:bg-[#D3A5B1]/10 hover:text-[#D3A5B1]"
              } transition-colors`}
            >
              <div className="flex items-center gap-3">
                <Icon size={15} />
                <span className="text-[13px] font-bold">{(item as any).label}</span>
              </div>
              {(item as any).shortcut && (
                <span className="text-[10px] font-medium opacity-40">{(item as any).shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>,
    document.body
  );
}
