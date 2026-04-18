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
  aspectClass: string;
};

const templates: TemplateItem[] = [
  { img: "https://images.unsplash.com/photo-1544377193-33dce4d95d0c?q=80&w=1000&auto=format&fit=crop", label: "Invitation", query: "invitation", aspectClass: "aspect-[3/4]" },
  { img: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop", label: "Business", query: "business", aspectClass: "aspect-[1.58/1]" },
  { img: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=1000&auto=format&fit=crop", label: "Poster", query: "poster", aspectClass: "aspect-[3/4]" },
  { img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop", label: "Presentation", query: "presentation", aspectClass: "aspect-video" },
  { img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop", label: "Social Media", query: "social-media", aspectClass: "aspect-square" },
];

const TEMPLATE_DESIGNS: Record<string, string[]> = {
  "invitation": [
    "https://images.unsplash.com/photo-1544377193-33dce4d95d0c",
    "https://images.unsplash.com/photo-1510076857177-7470076d4098",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b",
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf"
  ],
  "business": [
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0",
    "https://images.unsplash.com/photo-1552664730-d307ca884978",
    "https://images.unsplash.com/photo-1553484771-047a44eee27b",
    "https://images.unsplash.com/photo-1558403194-611308249627",
    "https://images.unsplash.com/photo-1542744094-3a31f272c490",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    "https://images.unsplash.com/photo-1454165833767-131ef248c5de"
  ],
  "poster": [
    "https://images.unsplash.com/photo-1563298723-dcfebaa392e3",
    "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8",
    "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2",
    "https://images.unsplash.com/photo-1515462277126-2dd0c162007a",
    "https://images.unsplash.com/photo-1558655146-d09347e92766",
    "https://images.unsplash.com/photo-1483058712412-4245e9b90334",
    "https://images.unsplash.com/photo-1542626991-cbc4e32524cc",
    "https://images.unsplash.com/photo-1544928147-79a2dbc1f389"
  ],
  "presentation": [
    "https://images.unsplash.com/photo-1557804506-669a67965ba0",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    "https://images.unsplash.com/photo-1551434678-e076c223a692",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    "https://images.unsplash.com/photo-1551288049-bbbda536339a",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984",
    "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23"
  ],
  "social-media": [
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71",
    "https://images.unsplash.com/photo-1611605698335-8b156981043e",
    "https://images.unsplash.com/photo-1611606063065-ee7946f0787a",
    "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6",
    "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
    "https://images.unsplash.com/photo-1533750349088-cd871a92f312",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3"
  ]
};

export function LandingHero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
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
            <div className="mt-6" />
            
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
          <div className="mb-12">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Kickstart with templates</h2>
              <p className="text-[#636E72]">Pick a starting point and make it yours.</p>
            </div>
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
                <div
                  onClick={() => setSelectedTemplate(template)}
                  className="group block rounded-3xl overflow-hidden bg-white border border-black/[0.03] shadow-sm hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className={`${template.aspectClass} overflow-hidden bg-black/[0.02]`}>
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
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {selectedTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-[#D3A5B1]/10 backdrop-blur-xl"
                onClick={() => setSelectedTemplate(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_32px_64px_rgba(211,165,177,0.25)] border border-[#D3A5B1]/10 flex flex-col relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#FFF5F8] to-transparent pointer-events-none" />

                  <div className="p-8 md:p-12 pb-6 border-b border-[#D3A5B1]/10 flex items-center justify-between relative z-10">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-[#2D3436]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {selectedTemplate.label} Templates
                      </h3>
                      <p className="text-[#636E72] mt-2 text-lg">Select a beautifully crafted starting point.</p>
                    </div>
                    <button 
                      onClick={() => setSelectedTemplate(null)}
                      className="w-12 h-12 rounded-full bg-white border border-[#D3A5B1]/20 flex items-center justify-center text-[#D3A5B1] hover:bg-[#D3A5B1] hover:text-white transition-all hover:scale-105"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-[#FDFBFB]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                      {(TEMPLATE_DESIGNS[selectedTemplate.query] || []).map((imgUrl, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`group relative ${selectedTemplate.aspectClass} rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#D3A5B1]/30 transition-all duration-300 border border-black/[0.03] bg-white`}
                        >
                          <img src={`${imgUrl}?q=80&w=800&auto=format&fit=crop`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Link 
                              href={`/projects?template=${selectedTemplate.query}`}
                              className="bg-white text-[#D3A5B1] px-6 py-3 rounded-full text-sm font-bold shadow-xl scale-95 group-hover:scale-100 transition-transform hover:bg-[#FFF5F8]"
                            >
                              Use Design
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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

