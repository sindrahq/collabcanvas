"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Petal = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  scatterX: number;
  scatterY: number;
};

export function AccumulatedPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // Generate 40 petals resting at the bottom of the container
    const newPetals = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // Spread across the width
      y: 60 + Math.random() * 40, // Clustered near the bottom
      size: 15 + Math.random() * 25,
      rotation: Math.random() * 360,
      scatterX: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 60), // Scatter left or right out of the way
      scatterY: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40), // Scatter up or down
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-auto overflow-visible z-0">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, rotate: p.rotation }}
          whileHover={{ 
            x: p.scatterX, 
            y: p.scatterY, 
            rotate: p.rotation + (Math.random() > 0.5 ? 120 : -120),
            scale: 1.1
          }}
          transition={{ 
            type: "spring", 
            stiffness: 40, 
            damping: 8,
            mass: 0.5 
          }}
          className="absolute bg-gradient-to-br from-[#F1948A] to-[#FADBD8]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "100% 0% 100% 0%",
            boxShadow: "0 6px 12px rgba(211,165,177,0.4)"
          }}
        />
      ))}
    </div>
  );
}
