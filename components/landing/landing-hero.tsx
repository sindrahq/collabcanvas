"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { LandingFeatureCards } from "@/components/landing/landing-feature-cards";
import { FeatureGridAnimated } from "@/components/landing/feature-grid-animated";
import { FeatureComparisonTable } from "@/components/landing/feature-comparison-table";
import { PastelBlobBackground } from "@/components/landing/pastel-blob-background";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { FallingPetals } from "@/components/landing/falling-petals";
import { TiltImage } from "@/components/landing/tilt-image";
import { AccumulatedPetals } from "@/components/landing/accumulated-petals";

type SectionId = "features" | "templates" | "about";

type TemplateItem = {
  img: string;
  label: string;
  query: string;
};

const templates: TemplateItem[] = [
  { img: "/invitation-template.png", label: "Invitation", query: "invitation" },
  { img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop", label: "Business", query: "business" },
  { img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop", label: "Poster", query: "poster" },
  { img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop", label: "Presentation", query: "presentation" },
  { img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop", label: "Social Media", query: "social-media" },
];

export function LandingHero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const fullText = useMemo(() => "Design Without Limits", []);

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
      {/* Full Cherry Blossom Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-[0]"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1522228115018-d838bcce5c38?q=80&w=2500&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      {/* Soft overlay to ensure buttons and content are readable over the floral background */}
      <div 
        className="fixed inset-0 pointer-events-none bg-white/50 backdrop-blur-[2px] z-[1]" 
      />
      
      <div className="relative z-10">
        <PastelBlobBackground />
        <CustomCursor />
        <FallingPetals />
        
        {/* Floating Navbar */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[min(90%,1200px)]">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-6 py-3 rounded-2xl border border-black/[0.03] bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold tracking-tight italic flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4E6F1] to-[#FADBD8] flex items-center justify-center text-xs not-italic">CC</span>
              CollabCanvas
            </div>
            
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
            <Link
              href="/projects"
              className="hidden sm:inline-flex items-center justify-center h-10 px-6 rounded-xl text-white text-sm font-bold shadow-lg shadow-[#D3A5B1]/30 transition-all hover:scale-[1.05]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Open App
            </Link>
            <button 
              className="md:hidden p-2 text-[#636E72]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.div>

        {/* Mobile Menu */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-black/[0.03] text-xs font-semibold text-[#8b7355] mb-6">
              <Sparkles size={14} className="text-[#D4B595]" />
              Real-time Design Collaboration
            </div>
            
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
            {/* Decorative elements */}
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
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Kickstart with templates</h2>
              <p className="text-[#636E72]">Pick a starting point and make it yours.</p>
            </div>
            <Link href="/projects" className="hidden sm:flex items-center gap-2 font-bold text-[#8b7355] hover:gap-3 transition-all">
              Browse All <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {templates.map((template, idx) => (
              <motion.div
                key={template.label}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  href={`/projects?template=${template.query}`}
                  className="group block rounded-3xl overflow-hidden bg-white border border-black/[0.03] shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={template.img}
                      alt={template.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="font-bold text-sm">{template.label}</span>
                    <ArrowRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
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
      <AccumulatedPetals />
      </div>
    </main>
  );
}

