"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const mockProjects = [
  { id: "1", title: "CollabCanvas UI Kit", emoji: "🎨", edited: "2h ago", color: "#2563eb" },
  { id: "2", title: "Inspector Panel Design", emoji: "🔍", edited: "5h ago", color: "#7c3aed" },
  { id: "3", title: "Layer System Mockup", emoji: "📐", edited: "Yesterday", color: "#10b981" },
  { id: "4", title: "Dark Theme Concepts", emoji: "🌙", edited: "3 days ago", color: "#f59e0b" },
  { id: "5", title: "Toolbar Redesign", emoji: "🛠️", edited: "4 days ago", color: "#ef4444" },
  { id: "6", title: "Supabase Schema", emoji: "🗄️", edited: "5 days ago", color: "#60a5fa" },
];

const sidebarItems = [
  { icon: "🗂️", label: "My Projects", key: "projects" },
  { icon: "👥", label: "Shared with Me", key: "shared" },
  { icon: "📋", label: "Templates", key: "templates" },
  { icon: "🗑️", label: "Trash", key: "trash" },
];

const pageContent: Record<string, { title: string; desc: string; empty: string }> = {
  projects: {
    title: "My Projects",
    desc: "Manage your creative workspace. Organize, collaborate, and bring your visions to life.",
    empty: "",
  },
  shared: {
    title: "Shared with Me",
    desc: "Projects that your teammates have shared with you.",
    empty: "No shared projects yet. Ask your teammates to share their work!",
  },
  templates: {
    title: "Templates",
    desc: "Start faster with pre-built design templates.",
    empty: "No templates available yet. Check back soon!",
  },
  trash: {
    title: "Trash",
    desc: "Deleted projects are kept here for 30 days.",
    empty: "Trash is empty. Deleted projects will appear here.",
  },
};

export default function ProjectsPage() {
  const [active, setActive] = useState("projects");
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();

  const filtered = mockProjects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const page = pageContent[active];

  return (
    <div className="projects-page" style={{ overflow: "hidden" }}>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowSettings(false)}>
          <div style={{
            background: "rgba(10,10,20,0.95)",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 16, padding: 32, width: "min(480px, 90vw)",
            boxShadow: "0 0 60px rgba(37,99,235,0.15)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 24,
            }}>
              <h2 style={{
                fontSize: 18, fontWeight: 700,
                background: "linear-gradient(135deg, #fff, #60a5fa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{
                fontSize: 18, color: "rgba(255,255,255,0.4)",
                cursor: "pointer", background: "none", border: "none",
              }}>✕</button>
            </div>

            {/* Settings sections */}
            {[
              { label: "Profile", icon: "👤", desc: "Manage your account details" },
              { label: "Appearance", icon: "🎨", desc: "Theme and display preferences" },
              { label: "Notifications", icon: "🔔", desc: "Control your alerts" },
              { label: "Integrations", icon: "🔗", desc: "Connect third-party tools" },
              { label: "Privacy", icon: "🔒", desc: "Manage data and permissions" },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", borderRadius: 8, cursor: "pointer",
                transition: "all 150ms", marginBottom: 4,
                border: "1px solid transparent",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(37,99,235,0.08)";
                  e.currentTarget.style.borderColor = "rgba(37,99,235,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.desc}</div>
                </div>
                <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontSize: 16 }}>›</span>
              </div>
            ))}

            <div style={{
              marginTop: 20, paddingTop: 20,
              borderTop: "1px solid rgba(37,99,235,0.1)",
              display: "flex", justifyContent: "flex-end",
            }}>
              <button onClick={() => setShowSettings(false)} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13,
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff", cursor: "pointer", border: "none", fontWeight: 600,
                boxShadow: "0 0 20px rgba(37,99,235,0.3)",
              }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="projects-sidebar">
        <div className="projects-sidebar-logo">CollabCanvas</div>

        {sidebarItems.map((item) => (
          <div
            key={item.key}
            className={`projects-sidebar-item${active === item.key ? " active" : ""}`}
            onClick={() => setActive(item.key)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ padding: "16px" }}>
          <Link href="/editor">
            <div className="btn-primary" style={{
              width: "100%", justifyContent: "center",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 16 }}>+</span> Create New
            </div>
          </Link>
        </div>

        {/* User */}
        <div style={{
          padding: "16px",
          borderTop: "1px solid rgba(37, 99, 235, 0.1)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
            boxShadow: "0 0 12px rgba(37,99,235,0.4)",
          }}>C</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Chetna</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Pro Plan</div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              fontSize: 15, color: "var(--text-muted)", cursor: "pointer",
              background: "none", border: "none", padding: 4, borderRadius: 4,
              transition: "color 150ms",
            }}
            title="Settings"
            onMouseEnter={(e) => e.currentTarget.style.color = "#60a5fa"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
          >⚙️</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="projects-main">
        {/* Top bar */}
        <div className="projects-topbar">
          <div>
            <h1 style={{
              fontSize: "2rem", fontWeight: 800,
              background: "linear-gradient(135deg, #ffffff, #60a5fa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", letterSpacing: "-0.03em", marginBottom: 4,
            }}>{page.title}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{page.desc}</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="projects-search">
              <span style={{ fontSize: 13 }}>🔍</span>
              <input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn-outline"
              onClick={() => setShowSettings(true)}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {active === "projects" ? (
          <div className="projects-grid">
            <Link href="/editor" style={{ textDecoration: "none" }}>
              <div className="project-card-new">
                <span style={{ fontSize: 32, color: "rgba(37,99,235,0.6)" }}>+</span>
                <span>Create New Project</span>
              </div>
            </Link>

            {filtered.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => router.push("/editor")}
              >
                <div className="project-card-thumb" style={{
                  background: `linear-gradient(135deg, ${project.color}22, #0a0a1f)`,
                }}>
                  <span style={{ fontSize: 40, position: "relative", zIndex: 1 }}>
                    {project.emoji}
                  </span>
                </div>
                <div className="project-card-info">
                  <div className="project-card-title">{project.title}</div>
                  <div className="project-card-meta">Edited {project.edited}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "60%", gap: 16, color: "var(--text-faint)",
          }}>
            <div style={{ fontSize: 48 }}>
              {active === "shared" ? "👥" : active === "templates" ? "📋" : "🗑️"}
            </div>
            <p style={{ fontSize: 14, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
              {page.empty}
            </p>
            {active === "shared" && (
              <button
                className="btn-primary"
                onClick={() => setActive("projects")}
                style={{ marginTop: 8 }}
              >
                Go to My Projects
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}