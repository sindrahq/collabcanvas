"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { useWorkspaceStoreFactory, type CanvasElementType } from "@/store/workspaceStore";

type Props = { open: boolean; onClose: () => void; workspaceId: string };

export function GenerativeUIModal({ open, onClose, workspaceId }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const useStore = useWorkspaceStoreFactory(workspaceId);
  const addElement = useStore((s) => s.addElement);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as { elements?: Array<{
        type: string; x: number; y: number; width: number; height: number;
        text?: string; style?: Record<string, unknown>;
      }>; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      let added = 0;
      for (const el of data.elements ?? []) {
        addElement(el.type as CanvasElementType, {
          x: el.x, y: el.y, width: el.width, height: el.height,
          text: el.text ?? undefined,
          style: (el.style ?? {}) as never,
        });
        added++;
      }
      if (added === 0) setError("No elements were generated. Try a different prompt.");
      setPrompt("");
      if (added > 0) onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="gen-ui-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="gen-ui-modal"
            initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
          >
            <div className="gen-ui-header">
              <Sparkles size={16} />
              <h2>Generative UI</h2>
              <button type="button" className="gen-ui-close" onClick={onClose}><X size={16} /></button>
            </div>
            <div className="gen-ui-body">
              <p className="gen-ui-hint">
                Describe a UI layout and AI will generate canvas elements for you.
              </p>
              <textarea
                className="gen-ui-textarea"
                placeholder="e.g. A mobile login screen with email, password fields and a pink submit button"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
                }}
              />
              {error && <p className="gen-ui-error">{error}</p>}
            </div>
            <div className="gen-ui-footer">
              <button type="button" className="gen-ui-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                type="button"
                className="gen-ui-btn-generate"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? <Loader2 size={14} className="autosave-spin" /> : <Sparkles size={14} />}
                {loading ? "Generating…" : "Generate"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
