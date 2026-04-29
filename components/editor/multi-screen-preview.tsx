"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Tablet, Smartphone, X } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

const KonvaStageWorkspace = dynamic(
  () => import("@/components/editor/konva-stage").then((m) => m.KonvaStageWorkspace),
  { ssr: false, loading: () => <div style={{ background: "#f5f5f5", width: "100%", height: "100%" }} /> }
);

const STAGE_SCALE = 1.6;

const DEVICES = [
  {
    id: "desktop",
    label: "Desktop",
    sub: "1440px",
    Icon: Monitor,
    frameStyle: {
      border: "10px solid #2d2d2d",
      borderBottom: "36px solid #2d2d2d",
      borderRadius: "10px 10px 6px 6px",
    },
    innerW: 420,
    innerH: 263,
  },
  {
    id: "tablet",
    label: "Tablet",
    sub: "768px",
    Icon: Tablet,
    frameStyle: {
      border: "14px solid #2d2d2d",
      borderLeft: "18px solid #2d2d2d",
      borderRight: "18px solid #2d2d2d",
      borderRadius: "18px",
    },
    innerW: 232,
    innerH: 309,
  },
  {
    id: "mobile",
    label: "Mobile",
    sub: "390px",
    Icon: Smartphone,
    frameStyle: {
      border: "12px solid #1a1a1a",
      borderTop: "28px solid #1a1a1a",
      borderBottom: "32px solid #1a1a1a",
      borderRadius: "28px",
    },
    innerW: 148,
    innerH: 320,
  },
] as const;

export function MultiScreenPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const canvasDimensions = useWorkspaceStore((s) => s.canvasDimensions);
  const stageW = canvasDimensions.width / STAGE_SCALE;
  const stageH = canvasDimensions.height / STAGE_SCALE;
  const workspaceId = useWorkspaceStore((s) => s.workspace?.id ?? "");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: "rgba(20,28,24,0.72)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="relative flex flex-col"
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            transition={{ duration: 0.22 }}
            style={{
              background: "rgba(255,253,248,0.97)",
              borderRadius: 20,
              boxShadow: "0 32px 80px rgba(20,28,24,0.32)",
              padding: "28px 32px 32px",
              maxWidth: "calc(100vw - 48px)",
              maxHeight: "calc(100vh - 48px)",
              overflow: "auto",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6" style={{ minWidth: 0 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A5B1", marginBottom: 2 }}>
                  Preview
                </p>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e2523", margin: 0 }}>
                  Multi-Screen Preview
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 8, border: "none",
                  background: "rgba(211,165,177,0.12)", cursor: "pointer", color: "#8b7355",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Device frames */}
            <div className="flex items-end gap-10 flex-wrap justify-center">
              {DEVICES.map(({ id, label, sub, Icon, frameStyle, innerW, innerH }) => {
                const scale = Math.min(innerW / stageW, innerH / stageH);
                const scaledW = stageW * scale;
                const scaledH = stageH * scale;

                return (
                  <div key={id} className="flex flex-col items-center gap-3">
                    {/* Device label */}
                    <div className="flex items-center gap-1.5" style={{ color: "#6a6257" }}>
                      <Icon size={13} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 11, opacity: 0.6 }}>{sub}</span>
                    </div>

                    {/* Device chrome */}
                    <div style={{ ...frameStyle, display: "inline-block", background: "#1a1a1a", position: "relative" }}>
                      {/* Screen / viewport */}
                      <div
                        style={{
                          width: innerW,
                          height: innerH,
                          overflow: "hidden",
                          background: "#fff",
                          position: "relative",
                        }}
                      >
                        {/* Scaled canvas — pointer-events blocked so it's read-only */}
                        <div
                          style={{
                            width: stageW,
                            height: stageH,
                            transform: `scale(${scale})`,
                            transformOrigin: "top left",
                            pointerEvents: "none",
                            userSelect: "none",
                          }}
                        >
                          <KonvaStageWorkspace workspaceId={workspaceId} />
                        </div>

                        {/* Transparent overlay to block all interactions */}
                        <div
                          style={{
                            position: "absolute", inset: 0,
                            background: "transparent",
                            pointerEvents: "none",
                          }}
                        />

                        {/* Viewport size label */}
                        <div style={{
                          position: "absolute", bottom: 4, right: 6,
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                          color: "rgba(30,37,35,0.4)", textTransform: "uppercase",
                        }}>
                          {Math.round(scaledW)}×{Math.round(scaledH)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#9a8f87" }}>
              Read-only preview — edits are reflected live. Press <kbd style={{ background: "#f0ece4", padding: "1px 5px", borderRadius: 4, border: "1px solid #d5cfc5", fontSize: 10 }}>Esc</kbd> to close.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
