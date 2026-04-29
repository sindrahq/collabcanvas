"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Palette, ZoomIn, ZoomOut } from "lucide-react";
import { RemoteCursors } from "@/components/presence/RemoteCursors";
import {
  broadcastCursor,
  normalizeCoords,
  updatePresence,
  type PresenceMeta
} from "@/lib/collaboration";
import { useWorkspaceStoreFactory } from "@/store/workspaceStore";
import type { WorkspaceState } from "@/store/workspaceStore";

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

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.15;
const MOBILE_BREAKPOINT = 860;
const STAGE_SCALE = 1.6;

type CanvasWorkspaceProps = {
  workspaceId: string;
  currentUserId: string;
  presences: Record<string, PresenceMeta>;
  remoteCursors: Record<string, { x: number; y: number; updatedAt: number }>;
};

export function CanvasWorkspace({ workspaceId, currentUserId, presences, remoteCursors }: CanvasWorkspaceProps) {
  const store = useWorkspaceStoreFactory(workspaceId);
  const elementCount        = store((s: WorkspaceState) => s.elements.length);
  const canvasBackground    = store((s: WorkspaceState) => s.canvasBackground);
  const setCanvasBackground = store((s: WorkspaceState) => s.setCanvasBackground);
  const canvasDimensions    = store((s: WorkspaceState) => s.canvasDimensions);
  const canEdit             = store((s: WorkspaceState) => s.canEdit);
  const elements            = store((s: WorkspaceState) => s.elements);

  const stageRenderWidth  = canvasDimensions.width  / STAGE_SCALE;
  const stageRenderHeight = canvasDimensions.height / STAGE_SCALE;
  const [zoom, setZoom] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [autoFitEnabled, setAutoFitEnabled] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const fitZoom = useMemo(() => {
    const width = Math.max(1, viewportSize.width - 24);
    const height = Math.max(1, viewportSize.height - 24);
    const nextZoom = Math.min(width / stageRenderWidth, height / stageRenderHeight);
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parseFloat(nextZoom.toFixed(2))));
  }, [viewportSize, stageRenderWidth, stageRenderHeight]);

  const isMobileViewport = viewportSize.width > 0 && viewportSize.width < MOBILE_BREAKPOINT;

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const measure = () => {
      setViewportSize({ width: node.clientWidth, height: node.clientHeight });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useLayoutEffect(() => {
    if (isMobileViewport && autoFitEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoom(fitZoom);
    }
  }, [autoFitEnabled, fitZoom, isMobileViewport]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    function handleWheel(event: WheelEvent) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setAutoFitEnabled(false);
      setZoom((currentZoom) => {
        const multiplier = event.deltaY < 0 ? 1.08 : 0.92;
        const nextZoom = currentZoom * multiplier;
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parseFloat(nextZoom.toFixed(2))));
      });
    }

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        setAutoFitEnabled(false);
        setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2))));
      } else if (event.key === "-") {
        event.preventDefault();
        setAutoFitEnabled(false);
        setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2))));
      } else if (event.key === "0") {
        event.preventDefault();
        setAutoFitEnabled(false);
        setZoom(1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

function getTouchDistance(touches: React.TouchList) {
  if (touches.length < 2) return 0;
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 0;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      setAutoFitEnabled(false);
      pinchStartDistanceRef.current = getTouchDistance(event.touches);
      pinchStartZoomRef.current = zoom;
    }
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || !pinchStartDistanceRef.current) return;
    event.preventDefault();
    const currentDistance = getTouchDistance(event.touches);
    if (!currentDistance) return;
    const scale = currentDistance / pinchStartDistanceRef.current;
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parseFloat((pinchStartZoomRef.current * scale).toFixed(2)))));
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchStartDistanceRef.current = null;
    }
  }

  function zoomIn() {
    setAutoFitEnabled(false);
    setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2))));
  }

  function zoomOut() {
    setAutoFitEnabled(false);
    setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2))));
  }

  function zoomReset() {
    if (isMobileViewport) {
      setAutoFitEnabled(true);
      setZoom(fitZoom);
      return;
    }

    setAutoFitEnabled(false);
    setZoom(1);
  }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <section className="canvas-stage-shell">
      <div className="canvas-toolbar-row">
        <div className="canvas-toolbar-copy">
          <p className="eyebrow">Workspace Surface</p>
          <h2 className="canvas-title">Canvas</h2>
        </div>
        <div className="canvas-toolbar-actions">
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
              disabled={!canEdit}
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
      <div className="canvas-viewport" ref={viewportRef}>
        <div
          className="konva-shell konva-stage-wrap"
          style={{
            transformOrigin: "center center",
            transform: `translateX(-36px) scale(${zoom})`,
            touchAction: isMobileViewport ? "pan-x" : "none",
            width: `${stageRenderWidth}px`,
            minWidth: `${stageRenderWidth}px`,
            height: `${stageRenderHeight}px`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const normalized = normalizeCoords(event.clientX, event.clientY, rect);
            const x = Math.min(Math.max(normalized.x, 0), 1);
            const y = Math.min(Math.max(normalized.y, 0), 1);
            updatePresence({ cursor: { x, y } });
            broadcastCursor(currentUserId, x, y);
          }}
        >
          <KonvaStageWorkspace zoom={zoom} remoteCursors={remoteCursors} presences={presences} />
          <RemoteCursors
            cursors={remoteCursors}
            presences={presences}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      <div className="canvas-zoom-float">
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
    </section>
  );
}
