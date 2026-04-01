"use client";

import { motion } from "framer-motion";
import { Circle, Copy, RectangleHorizontal, Trash2, Type } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

const addButtons = [
  { label: "Rectangle", action: "rectangle" as const, icon: RectangleHorizontal },
  { label: "Circle", action: "circle" as const, icon: Circle },
  { label: "Text", action: "text" as const, icon: Type }
];

export function Toolbar() {
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const addElement = useWorkspaceStore((state) => state.addElement);
  const duplicateSelectedElement = useWorkspaceStore((state) => state.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((state) => state.deleteSelectedElement);

  return (
    <motion.div
      className="toolbar"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="toolbar-group">
        <span className="toolbar-label">Add</span>
        {addButtons.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              type="button"
              className="toolbar-button"
              onClick={() => addElement(item.action)}
              title={`Add ${item.label}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * index, duration: 0.25 }}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <span className="toolbar-label">Edit</span>
        <motion.button
          type="button"
          className="toolbar-button"
          onClick={duplicateSelectedElement}
          disabled={!selectedElementId}
          title="Duplicate (Ctrl+D)"
          whileHover={selectedElementId ? { y: -2, scale: 1.02 } : undefined}
          whileTap={selectedElementId ? { scale: 0.97 } : undefined}
        >
          <Copy size={15} />
          <span>Duplicate</span>
        </motion.button>

        <motion.button
          type="button"
          className="toolbar-button toolbar-button-danger"
          onClick={deleteSelectedElement}
          disabled={!selectedElementId}
          title="Delete (Del)"
          whileHover={selectedElementId ? { y: -2, scale: 1.02 } : undefined}
          whileTap={selectedElementId ? { scale: 0.97 } : undefined}
        >
          <Trash2 size={15} />
          <span>Delete</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
