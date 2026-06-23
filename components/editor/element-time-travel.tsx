"use client";

import { useEffect, useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import { useWorkspaceStoreFactory } from "@/store/workspaceStore";

export function ElementTimeTravelSlider({ workspaceId }: { workspaceId: string }) {
  const useStore = useWorkspaceStoreFactory(workspaceId);
  const selectedElementId = useStore((s) => s.selectedElementId);
  const elementHistory = useStore((s) => s.elementHistory);
  const timeTravelCursor = useStore((s) => s.timeTravelCursor);
  const travelElementTo = useStore((s) => s.travelElementTo);
  const restoreElementToCurrent = useStore((s) => s.restoreElementToCurrent);

  const history = elementHistory[selectedElementId ?? ""] ?? [];
  const maxIndex = Math.max(history.length - 1, 0);
  const hasHistory = history.length > 1;
  const currentIndex = selectedElementId ? (timeTravelCursor?.[selectedElementId] ?? maxIndex) : 0;

  const [sliderValue, setSliderValue] = useState(currentIndex);

  useEffect(() => {
    setSliderValue(currentIndex);
  }, [currentIndex, selectedElementId, history.length]);

  if (!selectedElementId) return null;

  function handleChange(value: number) {
    if (!selectedElementId) return;
    setSliderValue(value);
    travelElementTo(selectedElementId, value);
  }

  const isAtPresent = sliderValue >= maxIndex;
  const stepsBack = maxIndex - sliderValue;

  return (
    <div className="inspector-section">
      <div className="inspector-section-title">
        <Clock size={12} />
        <span>Time Travel</span>
        {hasHistory && !isAtPresent && (
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 700,
            color: "#D3A5B1", background: "rgba(211,165,177,0.12)",
            padding: "2px 7px", borderRadius: 20, border: "1px solid rgba(211,165,177,0.2)",
          }}>
            {stepsBack} step{stepsBack !== 1 ? "s" : ""} back
          </span>
        )}
      </div>

      <div style={{ padding: "4px 0 8px" }}>
        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={sliderValue}
          onInput={(e) => handleChange(Number((e.target as HTMLInputElement).value))}
          onChange={(e) => handleChange(Number(e.target.value))}
          disabled={!hasHistory}
          className="inspector-slider"
          style={{ width: "100%", accentColor: "#D3A5B1", opacity: hasHistory ? 1 : 0.45 }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 10, color: "#9a8f87", marginTop: 4, userSelect: "none",
        }}>
          <span>Oldest</span>
          <span style={{ fontWeight: isAtPresent ? 600 : 400, color: isAtPresent ? "#2d3436" : "#9a8f87" }}>
            {hasHistory ? (isAtPresent ? "Current State" : `State ${sliderValue + 1} of ${history.length}`) : "No history yet"}
          </span>
          <span>Present</span>
        </div>
      </div>

      {!hasHistory && (
        <div style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: "#7b6f66",
          background: "rgba(211,165,177,0.08)",
          border: "1px solid rgba(211,165,177,0.16)",
          borderRadius: 10,
          padding: "8px 10px",
          marginTop: 2,
        }}>
          Time travel will appear after you make the first edit to this element.
        </div>
      )}

      {hasHistory && !isAtPresent && (
        <button
          type="button"
          onClick={() => handleChange(maxIndex)}
          style={{
            display: "flex", alignItems: "center", gap: 6, width: "100%",
            padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(211,165,177,0.3)",
            background: "rgba(211,165,177,0.08)", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#D3A5B1",
            marginTop: 4,
          }}
        >
          <RotateCcw size={12} />
          Back to present
        </button>
      )}
    </div>
  );
}
