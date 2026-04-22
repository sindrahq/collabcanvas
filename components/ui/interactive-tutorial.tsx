"use client";

import React, { useState, useEffect } from "react";
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
    targetSelector: ".toolbar",
    placement: "bottom",
  },
  {
    id: "canvas",
    title: "Canvas Area",
    description: "Drag, drop, and resize elements here. Right-click any element for more options.",
    targetSelector: ".konva-frame",
    placement: "center",
  },
  {
    id: "sidebar",
    title: "Properties & History",
    description: "View your layers, adjust document settings, and undo/redo actions from the sidebar.",
    targetSelector: ".workspace-sidebar, .right-sidebar",
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

  useEffect(() => {
    if (!isActive || !step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [isActive, currentStep, step.targetSelector]);

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
    if (step.placement === "bottom") {
      tooltipStyle = {
        top: targetRect.bottom + margin,
        left: targetRect.left + targetRect.width / 2,
        transform: "translateX(-50%)",
      };
    } else if (step.placement === "left") {
      tooltipStyle = {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.left - margin,
        transform: "translate(-100%, -50%)",
      };
    } else if (step.placement === "right") {
      tooltipStyle = {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.right + margin,
        transform: "translate(0, -50%)",
      };
    } else if (step.placement === "top") {
      tooltipStyle = {
        top: targetRect.top - margin,
        left: targetRect.left + targetRect.width / 2,
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
