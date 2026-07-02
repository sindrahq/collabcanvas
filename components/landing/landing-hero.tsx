"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Palette, ChevronDown, Search } from "lucide-react";
import { LandingFeatureCards } from "@/components/landing/landing-feature-cards";
import { FeatureGridAnimated } from "@/components/landing/feature-grid-animated";
import { FeatureComparisonTable } from "@/components/landing/feature-comparison-table";
import { PastelBlobBackground } from "@/components/landing/pastel-blob-background";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { FallingPetals } from "@/components/landing/falling-petals";
import { TiltImage } from "@/components/landing/tilt-image";
import { AccumulatedPetals } from "@/components/landing/accumulated-petals";
import { useGlobalThemeStore, THEME_BACKGROUNDS } from "@/store/globalThemeStore";
import { createSupabaseBrowserClient, getSessionSafely } from "@/lib/supabase/client";
import type { CanvasTheme } from "@/store/workspaceStore";
import { builtInTemplates, templateCategories, type TemplateCategory, type BuiltInTemplate } from "@/lib/templates/builtInTemplates";
import TemplatePreview from "@/components/ui/TemplatePreview";

type SectionId = "features" | "templates" | "about";

export function LandingHero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<TemplateCategory>("All");
  const [templateSearch, setTemplateSearch] = useState("");
  const theme = useGlobalThemeStore((s) => s.theme);
  const setTheme = useGlobalThemeStore((s) => s.setTheme);
  const [logoHref, setLogoHref] = useState("/auth?next=%2Fprojects");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const fullText = useMemo(() => "Design Without Limits", []);
  const router = useRouter();

  const filteredTemplates = useMemo(() => {
    let list = builtInTemplates;
    if (activeTemplateCategory !== "All") {
      list = list.filter((t) => t.category === activeTemplateCategory);
    }
    if (templateSearch.trim()) {
      const q = templateSearch.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeTemplateCategory, templateSearch]);

  function handleUseTemplate(template: BuiltInTemplate) {
    const templateKey = `collabcanvas_new_template_${Date.now()}`;
    localStorage.setItem(templateKey, JSON.stringify({
      name: template.name,
      elements: template.elements,
    }));
    router.push(`/projects?templateKey=${templateKey}`);
  }

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void getSessionSafely(supabase).then((session) => {
      if (!active) return;
      setLogoHref(session?.user ? "/projects" : "/auth?next=%2Fprojects");
    });
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [fullText]);

  function scrollToSection(id: SectionId) {
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  }

  return (
    <main className="cc-landing-theme min-h-screen text-[#2D3436] font-sans selection:bg-[#F0C3D1] relative">
      <div
        className="fixed inset-0 pointer-events-none z-[0] transition-all duration-1000"
        style={{
          backgroundImage: `url(${THEME_BACKGROUNDS[theme] || THEME_BACKGROUNDS.cherry})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-white/50 backdrop-blur-[2px] z-[1]" />

      <div className="relative z-10">
        <PastelBlobBackground theme={theme} />
        <CustomCursor />
        <FallingPetals theme={theme} />

        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[min(90%,1200px)]">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between px-6 py-3 rounded-2xl border border-black/[0.03] bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center gap-8">
              <Link href={logoHref} className="text-xl font-bold tracking-tight italic flex items-center gap-2">
                CollabCanvas
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {["Features", "Templates", "About"].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase() as SectionId)}
                    className="text-sm font-medium text-[#636E72] hover:text-[#2D3436] transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-all hover:bg-black/[0.05]"
                  style={{ color: "var(--accent)" }}
                  onClick={() => setThemeMenuOpen((open) => !open)}
                >
                  <Palette size={16} />
                  <span className="hidden sm:inline">Theme</span>
                  <ChevronDown size={14} className={`transition-transform ${themeMenuOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {themeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 p-2 w-48 bg-white rounded-xl shadow-xl border border-black/[0.05] flex flex-col gap-1 z-50"
                    >
                      {[
                        { id: "cherry", label: "Cherry Blossom", color: "#D3A5B1" },
                        { id: "forest", label: "Forest Moss", color: "#708238" },
                        { id: "ocean", label: "Ocean Breeze", color: "#3b7bb8" },
                        { id: "sunset", label: "Sunset Dusk", color: "#d97d41" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/[0.03] ${theme === t.id ? "font-bold" : "font-medium"}`}
                          style={{ color: theme === t.id ? "var(--accent)" : "#2D3436" }}
                          onClick={() => {
                            setTheme(t.id as CanvasTheme);
                            setThemeMenuOpen(false);
                          }}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: t.color }} />
                          {t.label}
                          {theme === t.id && <span className="ml-auto text-[10px]">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link
                href="/projects"
                className="hidden sm:inline-flex items-center justify-center h-10 px-6 rounded-xl text-white text-sm font-bold shadow-lg shadow-[#D3A5B1]/30 transition-all hover:scale-[1.05]"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Open App
              </Link>
              <button className="md:hidden p-2 text-[#636E72]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </motion.div>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-4 p-4 rounded-2xl border border-black/[0.03] bg-white/90 backdrop-blur-2xl shadow-xl md:hidden"
              >
                <div className="flex flex-col gap-2">
                  {["Features", "Templates", "About"].map((item) => (
                    <button
                      key={item}
                      onClick={() => scrollToSection(item.toLowerCase() as SectionId)}
                      className="w-full text-left p-4 rounded-xl hover:bg-black/[0.02] text-sm font-semibold transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                  <div className="h-px bg-black/[0.03] my-2" />
                  <Link
                    href="/projects"
                    className="w-full p-4 rounded-xl text-white text-center text-sm font-bold"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    Open App
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 md:pt-48 md:pb-32 lg:pt-56 z-10">
          <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-[#2D3436] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                {typed}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1.5 h-[0.85em] bg-[#D4B595] ml-1 align-middle"
                />
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b7355] to-[#D4B595] italic">
                  Your Shared Canvas
                </span>
              </h1>
              <p className="text-lg md:text-xl text-[#636E72] leading-relaxed max-w-xl mb-10">
                Transform your creative workflow with a seamless, collaborative editor. Build, style, and ship together in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl text-white font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#D3A5B1]/40"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Start Designing
                  <ArrowRight size={20} />
                </Link>
                <button
                  onClick={() => scrollToSection("templates")}
                  className="h-14 px-8 rounded-2xl bg-white border border-black/[0.05] text-[#2D3436] font-bold text-lg transition-all hover:bg-black/[0.02]"
                >
                  View Templates
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative perspective-1000"
            >
              <TiltImage src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FADBD8] rounded-full blur-[60px] opacity-60" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#D5F5E3] rounded-full blur-[60px] opacity-60" />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <motion.section
          id="features"
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="py-24 px-6"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Everything you need</h2>
              <p className="text-[#636E72] text-lg">Powerful tools built for creative teams.</p>
            </div>
            <LandingFeatureCards />
          </div>
        </motion.section>

        {/* Templates Section */}
        <section id="templates" className="py-24 px-6 overflow-hidden">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h2 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Kickstart with templates</h2>
              <p className="text-[#636E72]">Pick a starting point and make it yours. Open any template to start editing in the app.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 text-[#8b7355]/40" size={16} />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#8b7355]/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#D3A5B1]/40 focus:ring-2 focus:ring-[#D3A5B1]/10 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {templateCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTemplateCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeTemplateCategory === cat
                        ? "bg-[#8b7355] text-white shadow-sm"
                        : "bg-white/60 text-[#8b7355] hover:bg-[#D3A5B1]/10 border border-[#8b7355]/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template, idx) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                >
                  <div
                    onClick={() => handleUseTemplate(template)}
                    className="group flex h-[360px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#8b7355]/10 bg-white/70 shadow-sm transition-all hover:border-[#D3A5B1]/40 hover:shadow-md sm:h-[380px]"
                  >
                    <div className="relative h-56 overflow-hidden bg-white/50 sm:h-60">
                      <TemplatePreview
                        elements={template.elements}
                        width={260}
                        height={240}
                        className="h-full w-full"
                      />
                      <span
                        className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/90 uppercase tracking-wider"
                        style={{ backgroundColor: template.color + "cc" }}
                      >
                        {template.category}
                      </span>
                      <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/30 flex items-center justify-center">
                        <span className="px-4 py-2 rounded-full bg-white text-[#2D3436] text-xs font-semibold opacity-0 shadow-lg transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
                          Open Template
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 items-end justify-between p-4">
                      <div>
                        <span className="font-bold text-sm text-[#2D3436]">{template.name}</span>
                        <p className="text-[11px] text-[#636E72]/70 mt-0.5">{template.elements.length} elements · Fully editable</p>
                      </div>
                      <ArrowRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm text-[#636E72]/50">No templates found. Try a different search or category.</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer / About */}
        <footer id="about" className="py-20 px-6 border-t border-black/[0.03]">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-[#D3A5B1]/30" style={{ backgroundColor: "var(--accent)" }}>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 relative z-10"> Ready to create <br /> something amazing? </h2>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center h-16 px-10 rounded-2xl bg-white font-bold text-xl transition-all hover:scale-[1.05] relative z-10"
                style={{ color: "var(--accent)" }}
              >
                Get Started Now
              </Link>
            </div>
            <div className="mt-20 flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-black/[0.03]">
              <div className="text-xl font-bold italic">CollabCanvas</div>
              <div className="flex gap-8 text-sm font-medium text-[#636E72]">
                <Link href="#" className="hover:text-black">Privacy</Link>
                <Link href="#" className="hover:text-black">Terms</Link>
                <Link href="#" className="hover:text-black">Contact</Link>
              </div>
              <div className="text-sm text-[#B2BEC3]">© 2026 CollabCanvas. All rights reserved.</div>
            </div>
          </div>
        </footer>
        <AccumulatedPetals theme={theme} />
      </div>
    </main>
  );
}
