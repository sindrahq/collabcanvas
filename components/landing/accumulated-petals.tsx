"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CanvasTheme } from "@/store/workspaceStore";

type AccumulatedParticle = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  hoverRotation: number;
  scatterX: number;
  scatterY: number;
};

type AccumulatedPetalsProps = {
  theme?: CanvasTheme;
};

export function AccumulatedPetals({ theme = "cherry" }: AccumulatedPetalsProps) {
  const [particles, setParticles] = useState<AccumulatedParticle[]>([]);

  useEffect(() => {
    // Generate 45 items resting at the bottom of the container
    const newParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // Spread across the width
      y: 65 + Math.random() * 35, // Clustered near the bottom
      size: theme === "sunset" 
        ? 8 + Math.random() * 14
        : 14 + Math.random() * 22,
      rotation: Math.random() * 360,
      hoverRotation: Math.random() > 0.5 ? 120 : -120,
      scatterX: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 60), // Scatter left or right out of the way
      scatterY: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40), // Scatter up or down
    }));
    const frame = requestAnimationFrame(() => setParticles(newParticles));
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  const getParticleStyles = (p: AccumulatedParticle) => {
    switch (theme) {
      case "forest":
        return {
          className: "absolute bg-gradient-to-br from-[#556B2F] to-[#8FBC8F]",
          style: {
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 0.7,
            borderRadius: "80% 10% 80% 10%",
            boxShadow: "0 4px 8px rgba(112,130,56,0.25)"
          }
        };
      case "ocean":
        return {
          className: "absolute border border-white/20 bg-[#589fa3]/10 backdrop-blur-[0.5px]",
          style: {
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 4px 8px rgba(0, 0, 0, 0.03)"
          }
        };
      case "sunset":
        return {
          className: "absolute bg-gradient-to-br from-[#E67E22] to-[#F1C40F] opacity-60",
          style: {
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            boxShadow: "0 0 8px rgba(230,126,34,0.6)"
          }
        };
      case "cherry":
      default:
        return {
          className: "absolute bg-gradient-to-br from-[#F1948A] to-[#FADBD8]",
          style: {
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "100% 0% 100% 0%",
            boxShadow: "0 6px 12px rgba(211,165,177,0.4)"
          }
        };
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-auto overflow-visible z-0">
      {particles.map((p) => {
        const themeStyles = getParticleStyles(p);
        return (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, rotate: p.rotation }}
            whileHover={{ 
              x: p.scatterX, 
              y: p.scatterY, 
              rotate: p.rotation + p.hoverRotation,
              scale: 1.1
            }}
            transition={{ 
              type: "spring", 
              stiffness: 40, 
              damping: 8,
              mass: 0.5 
            }}
            className={themeStyles.className}
            style={{
              ...themeStyles.style,
              position: "absolute",
            }}
          />
        );
      })}
    </div>
  );
}
