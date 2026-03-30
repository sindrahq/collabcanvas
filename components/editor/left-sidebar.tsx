"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function LeftSidebar() {
  const workspaceName = useWorkspaceStore((state) => state.workspaceName);
  const elements = useWorkspaceStore((state) => state.elements);
  const selectedElementId = useWorkspaceStore((state) => state.selectedElementId);
  const selectElement = useWorkspaceStore((state) => state.selectElement);
  const reorderElement = useWorkspaceStore((state) => state.reorderElement);
  const toggleVisibility = useWorkspaceStore((state) => state.toggleVisibility);
  const toggleLock = useWorkspaceStore((state) => state.toggleLock);
  const orderedElements = useMemo(
    () => [...elements].sort((left, right) => right.layerOrder - left.layerOrder),
    [elements]
  );

  return (
    <motion.aside
      className="editor-panel"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <p className="eyebrow">Project Scope</p>
      <h2 className="panel-title">{workspaceName}</h2>
      <p>
        This branch owns the shared workspace store and the live canvas frame. Every layer below is
        synced with the same state the canvas engine consumes.
      </p>

      <div className="panel-highlight">
        <span>{orderedElements.length} layers</span>
        <span>{orderedElements.filter((element) => element.visible).length} visible</span>
      </div>

      <div className="layer-stack">
        {orderedElements.map((element) => {
          const isSelected = element.id === selectedElementId;

          return (
            <motion.article
              key={element.id}
              className={`layer-card${isSelected ? " selected" : ""}`}
              layout
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            >
              <button
                type="button"
                className="layer-main-button"
                onClick={() => selectElement(element.id)}
              >
                <strong>{element.name}</strong>
                <span>
                  {element.type} | layer {element.layerOrder + 1}
                </span>
              </button>

              <div className="layer-actions">
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => toggleVisibility(element.id)}
                >
                  {element.visible ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => toggleLock(element.id)}
                >
                  {element.locked ? "Unlock" : "Lock"}
                </button>
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => reorderElement(element.id, "forward")}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => reorderElement(element.id, "backward")}
                >
                  Down
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.aside>
  );
}
