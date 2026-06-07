"use client";

import React from "react";
import { motion } from "framer-motion";
import { useCanvasIntegrationStoreFactory } from "@/store/canvasIntegrationStore";

export default function PresenceOverlay({ canvasId }: { canvasId: string }) {
  const store = useCanvasIntegrationStoreFactory(canvasId);
  const remoteCursors = store((state) => state.remoteCursors);

  return (
    <div className="presence-overlay absolute inset-0 pointer-events-none">
      {Object.entries(remoteCursors).map(([id, cursor]) => (
        <motion.div
          key={id}
          className="presence-cursor"
          style={{
            position: "absolute",
            left: `${cursor.x * 100}%`,
            top: `${cursor.y * 100}%`,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: cursor.color,
            border: "2px solid #fff",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {cursor.name ? (
            <span className="absolute left-3 top-3 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
              {cursor.name}
            </span>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
