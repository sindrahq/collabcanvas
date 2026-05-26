"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { useWorkspaceStoreFactory, type WorkspaceState } from "@/store/workspaceStore";
import type { CanvasElement } from "@/store/workspaceStore";

type TargetType = "shape" | "text" | "image" | "video" | "frame";

type VibeStylePatch = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
};

type VibeSuggestion = {
  name: string;
  usage: string;
  targetTypes: TargetType[];
  style: VibeStylePatch;
};

type VibeCheckResponse = {
  suggestions?: VibeSuggestion[];
  error?: string;
};

export function VibeCheckPanel({ workspaceId }: { workspaceId?: string | null }) {
  const store = useWorkspaceStoreFactory(workspaceId ?? "default");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<VibeSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const elements = store((s: WorkspaceState) => s.elements);
  const selectedElementId = store((s: WorkspaceState) => s.selectedElementId);
  const updateElementStyle = store((s: WorkspaceState) => s.updateElementStyle);
  const canEdit = store((s: WorkspaceState) => s.canEdit);

  const currentColors = [
    ...new Set(
      elements
        .map((el) => el.style.fill)
        .filter((c) => c && c !== "transparent" && c !== "rgba(255, 255, 255, 0.15)")
    ),
  ].slice(0, 8);

  const selectedElement = selectedElementId
    ? elements.find((element) => element.id === selectedElementId) ?? null
    : null;

  function getTargetType(element: CanvasElement): TargetType {
    if (element.type === "text") return "text";
    if (element.type === "frame") return "frame";
    if (element.type === "image") return "image";
    if (element.type === "video") return "video";
    return "shape";
  }

  function isStylePatchCompatible(element: CanvasElement, suggestion: VibeSuggestion) {
    const type = getTargetType(element);
    return suggestion.targetTypes.includes(type);
  }

  function sanitizePatch(element: CanvasElement, patch: VibeStylePatch): Partial<CanvasElement["style"]> {
    const next: Partial<CanvasElement["style"]> = {};

    const isHex = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

    if (isHex(patch.fill)) next.fill = patch.fill;
    if (isHex(patch.stroke)) next.stroke = patch.stroke;
    if (typeof patch.strokeWidth === "number" && Number.isFinite(patch.strokeWidth)) next.strokeWidth = Math.max(0, patch.strokeWidth);
    if (typeof patch.opacity === "number" && Number.isFinite(patch.opacity)) next.opacity = Math.max(0, Math.min(1, patch.opacity));
    if (typeof patch.shadowEnabled === "boolean") next.shadowEnabled = patch.shadowEnabled;
    if (typeof patch.shadowColor === "string") next.shadowColor = patch.shadowColor;
    if (typeof patch.shadowBlur === "number" && Number.isFinite(patch.shadowBlur)) next.shadowBlur = Math.max(0, patch.shadowBlur);
    if (typeof patch.shadowOffsetX === "number" && Number.isFinite(patch.shadowOffsetX)) next.shadowOffsetX = patch.shadowOffsetX;
    if (typeof patch.shadowOffsetY === "number" && Number.isFinite(patch.shadowOffsetY)) next.shadowOffsetY = patch.shadowOffsetY;

    if (element.type === "text") {
      if (typeof patch.fontFamily === "string" && patch.fontFamily.trim()) next.fontFamily = patch.fontFamily;
      if (patch.fontWeight === "normal" || patch.fontWeight === "bold") next.fontWeight = patch.fontWeight;
      if (patch.fontStyle === "normal" || patch.fontStyle === "italic") next.fontStyle = patch.fontStyle;
      if (patch.textAlign === "left" || patch.textAlign === "center" || patch.textAlign === "right") next.textAlign = patch.textAlign;
    }

    return next;
  }

  function formatTargetTypesLabel(types: TargetType[]) {
    const mapped = types.map((t) => {
      if (t === "text") return "Text";
      if (t === "shape") return "Shape";
      if (t === "frame") return "Frame";
      if (t === "image" || t === "video") return "Media";
      return t.charAt(0).toUpperCase() + t.slice(1);
    });
    return mapped.join(" / ") + " styling";
  }

  async function handleCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colors: currentColors }),
      });
      const data = (await res.json()) as VibeCheckResponse;
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setSuggestions(data.suggestions ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check vibes");
    } finally {
      setLoading(false);
    }
  }

  function applySuggestion(suggestion: VibeSuggestion) {
    if (!selectedElementId || !selectedElement || !canEdit) return;
    if (!isStylePatchCompatible(selectedElement, suggestion)) return;

    const patch = sanitizePatch(selectedElement, suggestion.style);
    if (Object.keys(patch).length === 0) return;

    updateElementStyle(selectedElementId, patch);
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
            {suggestions.map((s, i) => (
              <button
                key={`${s.name}-${i}`}
                type="button"
                className={`vibe-suggestion${selectedElementId && canEdit ? " vibe-suggestion-clickable" : ""}`}
                onClick={() => applySuggestion(s)}
                disabled={!selectedElementId || !selectedElement || !canEdit || !isStylePatchCompatible(selectedElement, s)}
                title={selectedElement ? `Apply ${s.name} to selected element` : "Select an element first"}
              >
                <div className="vibe-swatch vibe-swatch-lg" style={{ background: s.style.fill ?? s.style.stroke ?? "#D3A5B1" }} />
                <div className="vibe-suggestion-info">
                  <span className="vibe-suggestion-name">{s.name}</span>
                  <span className="vibe-suggestion-usage">{s.usage}</span>
                  <span className="vibe-suggestion-type" aria-hidden="true">{formatTargetTypesLabel(s.targetTypes)}</span>
                </div>
                <span className="vibe-suggestion-hex">{s.style.fill ?? s.style.stroke ?? "Style"}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
