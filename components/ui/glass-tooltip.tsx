"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, ReactNode } from "react";

interface GlassTooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
}

export function GlassTooltip({ content, children, delay = 0.4 }: GlassTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay * 1000);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 bottom-full z-[100] mb-3 -translate-x-1/2"
          >
            <div className="whitespace-nowrap rounded-xl border border-white/60 bg-white/45 px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#8b7355] shadow-xl shadow-[#D3A5B1]/10 backdrop-blur-xl">
              {content}
              {/* Subtle bubble tail */}
              <div className="absolute left-1/2 top-full -mt-[1px] h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-white/60 bg-white/45 backdrop-blur-xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
