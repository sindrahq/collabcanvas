"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function RightSidebar() {
  const elements = useWorkspaceStore((state) => state.elements);
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );
  const snapshots = useWorkspaceStore((state) => state.snapshots);
  const restoreSnapshot = useWorkspaceStore((state) => state.restoreSnapshot);

  return (
    <motion.aside
      className="editor-panel"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <p className="eyebrow">Workspace State</p>
      <h2 className="panel-title">Selection + History</h2>

      {selectedElement ? (
        <motion.div
          className="selection-card"
          key={selectedElement.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <strong>{selectedElement.name}</strong>
          <span>
            {selectedElement.type} | {selectedElement.width} x {selectedElement.height}
          </span>
          <p>
            Position: {selectedElement.x}, {selectedElement.y}
          </p>
          <p>
            Visible: {selectedElement.visible ? "Yes" : "No"} | Locked:{" "}
            {selectedElement.locked ? "Yes" : "No"}
          </p>
        </motion.div>
      ) : (
        <p className="empty-state">
          No element selected yet. Click any workspace node or layer item to sync selection into
          the shared store.
        </p>
      )}

      <div className="snapshot-section">
        <p className="eyebrow">Manual Snapshots</p>
        {snapshots.length > 0 ? (
          <div className="snapshot-stack">
            {snapshots.map((snapshot) => (
              <motion.button
                key={snapshot.id}
                type="button"
                className="snapshot-card"
                onClick={() => restoreSnapshot(snapshot.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                <strong>{snapshot.label}</strong>
                <span>{snapshot.createdAt}</span>
                <span>{snapshot.elements.length} elements captured</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Save a snapshot from the toolbar to capture a restorable workspace state.
          </p>
        )}
      </div>

      <div className="snapshot-section">
        <p className="eyebrow">Editor Hints</p>
        <p className="toolbar-copy">
          Use the toolbar or keyboard shortcuts to create and manage elements. Drag on the canvas
          to reposition shapes and use the selection handles to resize them.
        </p>
      </div>

      {selectedElementId ? (
        <p className="toolbar-copy">Active selection id: {selectedElementId}</p>
      ) : null}
    </motion.aside>
  );
}
