"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, LayoutTemplate } from "lucide-react";
import { FRAME_CATEGORIES, type FramePreset } from "@/lib/constants";
import { useWorkspaceStoreFactory } from "@/store/workspaceStore";

export function FramePicker({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Desktop"])
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const useStore = useWorkspaceStoreFactory(workspaceId);
  const canvasDimensions = useStore((s) => s.canvasDimensions);
  const setCanvasDimensions = useStore((s) => s.setCanvasDimensions);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggleCategory(label: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  function selectPreset(preset: FramePreset) {
    setCanvasDimensions({ width: preset.width, height: preset.height });
    setOpen(false);
  }

  const isActive = (preset: FramePreset) =>
    canvasDimensions.width === preset.width &&
    canvasDimensions.height === preset.height;

  return (
    <div className="frame-picker-wrap" ref={containerRef}>
      <button
        type="button"
        className={`frame-picker-trigger${open ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Choose canvas frame size"
      >
        <LayoutTemplate size={13} />
        <span>Frame</span>
        <ChevronDown size={11} className={`frame-picker-chevron${open ? " rotated" : ""}`} />
      </button>

      {open && (
        <div className="frame-picker-panel">
          <p className="frame-picker-heading">Frame</p>
          <ul className="frame-category-list">
            {FRAME_CATEGORIES.map((cat) => {
              const expanded = expandedCategories.has(cat.label);
              return (
                <li key={cat.label} className="frame-category-item">
                  <button
                    type="button"
                    className="frame-category-toggle"
                    onClick={() => toggleCategory(cat.label)}
                  >
                    {expanded ? (
                      <ChevronDown size={12} className="frame-cat-icon" />
                    ) : (
                      <ChevronRight size={12} className="frame-cat-icon" />
                    )}
                    <span>{cat.label}</span>
                  </button>

                  {expanded && (
                    <ul className="frame-preset-list">
                      {cat.presets.map((preset) => (
                        <li key={preset.name}>
                          <button
                            type="button"
                            className={`frame-preset-item${isActive(preset) ? " selected" : ""}`}
                            onClick={() => selectPreset(preset)}
                          >
                            <span className="frame-preset-name">{preset.name}</span>
                            <span className="frame-preset-dims">
                              {preset.width}×{preset.height}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
