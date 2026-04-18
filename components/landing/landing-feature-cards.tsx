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
  const [flippedId, setFlippedId] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-1000">
      {defaultItems.map((item, index) => (
        <div key={item.id} className="relative h-[320px] w-full cursor-pointer" onClick={() => setFlippedId(flippedId === item.id ? null : item.id)}>
          <motion.div
            className="w-full h-full relative preserve-3d"
            initial={false}
            animate={{ rotateY: flippedId === item.id ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bento-card border border-white/50 bg-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(211,165,177,0.2)] overflow-hidden h-full hover:bg-white/30 transition-all duration-300 p-8 flex flex-col"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundColor: item.bg, color: item.accent }}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-3">{item.title}</h3>
                <p className="text-[#636E72] leading-relaxed text-sm">
                  {item.description}
                </p>
                
                <div className="mt-auto pt-6 border-t border-black/[0.03] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#636E72]">Click to flip</span>
                  <div className="w-8 h-8 rounded-full border border-black/[0.05] flex items-center justify-center">
                    <Zap size={14} className="text-[#D4B595]" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)]">
              <div className="bento-card border border-[#D3A5B1]/30 bg-[#fffdf9]/90 backdrop-blur-xl shadow-[0_8px_48px_rgba(211,165,177,0.3)] overflow-hidden h-full p-8 flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#FADBD8] text-[#8b7355]">
                  <Zap size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#2D3436] mb-3">About {item.title}</h3>
                <p className="text-[#636E72] leading-relaxed text-sm flex-1">
                  {item.longDescription}
                </p>
                
                <div className="mt-6 pt-4 border-t border-black/[0.05] flex items-center justify-between text-[#D3A5B1]">
                  <span className="text-xs font-bold uppercase tracking-wider">Tap to return</span>
                  <RotateCcw size={16} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
