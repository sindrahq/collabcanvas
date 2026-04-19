"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function LandingWithLottie() {
  const reducedMotion = useReducedMotionPreference();
  const heroAnimation = useMemo(() => {
    return { v: "5.7.4", fr: 30, ip: 0, op: 60, w: 400, h: 400, nm: "hero-shapes", ddd: 0, assets: [], layers: [] };
  }, []);

  if (reducedMotion) {
    return <div className="h-[400px] w-[400px] rounded-3xl bg-white/10 backdrop-blur-md" aria-hidden="true" />;
  }

  return (
    <div className="h-[400px] w-[400px] rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <Lottie animationData={heroAnimation} loop autoplay style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
