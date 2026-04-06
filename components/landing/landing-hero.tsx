"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export function LandingHero() {
  const [typed, setTyped] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullText = "Collaborative Canvas Editor";

  // Typewriter
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
        i++;
      } else clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  // Mouse spotlight
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Particle stars
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

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.9 + 0.2,
      speed: Math.random() * 0.3 + 0.05,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleDir: 1,
    }));

    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.opacity += s.twinkleSpeed * s.twinkleDir;
        if (s.opacity > 0.9 || s.opacity < 0.1) s.twinkleDir *= -1;

        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#c4a77b";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        s.y -= s.speed;
        if (s.y < -5) {
          s.y = canvas.height + 5;
          s.x = Math.random() * canvas.width;
        }
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
      display: "flex",
      flexDirection: "column",
      background: "radial-gradient(ellipse at 20% 30%, #2b2319 0%, #14110e 42%, #080706 100%)",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Particle stars canvas */}
      <canvas ref={canvasRef} style={{
        position: "absolute", inset: 0,
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Mouse spotlight */}
      <div style={{
        position: "fixed",
        left: mousePos.x - 200,
        top: mousePos.y - 200,
        width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(196,167,123,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 1,
        transition: "left 0.1s ease, top 0.1s ease",
      }} />

      {/* Glow blobs */}
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(196,167,123,0.16) 0%, transparent 70%)",
        top: "-20%", left: "-5%", pointerEvents: "none", zIndex: 0,
        animation: "blob-float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(140,116,84,0.18) 0%, transparent 70%)",
        bottom: "-15%", right: "-5%", pointerEvents: "none", zIndex: 0,
        animation: "blob-float 10s ease-in-out infinite reverse",
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(196,167,123,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(196,167,123,0.045) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Hero content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 24px", position: "relative", zIndex: 2, textAlign: "center",
      }}>

        {/* Logo */}
        <div style={{
          fontSize: 15, fontWeight: 800, letterSpacing: "0.15em",
          textTransform: "uppercase",
          background: "linear-gradient(135deg, #f1ddbe, #c8a676, #8b6e4a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: 32,
        }}>CollabCanvas</div>

        {/* Typewriter title */}
        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 900,
          background: "linear-gradient(135deg, #fff7ea 0%, #e5ccaa 45%, #b99266 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.04em", lineHeight: 1.1,
          marginBottom: 20, maxWidth: "750px",
          minHeight: "1.2em",
        }}>
          {typed}
          <span style={{
            display: "inline-block", width: 3, height: "0.85em",
            background: "#c8a676", marginLeft: 3, verticalAlign: "middle",
            animation: "blink 1s step-end infinite",
          }} />
        </h1>

        {/* Subtext */}
        <p style={{
          color: "rgba(255,255,255,0.38)", lineHeight: 1.8, fontSize: 16,
          maxWidth: 480, marginBottom: 48,
        }}>
          A modern Figma/Canva-style editor with real-time collaboration,
          shared state management, and cloud-powered persistence.
        </p>

        {/* CTA Button */}
        <Link href="/projects" style={{
  padding: "14px 44px", borderRadius: 12, fontWeight: 700, fontSize: 16,
  background: "linear-gradient(145deg, #1b1713, #2a2218)",
  color: "#f4e6cf",
  border: "1px solid rgba(200,166,118,0.45)",
  boxShadow: "0 0 42px rgba(200,166,118,0.26)",
  transition: "all 200ms", textDecoration: "none",
  display: "inline-block", marginBottom: 64,
  outline: "2px solid transparent",
  animation: "neon-border 2s ease-in-out infinite",
}}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 0 72px rgba(200,166,118,0.42)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 0 42px rgba(200,166,118,0.26)";
          }}
        >
          Open Dashboard →
        </Link>

        {/* Scrolling Marquee */}
        <div style={{
          width: "100%", overflow: "hidden",
          marginBottom: 64,
          maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        }}>
          <div style={{
            display: "flex", gap: 40,
            animation: "marquee 20s linear infinite",
            width: "max-content",
          }}>
            {[...Array(3)].map((_, repeat) => (
              <div key={repeat} style={{ display: "flex", gap: 40, alignItems: "center" }}>
                {[
                  "Real-time Canvas",
                  "Zustand State",
                  "Supabase Sync",
                  "Konva Engine",
                  "8 Shape Types",
                  "Inspector Panel",
                  "Layer System",
                  "Auto Save",
                  "Dark Theme",
                  "Collaborative",
                ].map((text) => (
                  <div key={text} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    color: "rgba(255,255,255,0.25)", fontSize: 13,
                    fontWeight: 500, whiteSpace: "nowrap",
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "#c8a676", display: "inline-block",
                      boxShadow: "0 0 6px #c8a676",
                    }} />
                    {text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Utilities flashcards */}
        <section style={{ width: "100%", maxWidth: 980, marginBottom: 56 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            color: "rgba(255,255,255,0.78)",
            fontSize: 13,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}>
            <span>CanvasCollab Utilities</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Hover to reveal</span>
          </div>

          <div className="cc-flashcards-grid">
            {[
              {
                front: "Realtime Presence",
                back: "See collaborators live with cursor and activity signals across the same board.",
                tone: "#c8a676",
              },
              {
                front: "Version History",
                back: "Jump between snapshots and recover ideas without breaking current progress.",
                tone: "#a88961",
              },
              {
                front: "Smart Layers",
                back: "Reorder, lock, hide, and organize complex scenes with precision controls.",
                tone: "#d0a46a",
              },
              {
                front: "Export Studio",
                back: "Ship boards as PNG, JPEG, or PDF with sharp fidelity and clean layout.",
                tone: "#8f7450",
              },
            ].map((card) => (
              <article className="cc-flashcard" key={card.front}>
                <div className="cc-flashcard-inner">
                  <div className="cc-flashcard-face cc-flashcard-front" style={{ borderColor: `${card.tone}45` }}>
                    <span className="cc-flashcard-dot" style={{ background: card.tone }} />
                    <h3>{card.front}</h3>
                  </div>
                  <div className="cc-flashcard-face cc-flashcard-back" style={{ borderColor: `${card.tone}60` }}>
                    <p>{card.back}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16, maxWidth: 780, width: "100%",
        }}>
          {[
            { icon: "🎨", title: "Live Canvas", desc: "Real-time Konva-powered rendering with drag, resize and transform", color: "#b08a5a" },
            { icon: "⚡", title: "Instant Sync", desc: "Supabase-powered autosave keeps your work safe in the cloud", color: "#8f7450" },
            { icon: "🤝", title: "Collaborate", desc: "Work together with your team in real-time on the same canvas", color: "#d0a46a" },
            { icon: "🔷", title: "8 Shape Types", desc: "Rectangle, Circle, Star, Arrow, Diamond, Triangle and more", color: "#a88961" },
            { icon: "🔍", title: "Inspector Panel", desc: "Fine-tune colors, opacity, position and size of every element", color: "#c8a676" },
            { icon: "📋", title: "Layer System", desc: "Manage, reorder, lock and toggle visibility of all your layers", color: "#937757" },
          ].map((card) => (
            <div key={card.title} style={{
              background: "rgba(8, 8, 20, 0.7)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${card.color}18`,
              borderRadius: 14, padding: "20px 18px",
              textAlign: "left", transition: "all 200ms",
              cursor: "default",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${card.color}45`;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 35px ${card.color}18`;
                e.currentTarget.style.background = "rgba(12, 12, 28, 0.85)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${card.color}18`;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "rgba(8, 8, 20, 0.7)";
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${card.color}18`,
                border: `1px solid ${card.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, marginBottom: 12,
              }}>{card.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <p style={{
          marginTop: 48, fontSize: 12,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "0.05em",
        }}>
          © 2026 CollabCanvas — Internship Project
        </p>
      </div>

      <style>{`
        @keyframes blob-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-25px) scale(1.04); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
          @keyframes neon-border {
  0%, 100% {
    box-shadow: 0 0 40px rgba(200,166,118,0.35), 0 0 0 2px #c8a676, 0 0 16px #c8a676, 0 0 34px #8b6e4a;
  }
  50% {
    box-shadow: 0 0 62px rgba(139,110,74,0.45), 0 0 0 2px #8b6e4a, 0 0 24px #8b6e4a, 0 0 46px #c8a676;
  }
}

        .cc-flashcards-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .cc-flashcard {
          perspective: 1200px;
          min-height: 136px;
        }

        .cc-flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 136px;
          transform-style: preserve-3d;
          transition: transform 360ms ease;
        }

        .cc-flashcard:hover .cc-flashcard-inner {
          transform: rotateY(180deg) translateY(-2px);
        }

        .cc-flashcard-face {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          border: 1px solid rgba(200, 166, 118, 0.38);
          background: linear-gradient(145deg, rgba(26, 21, 16, 0.82), rgba(16, 13, 10, 0.84));
          backdrop-filter: blur(12px);
          padding: 14px 14px 12px;
          backface-visibility: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 28px rgba(0,0,0,0.24);
          text-align: left;
        }

        .cc-flashcard-front {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 10px;
        }

        .cc-flashcard-front h3 {
          margin: 0;
          font-size: 14px;
          color: rgba(255,255,255,0.92);
          letter-spacing: 0.02em;
        }

        .cc-flashcard-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          box-shadow: 0 0 12px currentColor;
        }

        .cc-flashcard-back {
          transform: rotateY(180deg);
          display: flex;
          align-items: center;
        }

        .cc-flashcard-back p {
          margin: 0;
          font-size: 12px;
          line-height: 1.55;
          color: rgba(255,255,255,0.72);
        }

        @media (max-width: 980px) {
          .cc-flashcards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .cc-flashcards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}