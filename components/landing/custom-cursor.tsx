"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [isVisible]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-32 h-32 rounded-full pointer-events-none z-[100] mix-blend-overlay"
      animate={{
        x: mousePosition.x - 64,
        y: mousePosition.y - 64,
        opacity: isVisible ? 1 : 0
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 300,
        mass: 0.1
      }}
      style={{
        background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)",
      }}
    />
  );
}
