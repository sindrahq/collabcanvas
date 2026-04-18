"use client";

import { motion } from "framer-motion";

export function PastelBlobBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -150, 100, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-[#D3B5E5] blur-[100px] opacity-80 mix-blend-multiply"
      />
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 100, -120, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] -right-[5%] h-[500px] w-[500px] rounded-full bg-[#FADBD8] blur-[80px] opacity-75 mix-blend-multiply"
      />
      <motion.div
        animate={{
          x: [0, 80, -100, 0],
          y: [0, 120, 50, 0],
          scale: [1, 1.1, 0.85, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[10%] left-[20%] h-[550px] w-[550px] rounded-full bg-[#EBDDF2] blur-[90px] opacity-85 mix-blend-multiply"
      />
      <motion.div
        animate={{
          x: [0, -100, 100, 0],
          y: [0, 150, -50, 0],
          scale: [0.8, 1.2, 1, 0.8],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-[#D3A5B1] blur-[80px] opacity-70 mix-blend-multiply"
      />
    </div>
  );
}
