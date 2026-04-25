"use client";

import { motion } from "framer-motion";

export function AudioIndicator({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="absolute -inset-1 z-0 flex items-center justify-center opacity-40">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute h-full w-full rounded-full border border-current"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
