"use client";

import { motion } from "framer-motion";
import { History, RotateCcw } from "lucide-react";
import type { WorkspaceHistorySnapshot } from "@/lib/history";

type HistoryPanelProps = {
  snapshots: WorkspaceHistorySnapshot[];
  onRestore: (snapshotId: string) => void;
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function HistoryPanel({ snapshots, onRestore }: HistoryPanelProps) {
  return (
    <motion.aside
      className="editor-panel history-panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="history-header">
        <History size={14} className="history-header-icon" />
        <span className="eyebrow" style={{ margin: 0 }}>Snapshots</span>
      </div>

      <div className="history-list">
        {snapshots.map((snapshot) => (
          <div key={snapshot.id} className="history-item">
            <div className="history-item-copy">
              <strong>{snapshot.label}</strong>
              <span>{formatWhen(snapshot.createdAt)}</span>
            </div>
            <button
              type="button"
              className="history-restore-btn"
              onClick={() => onRestore(snapshot.id)}
              title="Restore snapshot"
            >
              <RotateCcw size={12} />
              Restore
            </button>
          </div>
        ))}

        {snapshots.length === 0 && (
          <p className="history-empty">Snapshots will appear here after your first autosave.</p>
        )}
      </div>
    </motion.aside>
  );
}
