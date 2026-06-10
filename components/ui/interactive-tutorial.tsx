"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Sparkles } from "lucide-react";

type Step = {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector of the element to highlight
  placement?: "top" | "bottom" | "left" | "right" | "center";
};

const TUTORIAL_STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to Canvas",
    description: "Let's take a quick tour of your new workspace.",
    placement: "center",
  },
  {
    id: "toolbar",
    title: "The Toolbar",
    description: "Here you can add shapes, text, images, and toggle the snapping grid.",
    targetSelector: ".editor-topbar",
    placement: "bottom",
  },
  {
    id: "canvas",
    title: "Canvas Area",
    description: "Drag, drop, and resize elements here. Right-click any element for more options.",
    targetSelector: ".canvas-stage-container",
    placement: "center",
  },
  {
    id: "sidebar",
    title: "Properties & History",
    description: "View your layers, adjust document settings, and undo/redo actions from the sidebar.",
    targetSelector: ".inspector-panel",
    placement: "left",
  },
];

export function InteractiveTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if it's the first visit or manual trigger
  useEffect(() => {
    const handleManualStart = () => {
      setHasShownPrompt(false);
      setIsActive(true);
      setCurrentStep(0);
    };

    window.addEventListener("start-tutorial", handleManualStart);

    const hasSeenTutorial = localStorage.getItem("canvas_tutorial_seen");
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!hasSeenTutorial) {
      timer = setTimeout(() => setHasShownPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener("start-tutorial", handleManualStart);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const step = TUTORIAL_STEPS[currentStep];
  const selectorCandidates = useMemo(
    () => step.targetSelector?.split(",").map((part) => part.trim()).filter(Boolean) ?? [],
    [step.targetSelector]
  );

  // Auto-open inspector sidebar when sidebar step is reached
  useEffect(() => {
    if (isActive && currentStep === 3 && step.id === "sidebar") {
      const event = new CustomEvent("tutorial-open-sidebar", { detail: { section: "inspector" } });
      window.dispatchEvent(event);
    }
  }, [isActive, currentStep, step.id]);

  useEffect(() => {
    if (!isActive || selectorCandidates.length === 0) {
      const raf = requestAnimationFrame(() => setTargetRect(null));
      return () => cancelAnimationFrame(raf);
    }

    let raf = 0;
    let observer: ResizeObserver | null = null;

    const getBestTarget = () => {
      const candidates = selectorCandidates
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .filter((node): node is HTMLElement => node instanceof HTMLElement)
        .map((node) => ({ node, rect: node.getBoundingClientRect() }))
        .filter(({ node, rect }) => {
          const style = window.getComputedStyle(node);
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
        });

      if (!candidates.length) return null;

      candidates.sort((a, b) => (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height));
      return candidates[0];
    };

    const createRect = (left: number, top: number, width: number, height: number) => {
      if (typeof DOMRect !== "undefined") {
        return new DOMRect(left, top, width, height);
      }
      return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
    };

    const getCanvasCenterRect = () => {
      const viewport = document.querySelector(".canvas-viewport");
      if (!(viewport instanceof HTMLElement)) return null;

      const rect = viewport.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      // Keep focus centered within the canvas viewport and avoid covering the entire workspace.
      const focusWidth = Math.max(260, Math.min(rect.width * 0.72, 1040));
      const focusHeight = Math.max(240, Math.min(rect.height * 0.78, 820));
      const centeredLeft = rect.left + (rect.width - focusWidth) / 2;
      const leftOffset = Math.min(rect.width * 0.115, 96);
      const left = Math.max(rect.left + 12, centeredLeft - leftOffset);
      const centeredTop = rect.top + (rect.height - focusHeight) / 2;
      const upwardOffset = Math.min(rect.height * 0.26, 176);
      const top = Math.max(rect.top + 12, centeredTop - upwardOffset);

      return createRect(left, top, focusWidth, focusHeight);
    };

    const updateRect = () => {
      if (step.id === "canvas") {
        setTargetRect(getCanvasCenterRect());
        return;
      }

      const match = getBestTarget();
      setTargetRect(match?.rect ?? null);

      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (match?.node && "ResizeObserver" in window) {
        observer = new ResizeObserver(() => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(updateRect);
        });
        observer.observe(match.node);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("orientationchange", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("orientationchange", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
    };
  }, [isActive, currentStep, selectorCandidates, step.id]);

  const handleStartTour = () => {
    setHasShownPrompt(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const handleSkipTour = () => {
    setHasShownPrompt(false);
    localStorage.setItem("canvas_tutorial_seen", "true");
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsActive(false);
    setHasShownPrompt(false);
    localStorage.setItem("canvas_tutorial_seen", "true");
  };

  // If we are showing the initial "Would you like a tour?" prompt
  if (hasShownPrompt) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#FAF9F6] border border-[#D3A5B1]/40 rounded-2xl p-8 shadow-2xl max-w-sm text-center"
        >
          <div className="w-16 h-16 bg-[#D3A5B1]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-[#D3A5B1]" size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">New here?</h2>
          <p className="text-[#645C52] mb-8 text-sm leading-relaxed">
            Would you like a quick tour of your new collaborative workspace?
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleSkipTour}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#D3A5B1]/30 text-[#8b7355] font-medium hover:bg-[#D3A5B1]/5 transition-colors"
            >
              Skip
            </button>
            <button 
              onClick={handleStartTour}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white font-medium hover:bg-black transition-transform active:scale-95"
            >
              Take Tour
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isActive) return null;

  // Calculate tooltip position based on targetRect
  let tooltipStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  if (targetRect && step.placement !== "center") {
    const margin = 20;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 720;
    const tooltipWidth = 320;
    const tooltipHeight = 220;

    if (step.placement === "bottom") {
      tooltipStyle = {
        top: Math.min(targetRect.bottom + margin, viewportHeight - tooltipHeight - 16),
        left: Math.max(16 + tooltipWidth / 2, Math.min(targetRect.left + targetRect.width / 2, viewportWidth - 16 - tooltipWidth / 2)),
        transform: "translateX(-50%)",
      };
    } else if (step.placement === "left") {
      tooltipStyle = {
        top: Math.max(16 + tooltipHeight / 2, Math.min(targetRect.top + targetRect.height / 2, viewportHeight - 16 - tooltipHeight / 2)),
        left: Math.max(16 + tooltipWidth, targetRect.left - margin),
        transform: "translate(-100%, -50%)",
      };
    } else if (step.placement === "right") {
      tooltipStyle = {
        top: Math.max(16 + tooltipHeight / 2, Math.min(targetRect.top + targetRect.height / 2, viewportHeight - 16 - tooltipHeight / 2)),
        left: Math.min(targetRect.right + margin, viewportWidth - tooltipWidth - 16),
        transform: "translate(0, -50%)",
      };
    } else if (step.placement === "top") {
      tooltipStyle = {
        top: Math.max(16 + tooltipHeight, targetRect.top - margin),
        left: Math.max(16 + tooltipWidth / 2, Math.min(targetRect.left + targetRect.width / 2, viewportWidth - 16 - tooltipWidth / 2)),
        transform: "translate(-50%, -100%)",
      };
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Dimmed Background with cutout for the target element */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tutorial-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx={12}
                fill="black"
                initial={false}
                animate={{
                  x: targetRect.left - 8,
                  y: targetRect.top - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.4)"
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="absolute bg-[#FAF9F6]/95 backdrop-blur-xl border border-[#D3A5B1]/40 rounded-2xl p-6 shadow-2xl w-80 text-[#1A1A1A]"
          style={tooltipStyle}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-[#645C52] hover:text-black transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-3 text-[#8b7355]">
            <Sparkles size={20} />
            <h3 className="font-bold text-lg">{step.title}</h3>
          </div>
          
          <p className="text-sm text-[#645C52] mb-6 leading-relaxed">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? "bg-[#D3A5B1]" : "bg-[#D3A5B1]/30"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg font-medium text-sm flex items-center gap-1 transition-colors hover:bg-[#2a2a2a]"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? "Get Started" : "Next"}
              {currentStep < TUTORIAL_STEPS.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
