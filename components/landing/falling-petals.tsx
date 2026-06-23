"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CanvasTheme } from "@/store/workspaceStore";

type Particle = {
  id: number;
  x: number;
  driftX: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  rotationDelta: number;
};

type FallingPetalsProps = {
  theme?: CanvasTheme;
};

export function FallingPetals({ theme = "cherry" }: FallingPetalsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      driftX: Math.random() > 0.5 ? 12 : -12,
      delay: Math.random() * 20,
      duration: theme === "ocean" ? 8 + Math.random() * 12 : 12 + Math.random() * 20,
      size: theme === "ocean" 
        ? 8 + Math.random() * 16 
        : theme === "sunset" 
        ? 4 + Math.random() * 8 
        : 14 + Math.random() * 18,
      rotation: Math.random() * 360,
      rotationDelta: Math.random() > 0.5 ? 360 : -360,
    }));
    const frame = requestAnimationFrame(() => setParticles(newParticles));
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  // Determine physics direction and styles based on theme
  const getParticleStyles = (p: Particle) => {
    switch (theme) {
      case "forest":
        return {
          className: "absolute bg-gradient-to-br from-[#556B2F] to-[#8FBC8F]",
          style: {
            width: p.size,
            height: p.size * 0.7,
            borderRadius: "80% 10% 80% 10%",
            boxShadow: "0 4px 10px rgba(112, 130, 56, 0.2)",
          },
        };
      case "ocean":
        return {
          className: "absolute border border-white/25 bg-white/10 backdrop-blur-[0.5px]",
          style: {
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 4px 8px rgba(0, 0, 0, 0.04)",
          },
        };
      case "sunset":
        return {
          className: "absolute bg-gradient-to-br from-[#F39C12] to-[#E74C3C] opacity-80",
          style: {
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            boxShadow: "0 0 10px rgba(243, 156, 18, 0.8), 0 0 20px rgba(231, 76, 60, 0.4)",
          },
        };
      case "cherry":
      default:
        return {
          className: "absolute bg-gradient-to-br from-[#F1948A] to-[#FADBD8]",
          style: {
            width: p.size,
            height: p.size,
            borderRadius: "100% 0% 100% 0%",
            boxShadow: "0 8px 16px rgba(211, 165, 177, 0.4)",
          },
        };
    }
  };

  const isRising = theme === "ocean" || theme === "sunset";

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {particles.map((p) => {
        const themeStyles = getParticleStyles(p);
        return (
          <motion.div
            key={p.id}
            initial={{ 
              y: isRising ? "110vh" : -100, 
              x: `${p.x}vw`, 
              rotate: p.rotation, 
              opacity: 0 
            }}
            animate={{
              y: isRising ? ["110vh", "-10vh"] : ["0vh", "110vh"],
              x: [
                `${p.x}vw`, 
                `${p.x + p.driftX}vw`
              ],
              rotate: p.rotation + p.rotationDelta,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
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
