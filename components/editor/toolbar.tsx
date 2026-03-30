"use client";

import { motion } from "framer-motion";
import { getWorkspaceExport, useWorkspaceStore } from "@/store/workspaceStore";

function downloadWorkspaceExport() {
  const blob = new Blob([getWorkspaceExport()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "workspace-export.json";
  anchor.click();

  URL.revokeObjectURL(url);
}

const toolbarButtons = [
  { label: "Add Rectangle", action: "rectangle" as const, accent: false },
  { label: "Add Circle", action: "circle" as const, accent: false },
  { label: "Add Text", action: "text" as const, accent: false }
];

export function Toolbar() {
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const snapshotCount = useWorkspaceStore((state) => state.snapshots.length);
  const addElement = useWorkspaceStore((state) => state.addElement);
  const duplicateSelectedElement = useWorkspaceStore((state) => state.duplicateSelectedElement);
  const deleteSelectedElement = useWorkspaceStore((state) => state.deleteSelectedElement);
  const saveSnapshot = useWorkspaceStore((state) => state.saveSnapshot);

  return (
    <>
      <motion.div
        className="toolbar"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {toolbarButtons.map((item, index) => (
          <motion.button
            key={item.label}
            type="button"
            className="toolbar-button"
            onClick={() => addElement(item.action)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * index, duration: 0.25 }}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
          >
            {item.label}
          </motion.button>
        ))}

        <motion.button
          type="button"
          className="toolbar-button"
          onClick={duplicateSelectedElement}
          disabled={!selectedElementId}
          whileHover={selectedElementId ? { y: -2, scale: 1.01 } : undefined}
          whileTap={selectedElementId ? { scale: 0.985 } : undefined}
        >
          Duplicate Selected
        </motion.button>

        <motion.button
          type="button"
          className="toolbar-button"
          onClick={deleteSelectedElement}
          disabled={!selectedElementId}
          whileHover={selectedElementId ? { y: -2, scale: 1.01 } : undefined}
          whileTap={selectedElementId ? { scale: 0.985 } : undefined}
        >
          Delete Selected
        </motion.button>

        <motion.button
          type="button"
          className="toolbar-button"
          onClick={downloadWorkspaceExport}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
        >
          Export JSON
        </motion.button>

        <motion.button
          type="button"
          className="toolbar-button accent-button"
          onClick={saveSnapshot}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
        >
          Save Snapshot
        </motion.button>
      </motion.div>

      <motion.p
        className="toolbar-copy"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.35 }}
      >
        Shared workspace state is active. Selected element state, element list, and snapshots are
        now managed in Zustand. Snapshots saved: {snapshotCount}. Shortcuts: Ctrl/Cmd + D to
        duplicate, Delete or Backspace to remove the selected element.
      </motion.p>
    </>
  );
}
