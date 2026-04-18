"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Petal = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
};

export function FallingPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const newPetals = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 12 + Math.random() * 20,
      size: 15 + Math.random() * 20,
      rotation: Math.random() * 360,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -100, x: `${p.x}vw`, rotate: p.rotation, opacity: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            x: [`${p.x}vw`, `${p.x + (Math.random() > 0.5 ? 15 : -15)}vw`],
            rotate: p.rotation + (Math.random() > 0.5 ? 360 : -360),
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bg-gradient-to-br from-[#F1948A] to-[#FADBD8]"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: "100% 0% 100% 0%",
            boxShadow: "0 8px 16px rgba(211,165,177,0.4)"
          }}
        />
      ))}
    </div>
  );
}
