"use client";

import { useEffect, useState } from "react";
import { AtSign, Copy, X } from "lucide-react";
import { type WorkspaceAccessLevel } from "@/store/workspaceStore";

type ShareDialogProps = {
  workspaceId: string;
  workspaceName: string;
  open: boolean;
  onClose: () => void;
  onSyncLocalWorkspace?: () => Promise<{ workspaceId: string | null; error: string | null }>;
};

export function ShareDialog({ workspaceId, workspaceName, open, onClose, onSyncLocalWorkspace }: ShareDialogProps) {
  const [mode, setMode] = useState<"username" | "link">("username");
  const [username, setUsername] = useState("");
  const [accessLevel, setAccessLevel] = useState<WorkspaceAccessLevel>("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [syncedWorkspaceId, setSyncedWorkspaceId] = useState<string | null>(null);
  const [linkCache, setLinkCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setUsername("");
      setAccessLevel("view");
      setLoading(false);
      setError("");
      setMessage("");
      setShareLink("");
      setSyncedWorkspaceId(null);
      setLinkCache({});
      setMode("username");
    }
  }, [open]);

  async function handleCreateShare() {
    setError("");
    setMessage("");

    let targetWorkspaceId = syncedWorkspaceId ?? workspaceId;

    if (targetWorkspaceId.startsWith("local-")) {
      if (!onSyncLocalWorkspace) {
        setError("This workspace is local-only. Save it to Supabase first to generate share links.");
        return;
      }

      setLoading(true);
      const syncResult = await onSyncLocalWorkspace();
      setLoading(false);

      if (!syncResult.workspaceId) {
        setError(syncResult.error || "Could not sync workspace to Supabase. Please try again.");
        return;
      }

      targetWorkspaceId = syncResult.workspaceId;
      setSyncedWorkspaceId(syncResult.workspaceId);
      setMessage("Workspace synced. You can now generate share links.");
    }

    const linkCacheKey = `${targetWorkspaceId}:${accessLevel}`;
    if (mode === "link" && linkCache[linkCacheKey]) {
      setShareLink(linkCache[linkCacheKey]);
      setMessage("Share link ready.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${targetWorkspaceId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          username,
          accessLevel,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        sharedWithUsername?: string;
        shareLink?: string;
        accessLevel?: WorkspaceAccessLevel;
      };

      if (!response.ok) {
        setError(payload.error || "Unable to share workspace.");
        return;
      }

      if (payload.shareLink) {
        const nextShareLink = payload.shareLink;
        setShareLink(nextShareLink);
        setLinkCache((previous) => ({
          ...previous,
          [linkCacheKey]: nextShareLink,
        }));
        setMessage(`Share link created for ${workspaceName}.`);
      } else if (payload.sharedWithUsername) {
        setMessage(`Shared with @${payload.sharedWithUsername}.`);
        setUsername("");
      }
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Unknown error";
      setError(`Unable to share workspace (${messageText}).`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setMessage("Share link copied to clipboard.");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-[0_32px_80px_rgba(211,165,177,0.4)] backdrop-blur-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/[0.05] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b7355] opacity-70">Share workspace</p>
            <h3 className="mt-1 text-xl font-bold italic text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>{workspaceName}</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.05] bg-white/50 text-[#5f584e] hover:bg-white hover:shadow-sm transition-all" 
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-black/[0.03] p-1.5">
            <button 
              type="button" 
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${mode === "username" ? "bg-[#FF94B4] text-white shadow-lg shadow-[#FF94B4]/30" : "text-[#636E72] hover:bg-black/[0.02]"}`} 
              onClick={() => setMode("username")}
            >
              Invite by username
            </button>
            <button 
              type="button" 
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${mode === "link" ? "bg-[#FF94B4] text-white shadow-lg shadow-[#FF94B4]/30" : "text-[#636E72] hover:bg-black/[0.02]"}`} 
              onClick={() => setMode("link")}
            >
              Share link
            </button>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b7355] opacity-80">Access level</label>
            <div className="grid grid-cols-3 gap-3">
              {(["view", "comment", "edit"] as WorkspaceAccessLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setAccessLevel(level)}
                  className={`rounded-xl border h-11 text-xs font-bold capitalize transition-all ${accessLevel === level ? "border-[#FF94B4] bg-[#FF94B4]/10 text-[#8b7355]" : "border-black/[0.05] bg-white/40 text-[#636E72] hover:border-[#FF94B4]/50 hover:bg-white/60"}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {mode === "username" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b7355] opacity-80">Recipient username</label>
                <div className="relative">
                  <AtSign size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FF94B4]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="username"
                    className="w-full rounded-xl border border-black/[0.05] bg-white/60 py-3.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[#FF94B4] focus:bg-white transition-all placeholder:text-[#B2BEC3]"
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => void handleCreateShare()} 
                disabled={loading} 
                className="w-full rounded-xl bg-[#FF94B4] h-12 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[#FF94B4]/30 disabled:opacity-70"
              >
                {loading ? "Sharing..." : "Share with username"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                type="button" 
                onClick={() => void handleCreateShare()} 
                disabled={loading} 
                className="w-full rounded-xl bg-[#FF94B4] h-12 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[#FF94B4]/30 disabled:opacity-70"
              >
                {loading ? "Generating..." : "Generate share link"}
              </button>

              {shareLink ? (
                <div className="rounded-2xl border border-black/[0.05] bg-white/40 p-4 animate-in fade-in slide-in-from-top-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b7355] opacity-80">Copy link</label>
                  <div className="flex gap-2">
                    <input readOnly value={shareLink} className="min-w-0 flex-1 rounded-xl border border-black/[0.05] bg-white/80 px-4 py-2.5 text-sm font-medium outline-none" />
                    <button 
                      type="button" 
                      onClick={() => void handleCopyLink()} 
                      className="inline-flex items-center gap-2 rounded-xl border border-[#FF94B4] px-4 py-2.5 text-sm font-bold text-[#8b7355] hover:bg-[#FF94B4]/10 transition-colors"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error ? <p className="mt-4 text-sm font-semibold text-[#b43f3f] bg-[#b43f3f]/10 p-3 rounded-xl">{error}</p> : null}
          {!error && message ? <p className="mt-4 text-sm font-semibold text-[#2f6f4f] bg-[#2f6f4f]/10 p-3 rounded-xl">{message}</p> : null}

          <p className="mt-5 text-[11px] leading-relaxed text-[#636E72] font-medium opacity-80 italic">
            {mode === "username"
              ? "The invited user will see this workspace in 'Shared with me' after signing in."
              : "The share link opens the workspace after sign-in and carries the selected access level."}
          </p>
        </div>
      </div>
    </div>
  );
}