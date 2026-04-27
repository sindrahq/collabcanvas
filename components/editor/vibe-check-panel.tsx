"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

type ColorSuggestion = { hex: string; name: string; usage: string };

export function VibeCheckPanel() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ColorSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const elements = useWorkspaceStore((s) => s.elements);
  const selectedElementId = useWorkspaceStore((s) => s.selectedElementId);
  const updateElementStyle = useWorkspaceStore((s) => s.updateElementStyle);
  const canEdit = useWorkspaceStore((s) => s.canEdit);

  const currentColors = [
    ...new Set(
      elements
        .map((el) => el.style.fill)
        .filter((c) => c && c !== "transparent" && c !== "rgba(255, 255, 255, 0.15)")
    ),
  ].slice(0, 8);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colors: currentColors }),
      });
      const data = (await res.json()) as { palette?: ColorSuggestion[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setSuggestions(data.palette ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check vibes");
    } finally {
      setLoading(false);
    }
  }

  function applyColor(hex: string) {
    if (!selectedElementId || !canEdit) return;
    updateElementStyle(selectedElementId, { fill: hex });
  }

  return (
    <div className="vibe-check-panel">
      <div className="inspector-section-header">
        <Wand2 size={13} />
        <span>Vibe Check AI</span>
      </div>

      <div className="vibe-check-current">
        <p className="inspector-label">Canvas palette</p>
        <div className="vibe-swatches">
          {currentColors.map((c) => (
            <div key={c} className="vibe-swatch" style={{ background: c }} title={c} />
          ))}
          {currentColors.length === 0 && (
            <span className="vibe-empty">No colors yet</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="vibe-check-btn"
        onClick={handleCheck}
        disabled={loading || currentColors.length === 0}
      >
        {loading ? <Loader2 size={13} className="autosave-spin" /> : <Wand2 size={13} />}
        {loading ? "Analyzing…" : "Check Vibes"}
      </button>

      {error && <p className="vibe-error">{error}</p>}

      {suggestions.length > 0 && (
        <div className="vibe-suggestions">
          <p className="inspector-label">
            Suggested palette{selectedElementId && canEdit ? " — click to apply" : ""}
          </p>
          <div className="vibe-suggestion-list">
            {suggestions.map((s) => (
              <button
                key={s.hex}
                type="button"
                className={`vibe-suggestion${selectedElementId && canEdit ? " vibe-suggestion-clickable" : ""}`}
                onClick={() => applyColor(s.hex)}
                disabled={!selectedElementId || !canEdit}
                title={`Apply ${s.hex} to selected element`}
              >
                <div className="vibe-swatch vibe-swatch-lg" style={{ background: s.hex }} />
                <div className="vibe-suggestion-info">
                  <span className="vibe-suggestion-name">{s.name}</span>
                  <span className="vibe-suggestion-usage">{s.usage}</span>
                </div>
                <span className="vibe-suggestion-hex">{s.hex}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
