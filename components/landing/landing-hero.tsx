"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function LandingHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [typed, setTyped] = useState("");
  const fullText = "Collaborative Canvas Editor";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const shapes = Array.from({ length: 35 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 80 + 30,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.5 + 0.2,
      type: ["rect", "circle", "triangle", "diamond"][Math.floor(Math.random() * 4)],
      color: ["#7c6cfc", "#4caf82", "#f59e0b", "#e05555", "#a78bfa", "#60a5fa"][
        Math.floor(Math.random() * 6)
      ],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.012,
    }));

    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of shapes) {
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 20;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        if (s.type === "rect") {
          ctx.strokeRect(-s.size / 2, -s.size * 0.35, s.size, s.size * 0.7);
        } else if (s.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (s.type === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(s.size / 2, s.size / 2);
          ctx.lineTo(-s.size / 2, s.size / 2);
          ctx.closePath();
          ctx.stroke();
        } else if (s.type === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(s.size / 2, 0);
          ctx.lineTo(0, s.size / 2);
          ctx.lineTo(-s.size / 2, 0);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();

        s.x += s.speedX;
        s.y += s.speedY;
        s.rotation += s.rotSpeed;

        if (s.x < -100) s.x = canvas.width + 100;
        if (s.x > canvas.width + 100) s.x = -100;
        if (s.y < -100) s.y = canvas.height + 100;
        if (s.y > canvas.height + 100) s.y = -100;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "radial-gradient(ellipse at 20% 30%, #1a0d2e 0%, #0d0d1a 40%, #000000 100%)",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated canvas background */}
      <canvas ref={canvasRef} style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Glow blobs */}
      <div style={{
        position: "absolute",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,108,252,0.18) 0%, transparent 70%)",
        top: "-15%",
        left: "5%",
        pointerEvents: "none",
        zIndex: 0,
        animation: "blob-float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(76,175,130,0.12) 0%, transparent 70%)",
        bottom: "-10%",
        right: "5%",
        pointerEvents: "none",
        zIndex: 0,
        animation: "blob-float 10s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
        top: "40%",
        right: "8%",
        pointerEvents: "none",
        zIndex: 0,
        animation: "blob-float 6s ease-in-out infinite",
      }} />

      {/* Glassmorphism card */}
      <div style={{
        width: "min(540px, 100%)",
        background: "rgba(20, 16, 40, 0.65)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(124, 108, 252, 0.25)",
        borderRadius: "24px",
        padding: "52px 44px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        boxShadow: "0 0 80px rgba(124, 108, 252, 0.15), 0 25px 60px rgba(0,0,0,0.5)",
      }}>

        {/* Typewriter title */}
        <h1 style={{
          fontSize: "2.3rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.03em",
          marginBottom: 16,
          lineHeight: 1.2,
          minHeight: "2.8rem",
        }}>
          {typed}
          <span style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "#7c6cfc",
            marginLeft: 2,
            verticalAlign: "middle",
            animation: "blink 1s step-end infinite",
          }} />
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.7,
          fontSize: 14,
          marginBottom: 36,
          maxWidth: 380,
          margin: "0 auto 36px",
        }}>
          A Figma/Canva-style editor with live canvas,
          shared Zustand state, and Supabase sync.
        </p>

        {/* Glowing button */}
        <Link href="/editor" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "13px 36px",
          background: "linear-gradient(135deg, #7c6cfc, #a78bfa)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
          boxShadow: "0 0 30px rgba(124, 108, 252, 0.5), 0 8px 24px rgba(0,0,0,0.3)",
          transition: "all 200ms ease",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 0 60px rgba(124,108,252,0.8), 0 12px 32px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(124,108,252,0.5), 0 8px 24px rgba(0,0,0,0.3)";
          }}
        >
          Open Editor →
        </Link>

      </div>

      <style>{`
        @keyframes blob-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </main>
  );
}
