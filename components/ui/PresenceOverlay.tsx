"use client";

import React from "react";
import { usePresenceStore } from "@/store/presenceStore";
import { motion } from "framer-motion";
import type { PresenceMeta } from "@/lib/collaboration";

type CursorPoint = { x: number; y: number; updatedAt: number };

type PresenceOverlayProps = {
  cursors?: Record<string, CursorPoint>;
  presences?: Record<string, PresenceMeta>;
  currentUserId?: string;
};

// Simple PresenceOverlay that renders a circle for each remote user.
// In a full implementation this would use actual cursor positions from the presence store.
// For now we display a placeholder based on user id.

export default function PresenceOverlay({ cursors, presences, currentUserId }: PresenceOverlayProps) {
  const users = usePresenceStore((s) => s.users);
  const localUserId = usePresenceStore((s) => s.localUserId);

  const overlayCursors = cursors ?? {};
  const overlayPresences = presences ?? users;
  const activeUserId = currentUserId ?? localUserId;

  const remoteUsers = Object.entries(overlayCursors).length > 0
    ? Object.entries(overlayCursors).filter(([id]) => id !== activeUserId)
    : Object.entries(overlayPresences).filter(([id]) => id !== activeUserId);

  return (
    <div className="presence-overlay absolute inset-0 pointer-events-none">
      {remoteUsers.map(([id, value]) => (
        <motion.div
          key={id}
          className="presence-cursor"
          style={{
            position: "absolute",
            left: `${"updatedAt" in value ? value.x * 100 : (parseInt(id.slice(-2), 16) % 90) + 5}%`,
            top: `${"updatedAt" in value ? value.y * 100 : (parseInt(id.slice(-4, -2), 16) % 90) + 5}%`,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "updatedAt" in value ? (overlayPresences[id]?.color ?? "#ff0000") : (value?.color ?? "#ff0000"),
            border: "2px solid #fff",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        />
      ))}
    </div>
  );
}
