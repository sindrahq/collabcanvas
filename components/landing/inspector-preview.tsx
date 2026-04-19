"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function InspectorPreview() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 120,
    damping: 20,
    mass: 0.4,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 120,
    damping: 20,
    mass: 0.4,
  });

  const shiftX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 90,
    damping: 16,
    mass: 0.45,
  });
  const shiftY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-8, 8]), {
    stiffness: 90,
    damping: 16,
    mass: 0.45,
  });

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        x: shiftX,
        y: shiftY,
        transformStyle: "preserve-3d",
      }}
      className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-sans text-sm font-semibold text-[#1f1b16]">Inspector Panel</h3>
        <span className="rounded-full border border-[#8b7355]/30 bg-white/40 px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-[#6c5a46]">
          Preview
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-white/30 bg-white/30 px-3 py-2">
          <span className="font-sans text-xs font-medium text-[#433628]">Fill</span>
          <span className="h-5 w-5 rounded-md border border-white/30 bg-[#8b7355] shadow-inner" />
        </div>

        <div className="rounded-lg border border-white/30 bg-white/30 px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#433628]">Stroke</span>
            <span className="font-sans text-xs text-[#6c5a46]">72%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#e8dfd2]">
            <div className="h-1.5 w-[72%] rounded-full bg-[#8b7355]" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/30 bg-white/30 px-3 py-2">
          <span className="font-sans text-xs font-medium text-[#433628]">Opacity</span>
          <span className="font-sans text-xs font-semibold text-[#6c5a46]">84%</span>
        </div>
      </div>
    </motion.div>
  );
}
