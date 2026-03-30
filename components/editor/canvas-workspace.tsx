"use client";

import dynamic from "next/dynamic";
import { useWorkspaceStore } from "@/store/workspaceStore";

const KonvaStageWorkspace = dynamic(
  () => import("@/components/editor/konva-stage").then((module) => module.KonvaStageWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading">
        <strong>Loading canvas engine...</strong>
        <span>The Konva stage is being prepared for the editor workspace.</span>
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
          <p className="eyebrow">Editor Workspace</p>
          <h2 className="canvas-title">Canvas Area</h2>
          <p className="canvas-subtitle">
            The canvas engine branch replaces the static preview with a real Konva stage connected
            to the shared workspace store. Elements can now be selected and dragged inside the fixed
            viewport.
          </p>
        </div>
        <div className="canvas-badge">
          <strong>{elementCount}</strong>
          <span>Active elements</span>
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
