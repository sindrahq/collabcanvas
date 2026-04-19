"use client";

import { useEffect, useState } from "react";

export function HeroFlipAnimation() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFlipped(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[600px] perspective-[1000px]">
      <button
        type="button"
        className="h-[500px] w-full rounded-[28px] border border-white/15 bg-transparent text-left outline-none"
        aria-label="Flip hero preview"
        onClick={() => setFlipped((value) => !value)}
      >
        <div
          className={`relative h-full w-full transition-transform duration-[600ms] ease-in-out [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(180deg,#f7f1e8,#efe6d7)] p-8 [backface-visibility:hidden]">
            <div className="flex h-full flex-col justify-center rounded-[22px] border border-black/5 bg-white/40 p-8 text-center shadow-2xl backdrop-blur-md">
              <div className="text-4xl font-bold tracking-[-0.03em] text-[#1a1a1a]">CollabCanvas</div>
              <p className="mt-4 font-sans text-sm text-[#6b6560]">Design Without Limits</p>
              <p className="mt-2 font-sans text-xs uppercase tracking-[0.24em] text-[#8b7355]">Scroll or click to reveal editor preview</p>
            </div>
          </div>

          <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(180deg,#11233d,#0b1220)] p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="grid h-full grid-cols-[72px_1fr_120px] gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4 text-white">
              <div className="rounded-2xl bg-white/10 p-3 text-xs">Layers</div>
              <div className="rounded-2xl bg-white/10 p-3 text-xs">Canvas</div>
              <div className="rounded-2xl bg-white/10 p-3 text-xs">Inspector</div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
