"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Star, ChevronDown, ChevronUp } from "lucide-react";

type ComparisonRow = {
  feature: string;
  collabcanvas: string;
  figma: string;
  canva?: string;
  tooltip?: string;
};

const rows: ComparisonRow[] = [
  { feature: "Real-time Collaboration", collabcanvas: "✅", figma: "✅", canva: "❌", tooltip: "Unlimited collaborators" },
  { feature: "Instant Sync", collabcanvas: "⭐", figma: "✅", canva: "❌", tooltip: "Powered by Supabase" },
  { feature: "Drag & Drop", collabcanvas: "✅", figma: "✅", canva: "✅", tooltip: "Proprietary engine" },
  { feature: "Layer Management", collabcanvas: "✅", figma: "✅", canva: "❌", tooltip: "Advanced nesting" },
  { feature: "Smart Inspector", collabcanvas: "✅", figma: "✅", canva: "❌", tooltip: "Precise property control" },
  { feature: "Image Upload", collabcanvas: "✅", figma: "✅", canva: "✅", tooltip: "Cloud-optimized" },
  { feature: "PDF/PNG/JPG Export", collabcanvas: "✅", figma: "✅", canva: "✅", tooltip: "High-resolution" },
];

export function FeatureComparisonTable() {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = useMemo(() => (expanded ? rows : rows.slice(0, 5)), [expanded]);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-4 text-[#2D3436]">How we compare</h2>
        <p className="text-[#636E72] text-lg">See why teams are choosing CollabCanvas.</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bento-card border-black/[0.03] p-0 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-black/[0.05] bg-black/[0.02]">
          {["Feature", "CollabCanvas", "Figma", "Canva"].map((label) => (
            <div key={label} className="px-8 py-6 text-sm font-bold text-[#2D3436]">
              {label}
            </div>
          ))}
        </div>

        <div className="divide-y divide-black/[0.03]">
          {visibleRows.map((row) => (
            <div key={row.feature} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center hover:bg-black/[0.01] transition-colors">
              <div className="px-8 py-6">
                <div className="text-sm font-bold text-[#2D3436]">{row.feature}</div>
                <div className="text-xs text-[#636E72] mt-1">{row.tooltip}</div>
              </div>
              <Cell value={row.collabcanvas} highlight />
              <Cell value={row.figma} />
              <Cell value={row.canva ?? "❌"} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {visibleRows.map((row) => (
          <div key={row.feature} className="bento-card border-black/[0.03] p-6">
            <div className="text-lg font-bold text-[#2D3436] mb-4">{row.feature}</div>
            <div className="grid grid-cols-3 gap-2">
              <MobileCell label="Collab" value={row.collabcanvas} highlight />
              <MobileCell label="Figma" value={row.figma} />
              <MobileCell label="Canva" value={row.canva ?? "❌"} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white border border-black/[0.05] text-[#2D3436] font-bold text-sm transition-all hover:bg-black/[0.02]"
        >
          {expanded ? (
            <>Show Less <ChevronUp size={18} /></>
          ) : (
            <>Show More Features <ChevronDown size={18} /></>
          )}
        </button>
      </div>
    </section>
  );
}

function Cell({ value, highlight = false }: { value: string; highlight?: boolean }) {
  return (
    <div className={`px-8 py-6 flex justify-center ${highlight ? "bg-[#D4E6F1]/20" : ""}`}>
      <IconValue value={value} />
    </div>
  );
}

function MobileCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl flex flex-col items-center gap-2 ${highlight ? "bg-[#D4E6F1]/30" : "bg-black/[0.02]"}`}>
      <span className="text-[10px] uppercase font-bold text-[#636E72]">{label}</span>
      <IconValue value={value} />
    </div>
  );
}

function IconValue({ value }: { value: string }) {
  if (value === "✅") return <div className="w-6 h-6 rounded-full bg-[#D5F5E3] flex items-center justify-center text-[#27AE60]"><Check size={14} strokeWidth={3} /></div>;
  if (value === "❌") return <div className="w-6 h-6 rounded-full bg-[#FADBD8] flex items-center justify-center text-[#E74C3C]"><X size={14} strokeWidth={3} /></div>;
  if (value === "⭐") return <div className="w-6 h-6 rounded-full bg-[#FDEBD0] flex items-center justify-center text-[#F39C12]"><Star size={14} fill="currentColor" strokeWidth={0} /></div>;
  return null;
}

