"use client";

import { motion } from "framer-motion";
import { HandshakeIcon, LayersIcon, LightningIcon, MagnifierIcon, PaletteIcon, SparklesIcon } from "@/components/landing/icons";

type GridItem = {
  title: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: GridItem[] = [
  { title: "Live Canvas", color: "#8b7355", bg: "var(--pastel-blue)", Icon: PaletteIcon },
  { title: "Instant Sync", color: "#E67E22", bg: "var(--pastel-peach)", Icon: LightningIcon },
  { title: "Collaborate", color: "#27AE60", bg: "var(--pastel-mint)", Icon: HandshakeIcon },
  { title: "Inspector", color: "#8E44AD", bg: "var(--pastel-lavender)", Icon: MagnifierIcon },
  { title: "Layer System", color: "#2980B9", bg: "var(--pastel-blue)", Icon: LayersIcon },
  { title: "Design Tools", color: "#7F8C8D", bg: "var(--pastel-mint)", Icon: SparklesIcon },
];

export function FeatureGridAnimated() {
  return (
    <section className="py-24 px-6 bg-black/[0.01]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#2D3436]">The Full Suite</h2>
          <p className="text-[#636E72] text-lg max-w-2xl mx-auto">
            Everything you need to turn ideas into reality, all in one cohesive environment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const Icon = item.Icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group bento-card flex flex-col items-center justify-center text-center py-12"
              >
                <div 
                  className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-black/[0.02]"
                  style={{ backgroundColor: item.bg }}
                >
                  <Icon className="h-14 w-14" style={{ color: item.color }} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-[#2D3436] transition-colors group-hover:text-black">
                  {item.title}
                </h3>
                <div className="mt-4 w-12 h-1 bg-black/[0.05] rounded-full transition-all group-hover:w-20 group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-[#D4B595] group-hover:to-transparent" />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
