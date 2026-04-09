"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Mail, X } from "lucide-react";
import { type WorkspaceAccessLevel } from "@/store/workspaceStore";

type ShareDialogProps = {
  workspaceId: string;
  workspaceName: string;
  open: boolean;
  onClose: () => void;
  onSyncLocalWorkspace?: () => Promise<{ workspaceId: string | null; error: string | null }>;
};

export function ShareDialog({ workspaceId, workspaceName, open, onClose, onSyncLocalWorkspace }: ShareDialogProps) {
  const [mode, setMode] = useState<"email" | "link">("email");
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<WorkspaceAccessLevel>("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
      setAccessLevel("view");
      setLoading(false);
      setError("");
      setMessage("");
      setShareLink("");
      setMode("email");
    }
  }, [open]);

  async function handleCreateShare() {
    setError("");
    setMessage("");

    let targetWorkspaceId = workspaceId;

    if (workspaceId.startsWith("local-")) {
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
      setMessage("Workspace synced. You can now generate share links.");
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${targetWorkspaceId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email,
          accessLevel,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        sharedWithEmail?: string;
        shareLink?: string;
        accessLevel?: WorkspaceAccessLevel;
      };

      if (!response.ok) {
        setError(payload.error || "Unable to share workspace.");
        return;
      }

      if (payload.shareLink) {
        setShareLink(payload.shareLink);
        setMessage(`Share link created for ${workspaceName}.`);
      } else if (payload.sharedWithEmail) {
        setMessage(`Shared with ${payload.sharedWithEmail}.`);
        setEmail("");
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,12,10,0.42)] p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#dfd7cd] bg-[#fffdf9] shadow-[0_24px_50px_rgba(0,0,0,0.18)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e7ded1] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b7355]">Share workspace</p>
            <h3 className="mt-1 text-lg font-semibold text-[#1a1a1a]">{workspaceName}</h3>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd4c9] bg-white text-[#5f584e] hover:bg-[#f5efe7]" aria-label="Close share dialog">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f2ede6] p-1">
            <button type="button" className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "email" ? "bg-[#1a1a1a] text-white" : "text-[#5f584e]"}`} onClick={() => setMode("email")}>Invite by email</button>
            <button type="button" className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "link" ? "bg-[#1a1a1a] text-white" : "text-[#5f584e]"}`} onClick={() => setMode("link")}>Share link</button>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6a6257]">Access level</label>
            <div className="grid grid-cols-3 gap-2">
              {(["view", "comment", "edit"] as WorkspaceAccessLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setAccessLevel(level)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${accessLevel === level ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#ddd4c9] bg-white text-[#5f584e] hover:bg-[#f7f2eb]"}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {mode === "email" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6a6257]">Recipient email</label>
                <div className="relative">
                  <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7355]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#ddd4c9] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#8b7355]"
                  />
                </div>
              </div>

              <button type="button" onClick={() => void handleCreateShare()} disabled={loading} className="w-full rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2c2c2c] disabled:opacity-70">
                {loading ? "Sharing..." : "Send invite"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button type="button" onClick={() => void handleCreateShare()} disabled={loading} className="w-full rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2c2c2c] disabled:opacity-70">
                {loading ? "Generating..." : "Generate share link"}
              </button>

              {shareLink ? (
                <div className="rounded-xl border border-[#ddd4c9] bg-white p-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6a6257]">Copy link</label>
                  <div className="flex gap-2">
                    <input readOnly value={shareLink} className="min-w-0 flex-1 rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none" />
                    <button type="button" onClick={() => void handleCopyLink()} className="inline-flex items-center gap-2 rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm font-medium text-[#2f2a24] hover:bg-[#f7f2eb]">
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error ? <p className="mt-3 text-sm text-[#b43f3f]">{error}</p> : null}
          {!error && message ? <p className="mt-3 text-sm text-[#2f6f4f]">{message}</p> : null}

          <p className="mt-4 text-xs leading-6 text-[#6a6257]">
            {mode === "email"
              ? "The invited user will see this workspace in Shared with me after signing in with the invited email."
              : "The share link opens the workspace after sign-in and carries the selected access level."}
          </p>
        </div>
      </div>
    </div>
  );
}