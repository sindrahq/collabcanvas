"use client";

import React from "react";
import { usePresenceStore } from "@/store/presenceStore";
import { motion } from "framer-motion";

// Simple PresenceOverlay that renders a circle for each remote user.
// In a full implementation this would use actual cursor positions from the presence store.
// For now we display a placeholder based on user id.

export default function PresenceOverlay() {
  const users = usePresenceStore((s) => s.users);
  const localUserId = usePresenceStore((s) => s.localUserId);

  // Filter out local user
  const remoteUsers = Object.entries(users).filter(([id]) => id !== localUserId);

  return (
    <div className="presence-overlay absolute inset-0 pointer-events-none">
      {remoteUsers.map(([id, meta]) => (
        <motion.div
          key={id}
          className="presence-cursor"
          style={{
            position: "absolute",
            // For demo purposes, place randomly based on hash of id
            left: `${(parseInt(id.slice(-2), 16) % 90) + 5}%`,
            top: `${(parseInt(id.slice(-4, -2), 16) % 90) + 5}%`,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: meta?.color ?? "#ff0000",
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
