"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import { useWorkspaceStoreFactory } from "@/store/workspaceStore";

export function ElementTimeTravelSlider({ workspaceId }: { workspaceId: string }) {
  const useStore = useWorkspaceStoreFactory(workspaceId);
  const selectedElementId = useStore((s) => s.selectedElementId);
  const elementHistory = useStore((s) => s.elementHistory);
  const travelElementTo = useStore((s) => s.travelElementTo);
  const restoreElementToCurrent = useStore((s) => s.restoreElementToCurrent);

  const history = elementHistory[selectedElementId ?? ""] ?? [];
  const maxIndex = history.length; // 0..N-1 = past, N = current

  const [sliderValue, setSliderValue] = useState(maxIndex);
  const prevMaxRef = useRef(maxIndex);
  const isTravelingRef = useRef(false);

  // Reset when selected element changes
  useEffect(() => {
    setSliderValue(maxIndex);
    isTravelingRef.current = false;
  }, [selectedElementId]); // eslint-disable-line react-hooks/exhaustive-deps

  // When new history is added (user made a real edit), snap back to current
  useEffect(() => {
    if (prevMaxRef.current !== maxIndex) {
      prevMaxRef.current = maxIndex;
      if (!isTravelingRef.current) {
        setSliderValue(maxIndex);
      } else {
        // A real edit happened while time-traveling — reset travel and follow current
        isTravelingRef.current = false;
        setSliderValue(maxIndex);
      }
    }
  }, [maxIndex]);

  if (!selectedElementId || maxIndex === 0) return null;

  function handleChange(value: number) {
    if (!selectedElementId) return;
    setSliderValue(value);
    if (value >= maxIndex) {
      // Back to present
      isTravelingRef.current = false;
      restoreElementToCurrent(selectedElementId);
    } else {
      isTravelingRef.current = true;
      travelElementTo(selectedElementId, value);
    }
  }

  const isAtPresent = sliderValue >= maxIndex;
  const stepsBack = maxIndex - sliderValue;

  return (
    <div className="inspector-section">
      <div className="inspector-section-title">
        <Clock size={12} />
        <span>Time Travel</span>
        {!isAtPresent && (
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
          onChange={(e) => handleChange(Number(e.target.value))}
          className="inspector-slider"
          style={{ width: "100%", accentColor: "#D3A5B1" }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 10, color: "#9a8f87", marginTop: 4, userSelect: "none",
        }}>
          <span>Oldest</span>
          <span style={{ fontWeight: isAtPresent ? 600 : 400, color: isAtPresent ? "#2d3436" : "#9a8f87" }}>
            {isAtPresent ? "Present" : `Edit ${sliderValue + 1} of ${maxIndex}`}
          </span>
          <span>Present</span>
        </div>
      </div>

      {!isAtPresent && (
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
