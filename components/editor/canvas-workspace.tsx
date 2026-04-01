"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Palette } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

const KonvaStageWorkspace = dynamic(
  () => import("@/components/editor/konva-stage").then((m) => m.KonvaStageWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading">
        <strong>Loading canvas...</strong>
      </div>
    ),
  }
);

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.15;

export function CanvasWorkspace() {
  const elementCount      = useWorkspaceStore((s) => s.elements.length);
  const canvasBackground  = useWorkspaceStore((s) => s.canvasBackground);
  const setCanvasBackground = useWorkspaceStore((s) => s.setCanvasBackground);
  const [zoom, setZoom] = useState(1);

  function zoomIn()    { setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2)))); }
  function zoomOut()   { setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2)))); }
  function zoomReset() { setZoom(1); }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <section className="canvas-stage-shell">
      <div className="canvas-header">
        <div>
          <p className="eyebrow">Canvas</p>
          <h2 className="canvas-title">Editor Surface</h2>
        </div>
        <div className="canvas-header-right">
          <div className="canvas-badge">
            <strong>{elementCount}</strong>
            <span>{elementCount === 1 ? "element" : "elements"}</span>
          </div>
          <div className="canvas-bg-picker" title="Canvas background color">
            <Palette size={13} />
            <input
              type="color"
              value={canvasBackground}
              onChange={(e) => setCanvasBackground(e.target.value)}
              title="Canvas background"
            />
          </div>
          <div className="zoom-controls">
            <button
              type="button" className="zoom-btn"
              onClick={zoomOut} disabled={zoom <= MIN_ZOOM}
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button" className="zoom-level"
              onClick={zoomReset} title="Reset zoom"
            >
              {zoomPercent}%
            </button>
            <button
              type="button" className="zoom-btn"
              onClick={zoomIn} disabled={zoom >= MAX_ZOOM}
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button" className="zoom-btn"
              onClick={zoomReset} title="Fit to screen"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="canvas-viewport">
        <div className="konva-shell" style={{ transition: "transform 0.2s ease", transformOrigin: "center top" }}>
          <KonvaStageWorkspace zoom={zoom} />
        </div>
      </div>
    </section>
  );
}
