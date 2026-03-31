"use client";

import dynamic from "next/dynamic";
import { useWorkspaceStore } from "@/store/workspaceStore";

const KonvaStageWorkspace = dynamic(
  () => import("@/components/editor/konva-stage").then((module) => module.KonvaStageWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading">
        <strong>Loading canvas...</strong>
      </div>
    )
  }
);

export function CanvasWorkspace() {
  const elementCount = useWorkspaceStore((state) => state.elements.length);

  return (
    <section className="canvas-stage-shell">
      <div className="canvas-header">
        <div>
          <p className="eyebrow">Canvas</p>
          <h2 className="canvas-title">Workspace</h2>
        </div>
        <div className="canvas-badge">
          <strong>{elementCount}</strong>
          <span>{elementCount === 1 ? "element" : "elements"}</span>
        </div>
      </div>
      <div className="canvas-viewport">
        <div className="konva-shell">
          <KonvaStageWorkspace />
        </div>
      </div>
    </section>
  );
}
