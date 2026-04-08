"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingHero() {
  const [typed, setTyped] = useState("");
  const fullText = "Design Without Limits";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
        i++;
      } else clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const templates = [
    { img: "/template-invitation.jpg", label: "Invitation" },
    { img: "/template-business.jpg", label: "Business" },
    { img: "/template-poster.jpg", label: "Poster" },
    { img: "/template-presentation.jpg", label: "Presentation" },
    { img: "/template-social.jpg", label: "Social Media" },
  ];

  return (
    <main style={{
      minHeight: "100vh",
      background: "#fafaf8",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      overflowX: "hidden",
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 64px",
        background: "rgba(250,250,248,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8e4df",
      }}>
        {/* Left nav links */}
        <div style={{ display: "flex", gap: 32, fontSize: 14, color: "#6b6560" }}>
          {["Features", "Templates", "About"].map((item) => (
            <span key={item} style={{ cursor: "pointer", transition: "color 150ms" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#6b6560"}
            >{item}</span>
          ))}
        </div>

        {/* Center logo */}
        <div style={{
          fontSize: 22, fontWeight: 700, color: "#1a1a1a",
          letterSpacing: "-0.02em",
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          fontStyle: "italic",
        }}>CollabCanvas</div>

        {/* Empty right side to balance navbar */}
        <div style={{ width: 120 }} />
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "calc(100vh - 61px)",
        alignItems: "stretch",
      }}>
        {/* Left — Text */}
        <div style={{
          padding: "80px 64px 80px 80px",
          display: "flex", flexDirection: "column",
          justifyContent: "center",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 20,
            background: "#f0ede8", border: "1px solid #e0dbd4",
            fontSize: 12, color: "#7c7268", marginBottom: 28,
            width: "fit-content",
            fontFamily: "'Helvetica Neue', sans-serif",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf82", display: "inline-block" }} />
            Real-time Collaboration · Supabase Powered
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: "clamp(2.8rem, 5vw, 4rem)", fontWeight: 700,
            color: "#1a1a1a", letterSpacing: "-0.03em",
            lineHeight: 1.1, marginBottom: 20,
          }}>
            {typed}
            <span style={{
              display: "inline-block", width: 2, height: "0.85em",
              background: "#8b7355", marginLeft: 3,
              verticalAlign: "middle", animation: "blink 1s step-end infinite",
            }} />
            <br />
            <span style={{ color: "#8b7355", fontStyle: "italic" }}>Your Creative Canvas</span>
          </h1>

          {/* Description */}
          <p style={{
            color: "#7c7268", lineHeight: 1.75, fontSize: 16,
            marginBottom: 40, maxWidth: 420,
            fontFamily: "'Helvetica Neue', sans-serif",
          }}>
            A powerful Figma/Canva-style collaborative editor with
            real-time sync, smart layers, and beautiful design tools —
            built for modern creators.
          </p>

          {/* Single CTA button */}
          <div>
            <Link href="/projects" style={{
              padding: "14px 32px", borderRadius: 10,
              fontWeight: 600, fontSize: 15, background: "#1a1a1a",
              color: "#fff", textDecoration: "none",
              fontFamily: "'Helvetica Neue', sans-serif",
              transition: "all 200ms",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              display: "inline-block",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}
            >Start Creating →</Link>
          </div>
        </div>

        {/* Right — Image */}
        <div style={{ position: "relative", overflow: "hidden", background: "#f0ede8" }}>
          <img
            src="/hero-image.jpg"
            alt="Designer working"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
          />
          <div style={{
            position: "absolute", top: 32, right: 32,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)", borderRadius: 20,
            padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            fontSize: 12, color: "#3d3833",
            fontFamily: "'Helvetica Neue', sans-serif",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4caf82", display: "inline-block" }} />
            All changes saved
          </div>
        </div>
      </section>

      {/* ── TEMPLATES SECTION ── */}
      <section style={{ padding: "80px 80px 60px", background: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{
            fontSize: "2.5rem", fontWeight: 700,
            color: "#1a1a1a", letterSpacing: "-0.03em", marginBottom: 12,
          }}>Start with a template</h2>
          <p style={{ color: "#9c9690", fontSize: 16, fontFamily: "'Helvetica Neue', sans-serif" }}>
            Jump-start your creativity with ready-made designs
          </p>
        </div>

        {/* Templates Grid — 5 real images */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {templates.map((template, i) => (
            <div key={i} style={{
              borderRadius: 16, overflow: "hidden",
              cursor: "pointer", transition: "all 200ms",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid #e8e4df",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
            >
              {/* Real image */}
              <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                <img
                  src={template.img}
                  alt={template.label}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "center",
                    display: "block", transition: "transform 300ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                />
              </div>
              {/* Label */}
              <div style={{
                padding: "12px 14px", background: "#fff",
                fontSize: 13, color: "#3d3833",
                fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{template.label}</span>
                <span style={{ color: "#c4bfba", fontSize: 14 }}>→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Browse all button */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/projects" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 32px", borderRadius: 10,
            border: "1px solid #d4cfc9", color: "#3d3833",
            textDecoration: "none", fontSize: 14, fontWeight: 500,
            fontFamily: "'Helvetica Neue', sans-serif",
            background: "#fff", transition: "all 150ms",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f2ee"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >Browse all templates →</Link>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        margin: "60px 80px 80px",
        background: "#1a1a1a", borderRadius: 28,
        padding: "60px 80px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Ready to start designing?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, fontFamily: "'Helvetica Neue', sans-serif" }}>
            Join your team on CollabCanvas today.
          </p>
        </div>
        <Link href="/projects" style={{
          padding: "14px 36px", borderRadius: 12, fontWeight: 600, fontSize: 15,
          background: "#fff", color: "#1a1a1a", textDecoration: "none",
          fontFamily: "'Helvetica Neue', sans-serif", transition: "all 200ms", whiteSpace: "nowrap",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f2ee"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
        >Start Creating →</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "32px 80px", borderTop: "1px solid #e8e4df",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", background: "#fafaf8",
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, fontStyle: "italic", color: "#1a1a1a" }}>CollabCanvas</div>
        <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#9c9690", fontFamily: "'Helvetica Neue', sans-serif" }}>
          <span style={{ cursor: "pointer" }}>Privacy</span>
          <span style={{ cursor: "pointer" }}>Terms</span>
          <span style={{ cursor: "pointer" }}>Contact</span>
        </div>
        <p style={{ fontSize: 13, color: "#c4bfba", fontFamily: "'Helvetica Neue', sans-serif" }}>© 2026 CollabCanvas</p>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
          @keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(15px, -15px); }
}
  
      `}</style>
    </main>
  );
}
