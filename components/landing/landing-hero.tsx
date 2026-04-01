"use client";

import Link from "next/link";

export function LandingHero() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(circle at 20% 20%, #1a1f3a, #0a0a0a 60%)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow Effect */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(124,108,252,0.25), transparent 70%)",
          filter: "blur(80px)",
          top: "10%",
          left: "20%",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(700px, 100%)",
          background: "rgba(26, 26, 26, 0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "60px 50px",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(124,108,252,0.15)",
        }}
      >
        {/* Tag */}
        <p
          style={{
            fontSize: 11,
            color: "#6b6b6b",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 16,
          }}
        >
          Internship Project
        </p>

        {/* Heading */}
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#f5f5f5",
            letterSpacing: "-0.04em",
            marginBottom: 16,
          }}
        >
          Collaborative Canvas Editor
        </h1>

        {/* Subtext */}
        <p
          style={{
            color: "#9a9a9a",
            lineHeight: 1.8,
            fontSize: 15,
            marginBottom: 36,
          }}
        >
          A modern Figma/Canva-style editor with real-time collaboration,
          shared state management, and smooth canvas rendering.
        </p>

        {/* CTA BUTTON (GOES TO DASHBOARD) */}
        <Link
          href="/projects-dashboard"
          style={{
            padding: "12px 32px",
            background: "linear-gradient(135deg, #7c6cfc, #5a4df0)",
            color: "#fff",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            display: "inline-block",
            boxShadow: "0 10px 30px rgba(124,108,252,0.4)",
            transition: "all 0.2s ease",
          }}
        >
          Open Dashboard →
        </Link>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 50,
            paddingTop: 30,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {[
            { value: "3+", label: "Branches" },
            { value: "7+", label: "Actions" },
            { value: "Realtime", label: "Canvas" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "#7c6cfc",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}