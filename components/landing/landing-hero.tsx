"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function LandingHero() {
  const [typed, setTyped] = useState("");
  const [showAI, setShowAI] = useState(false);
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
    <main style={{ minHeight: "100vh", background: "#fafaf8", overflowX: "hidden" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", justifyContent: "space-between", padding: "16px 64px" }}>
        <div>Features Templates About</div>
        <div style={{ fontWeight: 700 }}>CollabCanvas</div>
        <div />
      </nav>

      {/* HERO */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          style={{ padding: 80 }}
        >
          <h1 style={{ fontSize: "3rem" }}>
            {typed}
            <span className="blink" />
          </h1>

          <p>A powerful collaborative editor</p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ padding: 16, background: "black", color: "white" }}
          >
            Start Creating
          </motion.button>

          {/* AI BUTTON */}
          <motion.button
            onClick={() => setShowAI(true)}
            whileHover={{ scale: 1.05 }}
            style={{ marginTop: 20 }}
          >
            ✨ Generate with AI
          </motion.button>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src="/hero-image.jpg" style={{ width: "100%" }} />
        </motion.div>
      </section>

      {/* TEMPLATES */}
      <section style={{ padding: 80 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 20 }}>
          {templates.map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.08 }}
              style={{ position: "relative", cursor: "pointer" }}
            >
              <img src={t.img} style={{ width: "100%" }} />

              {/* HOVER OVERLAY */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}
              >
                Use Template
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI MODAL */}
      {showAI && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{ background: "white", padding: 30, borderRadius: 12 }}>
            <h3>Generate Design</h3>
            <input placeholder="Type idea..." style={{ padding: 10, width: "100%" }} />
            <button onClick={() => setShowAI(false)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        .blink {
          display:inline-block;
          width:2px;
          height:1em;
          background:black;
          animation:blink 1s infinite;
        }
        @keyframes blink {
          50%{opacity:0}
        }
      `}</style>

    </main>
  );
}
