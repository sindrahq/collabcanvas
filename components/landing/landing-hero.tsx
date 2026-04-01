"use client";

import Link from "next/link";

export function LandingHero() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#111111",
      padding: "24px",
    }}>
      <div style={{
        width: "min(500px, 100%)",
        background: "#1a1a1a",
        border: "1px solid #2e2e2e",
        borderRadius: "16px",
        padding: "48px 40px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Internship Project
        </p>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.03em", marginBottom: 12 }}>
          Collaborative Canvas Editor
        </h1>

        <p style={{ color: "#888", lineHeight: 1.7, fontSize: 14, marginBottom: 32 }}>
          A Figma/Canva-style editor with live canvas rendering,
          shared Zustand state, and real-time collaboration.
        </p>

        <Link href="/editor" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 28px",
          background: "#7c6cfc",
          color: "#fff",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
          transition: "background 150ms",
        }}>
          Open Editor →
        </Link>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 40,
          paddingTop: 32,
          borderTop: "1px solid #2e2e2e",
        }}>
          {[
            { value: "3", label: "Branches" },
            { value: "7", label: "Actions" },
            { value: "Live", label: "Canvas" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f0f0f0" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}