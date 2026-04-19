"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function TiltImage({ src }: { src: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(211,165,177,0.3)] aspect-[4/3] group border-[6px] border-white/60 bg-white/20 backdrop-blur-sm"
    >
      <div style={{ transform: "translateZ(30px)" }} className="absolute inset-0">
        <img
          src={src}
          alt="App Preview"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--pastel-blue)]/30 to-transparent mix-blend-overlay" />
      </div>
    </motion.div>
  );
}
