"use client";

import { motion } from "framer-motion";
import { Palette, Zap, Users, Search, RotateCcw } from "lucide-react";
import { useState } from "react";

type FeatureCardItem = {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  longDescription: string;
  accent: string;
  bg: string;
};

const defaultItems: FeatureCardItem[] = [
  {
    id: 1,
    icon: <Palette size={32} />,
    title: "Live Canvas",
    description: "Experience zero-latency rendering with our optimized engine",
    longDescription: "Our custom-built WebGL engine ensures that every stroke, shape, and image is rendered at 60fps, providing a fluid design experience that never lags behind your creativity.",
    accent: "#8b7355",
    bg: "var(--pastel-blue)",
  },
  {
    id: 2,
    icon: <Zap size={32} />,
    title: "Instant Sync",
    description: "Every stroke is saved and synced across all devices instantly",
    longDescription: "Utilizing real-time synchronization protocols, we ensure that your team sees exactly what you see. No manual saving required—your progress is automatically preserved in the cloud.",
    accent: "#E67E22",
    bg: "var(--pastel-peach)",
  },
  {
    id: 3,
    icon: <Users size={32} />,
    title: "Real-time Collaboration",
    description: "Invite your team and co-create in a seamless environment",
    longDescription: "Break down silos with shared cursors, live activity feeds, and instant feedback loops. CollabCanvas makes remote teamwork feel like you're in the same room.",
    accent: "#27AE60",
    bg: "var(--pastel-mint)",
  },
  {
    id: 4,
    icon: <Search size={32} />,
    title: "Smart Inspector",
    description: "Precise control over every layer, color, and property",
    longDescription: "The most powerful design tool is the one that gives you complete control. Our smart inspector offers deep-level manipulation of every property, from precise gradients to complex layer blending.",
    accent: "#8E44AD",
    bg: "var(--pastel-lavender)",
  },
];

export function LandingFeatureCards() {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {defaultItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="group bento-card border border-white/50 bg-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(211,165,177,0.2)] overflow-hidden h-full hover:bg-white/30 transition-all duration-300 p-8 flex flex-col cursor-pointer"
          onClick={() => setActiveId(activeId === item.id ? null : item.id)}
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
            style={{ backgroundColor: item.bg, color: item.accent }}
          >
            {item.icon}
          </div>
          <h3 className="text-xl font-bold text-[#2D3436] mb-3">{item.title}</h3>
          
          {activeId === item.id ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#636E72] leading-relaxed text-sm"
            >
              {item.longDescription}
            </motion.p>
          ) : (
            <p className="text-[#636E72] leading-relaxed text-sm">
              {item.description}
            </p>
          )}
          
          <div className="mt-auto pt-6 border-t border-black/[0.03] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#636E72]">
              {activeId === item.id ? "Click to collapse" : "Click to read more"}
            </span>
            <div className="w-8 h-8 rounded-full border border-black/[0.05] flex items-center justify-center">
              {activeId === item.id ? <RotateCcw size={14} className="text-[#D4B595]" /> : <Zap size={14} className="text-[#D4B595]" />}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
