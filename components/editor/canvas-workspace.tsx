"use client";

import dynamic from "next/dynamic";

const KonvaStageWorkspace = dynamic(
  () => import("@/components/editor/konva-stage").then((m) => m.KonvaStageWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading">Loading canvas...</div>
    ),
  }
);

export function CanvasWorkspace() {
  return (
    <div className="canvas-viewport">
      <div className="konva-shell">
        <KonvaStageWorkspace />
      </div>
    </div>
  );
}