"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowRight, Bold,
  Circle, Clock3, Italic, Lock, Minus, MessageSquare, MousePointer2, Palette,
  RectangleHorizontal, RotateCw, Send, Star, Triangle, Type, LayoutGrid
} from "lucide-react";
import { useWorkspaceStoreFactory, type WorkspaceState } from "@/store/workspaceStore";
import type { WorkspaceComment } from "@/lib/comments";
import { ElementTimeTravelSlider } from "@/components/editor/element-time-travel";
import { VibeCheckPanel } from "@/components/editor/vibe-check-panel";

const TYPE_ICONS = {
  rectangle: RectangleHorizontal,
  rect: RectangleHorizontal,
  circle: Circle,
  text: Type,
  triangle: Triangle,
  star: Star,
  arrow: ArrowRight,
  line: Minus,
};

const FONTS = [
  "Inter", "Roboto", "Montserrat", "Oswald",
  "Playfair Display", "Dancing Script",
  "Arial", "Georgia", "Courier New", "Trebuchet MS",
];

const ALIGNMENTS = [
  { align: "left"   as const, icon: AlignLeft,   label: "Left" },
  { align: "center" as const, icon: AlignCenter, label: "Center" },
  { align: "right"  as const, icon: AlignRight,  label: "Right" },
];

function ColorRow({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="inspector-row">
      <label className="inspector-label">{label}</label>
      <div className="inspector-color-field">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
          className="color-swatch" title={label} />
        <span className="inspector-mono">{value}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, display, onChange, disabled = false }: {
  label: string; value: number; min: number; max: number;
  step?: number; display?: string; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div className="inspector-row inspector-row-col">
      <div className="inspector-row-header">
        <label className="inspector-label">{label}</label>
        <span className="inspector-value">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))} className="inspector-slider" />
    </div>
  );
}

import type { CanvasElement } from "@/store/workspaceStore";

function VideoTrimControls({ workspaceId, elementId, element }: { workspaceId?: string | null; elementId: string; element: CanvasElement }) {
  const store = useWorkspaceStoreFactory(workspaceId ?? "default");
  const updateElement = store((s: WorkspaceState) => s.updateElement);
  const canEdit = store((s: WorkspaceState) => s.canEdit);
  const [videoUrl, setVideoUrl] = useState((element as CanvasElement & { videoUrl?: string }).videoUrl ?? "");

  const trimStart = (element as CanvasElement & { trimStart?: number }).trimStart ?? 0;
  const trimEnd = (element as CanvasElement & { trimEnd?: number }).trimEnd ?? 0;

  function commitUrl() {
    if (videoUrl.trim()) updateElement(elementId, { videoUrl: videoUrl.trim() } as never);
  }

  return (
    <div className="video-trim-controls">
      <div className="inspector-row inspector-row-col">
        <label className="inspector-label">Source URL</label>
        <div style={{ display: "flex", gap: 4 }}>
          <input
            type="url"
            className="inspector-text-input"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={(e) => { if (e.key === "Enter") commitUrl(); }}
            placeholder="https://…"
            disabled={!canEdit}
          />
        </div>
      </div>
      <SliderRow
        label="Trim start (s)"
        value={trimStart}
        min={0} max={300} step={1}
        display={`${trimStart}s`}
        onChange={(v) => updateElement(elementId, { trimStart: v } as never)}
        disabled={!canEdit}
      />
      <SliderRow
        label="Trim end (s)"
        value={trimEnd}
        min={0} max={300} step={1}
        display={trimEnd === 0 ? "End" : `${trimEnd}s`}
        onChange={(v) => updateElement(elementId, { trimEnd: v } as never)}
        disabled={!canEdit}
      />
    </div>
  );
}

function formatCommentTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function CommentCard({
  comment,
  isMine,
  targetLabel,
}: {
  comment: WorkspaceComment;
  isMine: boolean;
  targetLabel: string;
}) {
  return (
    <div className={`comment-card${isMine ? " mine" : ""}`}>
      <div className="comment-card-top">
        <div>
          <strong>{comment.authorName}</strong>
          <span>{comment.authorEmail ?? "No email"}</span>
        </div>
        <span className="comment-time">
          <Clock3 size={11} />
          {formatCommentTime(comment.createdAt)}
        </span>
      </div>
      <p className="comment-message">{comment.message}</p>
      <div className="comment-meta">
        <MessageSquare size={11} />
        <span>{targetLabel}</span>
      </div>
    </div>
  );
}

export function RightSidebar({
  workspaceId,
  comments,
  commentsLoading,
  commentsError,
  currentUserId,
  canComment = false,
  onAddComment,
  mode = "full",
}: {
  workspaceId?: string | null;
  comments: WorkspaceComment[];
  commentsLoading?: boolean;
  commentsError?: string | null;
  currentUserId?: string | null;
  canComment?: boolean;
  onAddComment: (message: string, targetElementId: string | null) => Promise<void>;
  mode?: "full" | "inspector" | "comments";
}) {
  const store = useWorkspaceStoreFactory(workspaceId ?? "default");
  const elements           = store((s: WorkspaceState) => s.elements);
  const selectedElementId  = store((s: WorkspaceState) => s.selectedElementId);
  const updateElementStyle = store((s: WorkspaceState) => s.updateElementStyle);
  const updateElement      = store((s: WorkspaceState) => s.updateElement);
  const canvasBackground   = store((s: WorkspaceState) => s.canvasBackground);
  const setCanvasBackground = store((s: WorkspaceState) => s.setCanvasBackground);
  const canEdit            = store((s: WorkspaceState) => s.canEdit);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );

  const TypeIcon = selectedElement
    ? (TYPE_ICONS[selectedElement.type as keyof typeof TYPE_ICONS] ?? Palette)
    : MousePointer2;

  const [commentDraft, setCommentDraft] = useState("");
  const [commentTargetId, setCommentTargetId] = useState<string | null>(selectedElementId);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    setCommentTargetId(selectedElementId ?? null);
  }, [selectedElementId]);

  useEffect(() => {
    if (commentTargetId && !elements.some((element) => element.id === commentTargetId)) {
      setCommentTargetId(null);
    }
  }, [commentTargetId, elements]);

  const commentTargetLabel = useMemo(() => {
    if (!commentTargetId) {
      return "Workspace";
    }

    return elements.find((element) => element.id === commentTargetId)?.name ?? "Workspace";
  }, [commentTargetId, elements]);

  const visibleComments = useMemo(
    () => comments.filter((comment) => (comment.targetElementId ?? null) === (commentTargetId ?? null)),
    [commentTargetId, comments]
  );

  async function handleSubmitComment() {
    const message = commentDraft.trim();
    if (!message || !workspaceId || !canComment) {
      return;
    }

    setCommentSubmitting(true);
    try {
      await onAddComment(message, commentTargetId);
      setCommentDraft("");
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
    <motion.aside
      className="editor-panel inspector-panel"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="inspector-header">
        <Palette size={14} className="inspector-header-icon" />
        <span className="eyebrow" style={{ margin: 0 }}>Inspector</span>
      </div>

      {mode !== "comments" ? (
        <div className="inspector-section">
          <ColorRow
            label="Background"
            value={canvasBackground}
            onChange={setCanvasBackground}
            disabled={!canEdit}
          />
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {mode !== "comments" ? (
          selectedElement ? (
          <motion.div
            key={selectedElement.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* Identity */}
            <div className="inspector-identity">
              <div className="inspector-type-badge">
                <TypeIcon size={13} />
                <span>{selectedElement.type}</span>
              </div>
              <input
                type="text" className="inspector-name-input"
                value={selectedElement.name}
                onChange={(e) => updateElement(selectedElement.id, { name: e.target.value, label: e.target.value })}
                disabled={!canEdit}
              />
            </div>

            {/* Layout */}
            <div className="inspector-section">
              <div className="inspector-section-title">
                <AlignLeft size={12} /><span>Layout</span>
              </div>
              <div className="inspector-grid-2">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <div key={field} className="inspector-num-field">
                    <label>{field === "width" ? "W" : field === "height" ? "H" : field.toUpperCase()}</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement[field])}
                      onChange={(e) => updateElement(selectedElement.id, { [field]: Number(e.target.value) })}
                      disabled={!canEdit}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Frame Layout */}
            {selectedElement.type === "frame" && selectedElement.layoutProps && (
              <div className="inspector-section">
                <div className="inspector-section-title">
                  <LayoutGrid size={12} /><span>Auto-Layout</span>
                </div>
                
                <div className="inspector-row" style={{ marginBottom: 10 }}>
                  <label className="inspector-label">Direction</label>
                  <div className="inspector-toggle-group">
                    <button
                      type="button"
                      className={`inspector-toggle-btn${selectedElement.layoutProps.direction === "horizontal" ? " active" : ""}`}
                      onClick={() => updateElement(selectedElement.id, { 
                        layoutProps: { ...selectedElement.layoutProps!, direction: "horizontal" } 
                      })}
                      disabled={!canEdit}
                    >
                      Horizontal
                    </button>
                    <button
                      type="button"
                      className={`inspector-toggle-btn${selectedElement.layoutProps.direction === "vertical" ? " active" : ""}`}
                      onClick={() => updateElement(selectedElement.id, { 
                        layoutProps: { ...selectedElement.layoutProps!, direction: "vertical" } 
                      })}
                      disabled={!canEdit}
                    >
                      Vertical
                    </button>
                  </div>
                </div>

                <SliderRow 
                  label="Padding" 
                  value={selectedElement.layoutProps.padding}
                  min={0} max={100} display={`${selectedElement.layoutProps.padding}px`}
                  onChange={(v) => updateElement(selectedElement.id, { 
                    layoutProps: { ...selectedElement.layoutProps!, padding: v } 
                  })}
                  disabled={!canEdit} 
                />
                
                <SliderRow 
                  label="Gap" 
                  value={selectedElement.layoutProps.gap}
                  min={0} max={100} display={`${selectedElement.layoutProps.gap}px`}
                  onChange={(v) => updateElement(selectedElement.id, { 
                    layoutProps: { ...selectedElement.layoutProps!, gap: v } 
                  })}
                  disabled={!canEdit} 
                />

                <div className="inspector-row">
                  <label className="inspector-label">Auto Resize</label>
                  <button
                    type="button"
                    className={`inspector-toggle-btn${selectedElement.layoutProps.autoResize ? " active" : ""}`}
                    onClick={() => updateElement(selectedElement.id, { 
                      layoutProps: { ...selectedElement.layoutProps!, autoResize: !selectedElement.layoutProps!.autoResize } 
                    })}
                    disabled={!canEdit}
                  >
                    {selectedElement.layoutProps.autoResize ? "On" : "Off"}
                  </button>
                </div>
              </div>
            )}

            {/* Appearance */}
            <div className="inspector-section">
              <div className="inspector-section-title">
                <Palette size={12} /><span>Appearance</span>
              </div>
              <ColorRow
                label={selectedElement.type === "text" ? "Text Color" : "Fill"}
                value={selectedElement.style.fill}
                onChange={(v) => updateElementStyle(selectedElement.id, { fill: v })}
                disabled={!canEdit}
              />
              <ColorRow label="Stroke" value={selectedElement.style.stroke}
                onChange={(v) => updateElementStyle(selectedElement.id, { stroke: v })}
                disabled={!canEdit} />
              <SliderRow label="Stroke width" value={selectedElement.style.strokeWidth}
                min={0} max={20} display={`${selectedElement.style.strokeWidth}px`}
                onChange={(v) => updateElementStyle(selectedElement.id, { strokeWidth: v })}
                disabled={!canEdit} />
              <SliderRow label="Opacity" value={selectedElement.style.opacity}
                min={0} max={1} step={0.01}
                display={`${Math.round(selectedElement.style.opacity * 100)}%`}
                onChange={(v) => updateElementStyle(selectedElement.id, { opacity: v })}
                disabled={!canEdit} />

              {/* Rotation */}
              <div className="inspector-row" style={{ marginTop: 8 }}>
                <label className="inspector-label">
                  <RotateCw size={11} style={{ display: "inline", marginRight: 4 }} />
                  Rotation
                </label>
                <div className="inspector-num-field" style={{ width: 72 }}>
                  <input
                    type="number"
                    min={-360} max={360} step={1}
                    value={Math.round(selectedElement.rotation)}
                    onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                  />
                </div>
                <span className="inspector-value" style={{ marginLeft: 4 }}>°</span>
              </div>
            </div>

            {/* Shadow (for all types: shapes, images, text) */}
            {(selectedElement.type === "rectangle" || selectedElement.type === "circle" || selectedElement.type === "triangle" || selectedElement.type === "star" || selectedElement.type === "image" || selectedElement.type === "text") && (
              <div className="inspector-section">
                <div className="inspector-section-title">
                  <Palette size={12} /><span>Shadow</span>
                </div>
                <div className="inspector-row" style={{ marginBottom: 8 }}>
                  <label className="inspector-label">Enable</label>
                  <button
                    type="button"
                    className={`inspector-toggle-btn${selectedElement.style.shadowEnabled ? " active" : ""}`}
                    onClick={() => updateElementStyle(selectedElement.id, { shadowEnabled: !selectedElement.style.shadowEnabled })}
                    disabled={!canEdit}
                    title="Toggle shadow"
                  >
                    {selectedElement.style.shadowEnabled ? "On" : "Off"}
                  </button>
                </div>
                {selectedElement.style.shadowEnabled && (
                  <>
                    <ColorRow label="Color" value={selectedElement.style.shadowColor}
                      onChange={(v) => updateElementStyle(selectedElement.id, { shadowColor: v })}
                      disabled={!canEdit} />
                    <SliderRow label="Blur" value={selectedElement.style.shadowBlur}
                      min={0} max={60} display={`${selectedElement.style.shadowBlur}px`}
                      onChange={(v) => updateElementStyle(selectedElement.id, { shadowBlur: v })}
                      disabled={!canEdit} />
                    <SliderRow label="Offset X" value={selectedElement.style.shadowOffsetX}
                      min={-40} max={40} display={`${selectedElement.style.shadowOffsetX}px`}
                      onChange={(v) => updateElementStyle(selectedElement.id, { shadowOffsetX: v })}
                      disabled={!canEdit} />
                    <SliderRow label="Offset Y" value={selectedElement.style.shadowOffsetY}
                      min={-40} max={40} display={`${selectedElement.style.shadowOffsetY}px`}
                      onChange={(v) => updateElementStyle(selectedElement.id, { shadowOffsetY: v })}
                      disabled={!canEdit} />
                  </>
                )}
              </div>
            )}

            {/* Text section */}
            {selectedElement.type === "text" && (
              <div className="inspector-section">
                <div className="inspector-section-title">
                  <Type size={12} /><span>Text</span>
                </div>

                {/* Font family */}
                <div className="inspector-row inspector-row-col" style={{ marginBottom: 8 }}>
                  <label className="inspector-label">Font</label>
                  <select
                    className="inspector-select"
                    value={selectedElement.style.fontFamily}
                    onChange={(e) => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })}
                    disabled={!canEdit}
                  >
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Bold / Italic */}
                <div className="inspector-row" style={{ marginBottom: 10 }}>
                  <label className="inspector-label">Style</label>
                  <div className="inspector-toggle-group">
                    <button
                      type="button"
                      className={`inspector-toggle-btn${selectedElement.style.fontWeight === "bold" ? " active" : ""}`}
                      onClick={() => updateElementStyle(selectedElement.id, {
                        fontWeight: selectedElement.style.fontWeight === "bold" ? "normal" : "bold",
                      })}
                      disabled={!canEdit}
                      title="Bold"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      className={`inspector-toggle-btn${selectedElement.style.fontStyle === "italic" ? " active" : ""}`}
                      onClick={() => updateElementStyle(selectedElement.id, {
                        fontStyle: selectedElement.style.fontStyle === "italic" ? "normal" : "italic",
                      })}
                      disabled={!canEdit}
                      title="Italic"
                    >
                      <Italic size={13} />
                    </button>
                  </div>
                </div>

                {/* Alignment */}
                <div className="inspector-row" style={{ marginBottom: 10 }}>
                  <label className="inspector-label">Align</label>
                  <div className="inspector-toggle-group">
                    {ALIGNMENTS.map(({ align, icon: Icon, label }) => (
                      <button
                        key={align}
                        type="button"
                        className={`inspector-toggle-btn${selectedElement.style.textAlign === align ? " active" : ""}`}
                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: align })}
                        disabled={!canEdit}
                        title={label}
                      >
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                </div>

                <SliderRow label="Font size" value={selectedElement.style.fontSize}
                  min={8} max={72} display={`${selectedElement.style.fontSize}px`}
                  onChange={(v) => updateElementStyle(selectedElement.id, { fontSize: v })} />

                <div className="inspector-row inspector-row-col">
                  <label className="inspector-label">Content</label>
                  <textarea
                    className="inspector-textarea"
                    value={selectedElement.text ?? ""}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <ElementTimeTravelSlider workspaceId={workspaceId ?? ""} />

            {false && selectedElement.type === "video" && (
              <div className="inspector-section">
                <p className="inspector-section-title">Video Controls</p>
                <VideoTrimControls workspaceId={workspaceId} elementId={selectedElement.id} element={selectedElement} />
              </div>
            )}

            <VibeCheckPanel workspaceId={workspaceId} />

            {selectedElement.locked && (
              <div className="inspector-lock-notice">
                <Lock size={12} />
                <span>Element is locked — unlock from layers to edit position</span>
              </div>
            )}
          </motion.div>
          ) : (
          <motion.div
            key="empty" className="inspector-empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <MousePointer2 size={28} className="inspector-empty-icon" />
            <p>Select an element on the canvas to inspect and edit its properties.</p>
          </motion.div>
          )
        ) : null}
      </AnimatePresence>

      {mode !== "inspector" ? (
        <div className="inspector-section comments-panel">
        <div className="inspector-section-title">
          <MessageSquare size={12} />
          <span>Comments</span>
        </div>

        <div className="comments-intro">
          <span>{commentTargetId ? `Replying on ${commentTargetLabel}` : "Workspace thread"}</span>
          <button
            type="button"
            className="inspector-toggle-btn"
            onClick={() => setCommentTargetId(selectedElementId)}
            disabled={!selectedElementId}
            title={selectedElementId ? "Attach comment to the selected element" : "Select an element to comment on it"}
          >
            Use selection
          </button>
        </div>

        <div className="inspector-row inspector-row-col">
          <label className="inspector-label">Thread target</label>
          <select
            className="inspector-select"
            value={commentTargetId ?? "workspace"}
            onChange={(event) => setCommentTargetId(event.target.value === "workspace" ? null : event.target.value)}
            disabled={!workspaceId}
          >
            <option value="workspace">Workspace</option>
            {elements.map((element) => (
              <option key={element.id} value={element.id}>
                {element.name}
              </option>
            ))}
          </select>
        </div>

        <div className="inspector-row inspector-row-col">
          <label className="inspector-label">Add a comment</label>
          <textarea
            className="inspector-textarea"
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            rows={4}
            placeholder={canComment ? "Ask a question or leave feedback" : "Read only access"}
            disabled={!workspaceId || !canComment}
          />
        </div>

        <div className="comment-actions">
          <button
            type="button"
            className="toolbar-button"
            onClick={() => void handleSubmitComment()}
            disabled={!workspaceId || !canComment || !commentDraft.trim() || commentSubmitting}
          >
            <Send size={13} />
            <span>{commentSubmitting ? "Posting..." : "Post comment"}</span>
          </button>
          {!canComment && (
            <span className="comment-readonly-note">
              Comment access is required to post.
            </span>
          )}
        </div>

        {commentsError ? (
          <div className="comment-empty-state">{commentsError}</div>
        ) : commentsLoading ? (
          <div className="comment-empty-state">Loading comments...</div>
        ) : visibleComments.length > 0 ? (
          <div className="comment-list">
            {visibleComments.map((comment) => {
              const targetLabel = comment.targetElementId
                ? elements.find((element) => element.id === comment.targetElementId)?.name ?? "Element"
                : "Workspace";

              return (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isMine={comment.authorId === currentUserId}
                  targetLabel={targetLabel}
                />
              );
            })}
          </div>
        ) : (
          <div className="comment-empty-state">No comments in this thread yet. Start the thread.</div>
        )}
        </div>
      ) : null}
    </motion.aside>
  );
}
