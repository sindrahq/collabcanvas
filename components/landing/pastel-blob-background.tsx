"use client";

import { motion } from "framer-motion";
import { CanvasTheme } from "@/store/workspaceStore";

type PastelBlobBackgroundProps = {
  theme?: CanvasTheme;
};

export function PastelBlobBackground({ theme = "cherry" }: PastelBlobBackgroundProps) {
  // Theme specific colors for the 4 animated blobs
  const getBlobColors = () => {
    switch (theme) {
      case "forest":
        return [
          "bg-[#8FBC8F]", // Dark sea green
          "bg-[#E0EEE0]", // Dew green
          "bg-[#C1D7AE]", // Sage leaf
          "bg-[#708238]", // Sap/moss green
        ];
      case "ocean":
        return [
          "bg-[#B0E0E6]", // Powder blue
          "bg-[#E0FFFF]", // Light cyan
          "bg-[#A7C7E7]", // Pastel blue
          "bg-[#4A90E2]", // Ocean blue
        ];
      case "sunset":
        return [
          "bg-[#FFDAB9]", // Peach puff
          "bg-[#FFA07A]", // Light salmon
          "bg-[#D8BFD8]", // Thistle purple
          "bg-[#F39C12]", // Sunset amber
        ];
      case "cherry":
      default:
        return [
          "bg-[#D3B5E5]", // Lavender
          "bg-[#FADBD8]", // Pink
          "bg-[#EBDDF2]", // Soft lilac
          "bg-[#D3A5B1]", // Dusty rose
        ];
    }
  };

  const colors = getBlobColors();

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
        className={`absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full ${colors[0]} blur-[100px] opacity-80 mix-blend-multiply transition-colors duration-1000`}
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
        className={`absolute top-[20%] -right-[5%] h-[500px] w-[500px] rounded-full ${colors[1]} blur-[80px] opacity-75 mix-blend-multiply transition-colors duration-1000`}
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
        className={`absolute -bottom-[10%] left-[20%] h-[550px] w-[550px] rounded-full ${colors[2]} blur-[90px] opacity-85 mix-blend-multiply transition-colors duration-1000`}
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
        className={`absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full ${colors[3]} blur-[80px] opacity-70 mix-blend-multiply transition-colors duration-1000`}
      />
    </div>
  );
}
