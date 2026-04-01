"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function LandingHero() {
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

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "radial-gradient(ellipse at 20% 30%, #0a0a2e 0%, #050508 40%, #000000 100%)",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Glow blobs only - no floating shapes */}
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
        top: "-20%", left: "0%", pointerEvents: "none", zIndex: 0,
        animation: "blob-float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
        bottom: "-15%", right: "0%", pointerEvents: "none", zIndex: 0,
        animation: "blob-float 10s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
        top: "40%", right: "15%", pointerEvents: "none", zIndex: 0,
        animation: "blob-float 6s ease-in-out infinite",
      }} />

      {/* Navbar */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px",
        background: "rgba(5, 5, 15, 0.6)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(37, 99, 235, 0.1)",
      }}>
        <div style={{
          fontSize: 18, fontWeight: 800,
          background: "linear-gradient(135deg, #60a5fa, #2563eb, #7c3aed)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>CollabCanvas</div>

        <div style={{ display: "flex", gap: 32, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {["Features", "Templates", "Pricing", "Updates"].map((item) => (
            <span key={item} style={{ cursor: "pointer", transition: "color 150ms" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#60a5fa"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            >{item}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/projects" style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13,
            border: "1px solid rgba(37,99,235,0.3)", color: "rgba(255,255,255,0.6)",
            transition: "all 150ms",
          }}>Log in</Link>
          <Link href="/projects" style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#fff", boxShadow: "0 0 20px rgba(37,99,235,0.4)",
          }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 24px", position: "relative", zIndex: 1, textAlign: "center",
      }}>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 900,
          background: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #60a5fa 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16, maxWidth: "800px",
        }}>
          {typed}
          <span style={{
            display: "inline-block", width: 3, height: "0.85em",
            background: "#2563eb", marginLeft: 4, verticalAlign: "middle",
            animation: "blink 1s step-end infinite",
          }} />
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.4)", lineHeight: 1.8, fontSize: 16,
          maxWidth: 520, marginBottom: 40,
        }}>
          The most powerful tool to build real-time collaborative design experiences.
          Shared canvas state, live sync, and Supabase-powered persistence.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 60 }}>
          <Link href="/projects" style={{
            padding: "13px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#fff", boxShadow: "0 0 40px rgba(37,99,235,0.5)",
            transition: "all 200ms",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 0 60px rgba(37,99,235,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(37,99,235,0.5)";
            }}
          >
            Get Started →
          </Link>
          <Link href="/editor" style={{
            padding: "12px 32px", borderRadius: 10, fontWeight: 600, fontSize: 15,
            background: "transparent", color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(37,99,235,0.3)",
            transition: "all 200ms",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(37,99,235,0.6)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(37,99,235,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(37,99,235,0.3)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Open Editor
          </Link>
        </div>

        {/* Team */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          color: "rgba(255,255,255,0.3)", fontSize: 13,
        }}>
          <div style={{ display: "flex" }}>
            {[
              { name: "Chetna", color: "#2563eb" },
              { name: "Harsh", color: "#10b981" },
              { name: "Aaryan", color: "#7c3aed" },
            ].map((m, i) => (
              <div key={m.name} style={{
                width: 32, height: 32, borderRadius: "50%",
                background: `${m.color}33`,
                border: `2px solid ${m.color}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: m.color,
                marginLeft: i === 0 ? 0 : -8,
                boxShadow: `0 0 10px ${m.color}44`,
                zIndex: 3 - i,
                position: "relative",
              }}>{m.name[0]}</div>
            ))}
          </div>
          <span>Built by Chetna, Harsh & Aaryan</span>
        </div>
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
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
        }
      `}</style>
    </main>
  );
}