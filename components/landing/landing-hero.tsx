"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient, setSupabaseSessionPersistence } from "@/lib/supabase/client";

export function LandingHero() {
  const [typed, setTyped] = useState("");
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const fullText = "Design Without Limits";
  const startCreatingHref = currentUserEmail ? "/projects" : "/auth?next=%2Fprojects";

  function mapAuthError(raw: string | undefined) {
    const normalized = (raw || "").toLowerCase();

    if (normalized.includes("email rate limit exceeded") || normalized.includes("over_email_send_rate_limit")) {
      return "Too many verification emails were requested. Please wait a few minutes before trying again, or log in with an existing account.";
    }

    if (normalized.includes("invalid login credentials")) {
      return "Invalid email or password.";
    }

    return raw || "Authentication failed. Please try again.";
  }

  function validatePassword(value: string) {
    const rules = [
      { ok: value.length >= 8, message: "at least 8 characters" },
      { ok: /[a-z]/.test(value), message: "one lowercase letter" },
      { ok: /[A-Z]/.test(value), message: "one uppercase letter" },
      { ok: /\d/.test(value), message: "one number" },
      { ok: /[^A-Za-z0-9]/.test(value), message: "one special character" },
    ];

    return {
      ok: rules.every((rule) => rule.ok),
      missing: rules.filter((rule) => !rule.ok).map((rule) => rule.message),
    };
  }

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

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => {
      setCurrentUserEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const resetAuthFeedback = () => {
    setAuthError("");
    setAuthMessage("");
  };

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAuthFeedback();

    if (!supabase) {
      setAuthError("Authentication is unavailable. Please configure Supabase keys.");
      return;
    }

    if (authMode === "signup") {
      const passwordCheck = validatePassword(password);
      if (!firstName.trim() || !lastName.trim()) {
        setAuthError("Please enter both first name and last name.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      if (!passwordCheck.ok) {
        setAuthError(`Password must contain ${passwordCheck.missing.join(", ")}.`);
        return;
      }
    }

    setSupabaseSessionPersistence(rememberMe);
    setAuthLoading(true);

    if (authMode === "signup") {
      const signUpResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const signUpPayload = (await signUpResponse.json()) as {
        error?: string;
        session?: { access_token: string; refresh_token: string } | null;
        requiresEmailVerification?: boolean;
      };

      if (!signUpResponse.ok) {
        setAuthError(mapAuthError(signUpPayload.error || "Could not create account."));
      } else if (signUpPayload.session) {
        await supabase.auth.setSession(signUpPayload.session);
        setAuthMessage("Signup successful. You are now logged in.");
        setAuthModalOpen(false);
      } else if (signUpPayload.requiresEmailVerification) {
        setAuthMessage("Signup successful. Please verify your email before login.");
      } else {
        setAuthMessage("Signup successful.");
      }
    } else {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginPayload = (await loginResponse.json()) as {
        error?: string;
        session?: { access_token: string; refresh_token: string } | null;
      };

      if (!loginResponse.ok) {
        setAuthError(mapAuthError(loginPayload.error || "Could not log in."));
      } else {
        if (loginPayload.session) {
          await supabase.auth.setSession(loginPayload.session);
        }
        setAuthMessage("Login successful.");
        setAuthModalOpen(false);
      }
    }

    setAuthLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfileOpen(false);
  }

  const templates = [
    { img: "/template-invitation.jpg", label: "Invitation" },
    { img: "/template-business.jpg", label: "Business" },
    { img: "/template-poster.jpg", label: "Poster" },
    { img: "/template-presentation.jpg", label: "Presentation" },
    { img: "/template-social.jpg", label: "Social Media" },
  ];

  const featureCards = [
    {
      title: "Realtime Presence",
      desc: "Collaborate with live cursors, teammate activity, and instant updates while everyone edits together.",
      details:
        "Presence indicators keep your team aligned in real time with cursor trails, active-user signals, and awareness states that reduce collisions during fast-moving sessions.",
      tone: "#B78C5A",
      img: "/real_time.png",
      fallbackImg: "/hero-image.jpg",
    },
    {
      title: "Shared Workspaces",
      desc: "Access projects shared with you and collaborate across teams from one dashboard.",
      details:
        "The projects dashboard includes a dedicated Shared With Me flow backed by workspace share records, so collaborators can open and continue work instantly.",
      tone: "#9B734E",
      img: "/shared_workspaces.png",
      fallbackImg: "/shared_with_me.png",
    },
    {
      title: "Smart Layers",
      desc: "Manage complex scenes with groups, hierarchy controls, locking, and selective visibility.",
      details:
        "Layer tools are built for dense canvases: quickly isolate objects, reorder structure with precision, and maintain clean composition while collaborating.",
      tone: "#D2A267",
      img: "/smart_layer.png",
      fallbackImg: "/template-poster.jpg",
    },
    {
      title: "Export Studio",
      desc: "Deliver polished outputs in PNG, JPEG, and PDF with production-ready quality.",
      details:
        "Export workflows support fast handoff from ideation to delivery, helping your team package assets and present design outcomes without friction.",
      tone: "#A58055",
      img: "/export.png",
      fallbackImg: "/design_studio.png",
    },
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
        <Link href="/" style={{
          fontSize: 22, fontWeight: 700, color: "#1a1a1a",
          letterSpacing: "-0.02em",
          fontStyle: "italic",
          textDecoration: "none",
        }}>
          CollabCanvas
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 24, color: "#6b6560" }}>
          <span
            style={{ cursor: "pointer", transition: "color 150ms", fontSize: 14 }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#6b6560"}
          >
            Templates
          </span>
          <span
            style={{ cursor: "pointer", transition: "color 150ms", fontSize: 14 }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#6b6560"}
          >
            About
          </span>

          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid #d7d0c8",
                background: "#fff",
                padding: 0,
                overflow: "hidden",
                cursor: "pointer",
              }}
              aria-label="Open profile menu"
            >
              <img src="/account.png" alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>

            {profileOpen && (
              <div className="cc-profile-menu">
                {currentUserEmail ? (
                  <>
                    <p className="cc-profile-user">{currentUserEmail}</p>
                    <Link href="/profile" className="cc-profile-action" onClick={() => setProfileOpen(false)}>
                      Profile
                    </Link>
                    <button type="button" className="cc-profile-action" onClick={() => void handleSignOut()}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="cc-profile-action"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthModalOpen(true);
                        setProfileOpen(false);
                        resetAuthFeedback();
                      }}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className="cc-profile-action cc-profile-primary"
                      onClick={() => {
                        setAuthMode("signup");
                        setAuthModalOpen(true);
                        setProfileOpen(false);
                        resetAuthFeedback();
                      }}
                    >
                      Signup
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
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
            <Link href={startCreatingHref} style={{
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
        </div>
      </section>

      {/* ── UTILITIES FLASHCARDS ── */}
      <section style={{
        padding: "56px 80px 28px",
        background: "#fafaf8",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: 20,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#1f1a16",
          }}>
            Why CollabCanvas?
          </h3>
        </div>

        <div className="cc-utility-grid">
          {featureCards.map((card, idx) => (
            <article
              className="cc-utility-card"
              key={card.title}
              style={{ borderColor: `${card.tone}4d` }}
              onClick={() => setActiveFeature(idx)}
            >
              <div className="cc-utility-thumb-wrap">
                <img
                  src={card.img}
                  alt={card.title}
                  className="cc-utility-thumb"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src.includes(card.fallbackImg)) return;
                    img.src = card.fallbackImg;
                  }}
                />
                <span className="cc-utility-thumb-glow" style={{ background: `${card.tone}66` }} />
              </div>
              <div className="cc-utility-content">
                <span className="cc-utility-dot" style={{ background: card.tone }} />
                <h4>{card.title}</h4>
                <p>{card.desc}</p>
              </div>
            </article>
          ))}
        </div>

        {activeFeature !== null && (
          <div className="cc-popup-overlay" onClick={() => setActiveFeature(null)}>
            <article className="cc-popup-card" onClick={(e) => e.stopPropagation()}>
              <button
                className="cc-popup-close"
                onClick={() => setActiveFeature(null)}
                aria-label="Close card details"
              >
                ×
              </button>
              <img
                src={featureCards[activeFeature].img}
                alt={featureCards[activeFeature].title}
                className="cc-popup-image"
              />
              <div className="cc-popup-content">
                <h4>{featureCards[activeFeature].title}</h4>
                <p>{featureCards[activeFeature].details}</p>
              </div>
            </article>
          </div>
        )}

        {authModalOpen && (
          <div className="cc-auth-overlay" onClick={() => setAuthModalOpen(false)}>
            <article className="cc-auth-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cc-auth-tabs">
                <button
                  type="button"
                  className={`cc-auth-tab ${authMode === "login" ? "is-active" : ""}`}
                  onClick={() => {
                    setAuthMode("login");
                    resetAuthFeedback();
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`cc-auth-tab ${authMode === "signup" ? "is-active" : ""}`}
                  onClick={() => {
                    setAuthMode("signup");
                    resetAuthFeedback();
                  }}
                >
                  Signup
                </button>
              </div>

              <form className="cc-auth-form" onSubmit={(e) => void handleAuthSubmit(e)}>
                {authMode === "signup" && (
                  <div className="cc-auth-name-grid">
                    <input
                      className="cc-auth-input"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      autoComplete="given-name"
                    />
                    <input
                      className="cc-auth-input"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      autoComplete="family-name"
                    />
                  </div>
                )}
                <input
                  className="cc-auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  required
                />
                <input
                  className="cc-auth-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  required
                />

                {authMode === "signup" && (
                  <input
                    className="cc-auth-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                )}

                {authMode === "signup" && (
                  <div className="cc-auth-rules">
                    <p className="cc-auth-rules-title">Password requirements</p>
                    <ul className="cc-auth-rules-list">
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                      <li>One special character</li>
                    </ul>
                  </div>
                )}

                <label className="cc-auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                {authError && <p className="cc-auth-error">{authError}</p>}
                {!authError && authMessage && <p className="cc-auth-message">{authMessage}</p>}

                <button className="cc-auth-submit" type="submit" disabled={authLoading}>
                  {authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Create account"}
                </button>

              </form>
            </article>
          </div>
        )}
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
        <Link href={startCreatingHref} style={{
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

        .cc-profile-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 180px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e4ddd4;
          border-radius: 12px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.14);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 130;
        }

        .cc-profile-user {
          margin: 0;
          padding: 10px 10px 8px;
          font-size: 12px;
          color: #6b6560;
          font-family: 'Helvetica Neue', sans-serif;
          border-bottom: 1px solid #efe9e1;
          word-break: break-all;
        }

        .cc-profile-action {
          border: 0;
          background: #f7f3ee;
          color: #2d2823;
          padding: 10px 12px;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          font-family: 'Helvetica Neue', sans-serif;
        }

        .cc-profile-primary {
          background: #1a1a1a;
          color: #fff;
        }

        .cc-auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 14, 11, 0.55);
          backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          z-index: 220;
          padding: 20px;
        }

        .cc-auth-modal {
          width: min(430px, 100%);
          border-radius: 18px;
          border: 1px solid #d6c7b4;
          background: linear-gradient(165deg, #fff, #f5f1eb);
          padding: 18px;
          box-shadow: 0 24px 42px rgba(0, 0, 0, 0.24);
        }

        .cc-auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }

        .cc-auth-tab {
          border: 1px solid #dbd1c6;
          border-radius: 10px;
          background: #fff;
          padding: 9px 12px;
          cursor: pointer;
          font-size: 13px;
          font-family: 'Helvetica Neue', sans-serif;
          color: #4b443d;
        }

        .cc-auth-tab.is-active {
          background: #1a1a1a;
          border-color: #1a1a1a;
          color: #fff;
        }

        .cc-auth-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cc-auth-name-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .cc-auth-input {
          width: 100%;
          border: 1px solid #ddd2c5;
          border-radius: 10px;
          padding: 11px 12px;
          background: #fff;
          color: #211d1a;
          font-size: 14px;
          font-family: 'Helvetica Neue', sans-serif;
        }

        .cc-auth-error {
          margin: 2px 0;
          color: #b13e3e;
          font-size: 12px;
          font-family: 'Helvetica Neue', sans-serif;
        }

        .cc-auth-remember {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #4b443d;
          font-size: 12px;
          font-family: 'Helvetica Neue', sans-serif;
          margin-top: 2px;
        }

        .cc-auth-remember input {
          width: 14px;
          height: 14px;
          accent-color: #1a1a1a;
        }

        .cc-auth-message {
          margin: 2px 0;
          color: #2f6e4f;
          font-size: 12px;
          font-family: 'Helvetica Neue', sans-serif;
        }

        .cc-auth-rules {
          border-radius: 10px;
          border: 1px solid #e3d7c7;
          background: #faf6f1;
          color: #6a6257;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.6;
          font-family: 'Helvetica Neue', sans-serif;
        }

        .cc-auth-rules-title {
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 600;
          color: #4f453b;
        }

        .cc-auth-rules-list {
          margin: 0;
          padding-left: 16px;
          list-style: disc;
        }

        .cc-auth-rules-list li {
          margin: 0;
        }

        .cc-auth-submit {
          border: 0;
          border-radius: 10px;
          background: #1a1a1a;
          color: #fff;
          padding: 11px 14px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Helvetica Neue', sans-serif;
        }

        .cc-auth-submit:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .cc-utility-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .cc-utility-card {
          cursor: pointer;
          position: relative;
          width: 100%;
          min-height: 312px;
          border-radius: 20px;
          border: 1px solid #ccb18f5e;
          background: #0b0b0b;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -28px 40px rgba(0,0,0,0.18), 0 18px 34px rgba(27,20,15,0.18);
          overflow: hidden;
          transition: transform 260ms ease, box-shadow 260ms ease;
        }

        .cc-utility-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -30px 44px rgba(0,0,0,0.22), 0 24px 42px rgba(27,20,15,0.24);
        }

        .cc-utility-thumb-wrap {
          position: relative;
          height: 168px;
          overflow: hidden;
        }

        .cc-utility-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.01);
          transition: transform 280ms ease;
        }

        .cc-utility-card:hover .cc-utility-thumb {
          transform: scale(1.06);
        }

        .cc-utility-thumb-glow {
          position: absolute;
          inset: auto -30% -36% -30%;
          height: 130px;
          filter: blur(24px);
          pointer-events: none;
        }

        .cc-utility-content {
          padding: 16px 16px 18px;
          text-align: left;
          background: #090909;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .cc-utility-content h4 {
          margin: 0;
          font-size: 16px;
          font-family: 'Helvetica Neue', sans-serif;
          color: #f8ecda;
          letter-spacing: 0;
        }

        .cc-utility-content p {
          margin: 10px 0 0;
          font-size: 13px;
          line-height: 1.6;
          font-family: 'Helvetica Neue', sans-serif;
          color: rgba(243,231,214,0.8);
        }

        .cc-utility-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
          margin-bottom: 10px;
          box-shadow: 0 0 16px rgba(255,255,255,0.4);
        }

        .cc-popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(16, 13, 10, 0.52);
          backdrop-filter: blur(6px);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          z-index: 180;
          animation: ccFadeIn 240ms ease;
        }

        .cc-popup-card {
          position: relative;
          width: min(760px, 100%);
          border-radius: 22px;
          overflow: hidden;
          background: linear-gradient(165deg, rgba(255,255,255,0.28), rgba(255,255,255,0.1) 30%, rgba(20,16,13,0.94) 100%);
          border: 1px solid rgba(219,187,146,0.34);
          box-shadow: 0 34px 58px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.24);
          animation: ccPopIn 300ms cubic-bezier(.2,.75,.2,1);
          transform-origin: center;
        }

        .cc-popup-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 999px;
          background: rgba(26,21,16,0.66);
          color: #efe3d1;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          z-index: 1;
        }

        .cc-popup-image {
          width: 100%;
          height: 280px;
          object-fit: cover;
          display: block;
        }

        .cc-popup-content {
          padding: 24px 24px 28px;
        }

        .cc-popup-content h4 {
          margin: 0 0 10px;
          font-size: 26px;
          font-weight: 700;
          color: #f6e9d8;
          letter-spacing: -0.02em;
        }

        .cc-popup-content p {
          margin: 0;
          font-size: 15px;
          line-height: 1.8;
          color: rgba(242,230,214,0.86);
          font-family: 'Helvetica Neue', sans-serif;
        }

        @keyframes ccFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ccPopIn {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(14px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 980px) {
          nav {
            padding: 14px 20px !important;
          }

          .cc-utility-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cc-popup-image {
            height: 220px;
          }
        }

        @media (max-width: 640px) {
          nav {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 10px;
          }

          .cc-utility-grid {
            grid-template-columns: 1fr;
          }

          .cc-utility-card {
            min-height: 294px;
          }

          .cc-popup-content h4 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}
