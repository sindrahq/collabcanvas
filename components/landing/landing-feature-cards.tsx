"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Palette, Zap, Users, Search } from "lucide-react";

type FeatureCardItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  bg: string;
};

const defaultItems: FeatureCardItem[] = [
  {
    icon: <Palette size={32} />,
    title: "Live Canvas",
    description: "Experience zero-latency rendering with our optimized engine",
    accent: "#8b7355",
    bg: "var(--pastel-blue)",
  },
  {
    icon: <Zap size={32} />,
    title: "Instant Sync",
    description: "Every stroke is saved and synced across all devices instantly",
    accent: "#E67E22",
    bg: "var(--pastel-peach)",
  },
  {
    icon: <Users size={32} />,
    title: "Real-time Collaboration",
    description: "Invite your team and co-create in a seamless environment",
    accent: "#27AE60",
    bg: "var(--pastel-mint)",
  },
  {
    icon: <Search size={32} />,
    title: "Smart Inspector",
    description: "Precise control over every layer, color, and property",
    accent: "#8E44AD",
    bg: "var(--pastel-lavender)",
  },
];

export function LandingFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {defaultItems.map((item, index) => (
        <Link href="/projects" key={item.title} className="block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="group bento-card border border-white/50 bg-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(211,165,177,0.2)] overflow-hidden cursor-pointer h-full hover:bg-white/30 transition-all duration-300"
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
            
            <div className="mt-6 pt-6 border-t border-black/[0.03] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold uppercase tracking-wider text-[#636E72]">Learn more</span>
              <div className="w-8 h-8 rounded-full border border-black/[0.05] flex items-center justify-center">
                <Zap size={14} className="text-[#D4B595]" />
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
