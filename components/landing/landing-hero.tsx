"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const stats = [
  { value: "03", label: "Feature branches" },
  { value: "07", label: "Editor actions" },
  { value: "Live", label: "Canvas prototype" }
];

const cards = [
  "Structured workspace state",
  "Real Konva-driven element rendering",
  "Selection, transform, and export flow"
];

export function LandingHero() {
  return (
    <main className="landing-shell">
      <div className="landing-ambient landing-ambient-one" />
      <div className="landing-ambient landing-ambient-two" />

      <motion.section
        className="landing-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="landing-grid">
          <div>
            <p className="eyebrow">Assignment Workspace</p>
            <h1>Collaborative Canvas Editor</h1>
            <p className="landing-copy">
              A polished frontend workspace for building a simplified Canva or Figma-style editor
              with shared state, live canvas rendering, keyboard shortcuts, and a branch-based
              implementation flow.
            </p>

            <div className="landing-actions">
              <Link href="/editor" className="primary-link">
                Open Editor Workspace
              </Link>
              <span className="landing-note">Current focus: canvas engine plus editor UX polish</span>
            </div>
          </div>

          <motion.aside
            className="landing-panel"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            <div className="landing-chip">Frontend milestone</div>
            <div className="landing-stat-row">
              {stats.map((item, index) => (
                <motion.article
                  key={item.label}
                  className="landing-stat"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.08, duration: 0.35 }}
                >
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </motion.article>
              ))}
            </div>

            <div className="landing-mini-canvas">
              {cards.map((label, index) => (
                <motion.div
                  key={label}
                  className={`mini-canvas-card mini-canvas-card-${index + 1}`}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 + index * 0.1, duration: 0.4 }}
                >
                  {label}
                </motion.div>
              ))}
            </div>
          </motion.aside>
        </div>
      </motion.section>
    </main>
  );
}
