"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ProfileMenuProps = {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  onLogout: () => void | Promise<void>;
  profileHref?: string;
};

export function ProfileMenu({
  displayName,
  email,
  avatarUrl,
  onLogout,
  profileHref = "/profile",
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-[var(--projects-line,rgba(26,26,26,0.14))] bg-[var(--projects-panel,#fff)] shadow-[0_10px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-px hover:bg-[#ede6db]"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <img
          src={avatarUrl || "/account.png"}
          alt={displayName || email || "Profile"}
          className="h-full w-full object-cover"
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 overflow-hidden rounded-2xl border border-[var(--projects-line,rgba(26,26,26,0.14))] bg-white p-2 shadow-[0_24px_48px_rgba(0,0,0,0.14)]">
          <div className="rounded-xl bg-[#f7f3ee] px-3 py-3">
            <p className="text-sm font-semibold text-[#1a1a1a]">{displayName || "Profile"}</p>
            <p className="mt-0.5 break-all text-xs text-[#6a6257]">{email || "Signed in"}</p>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <Link
              href={profileHref}
              className="rounded-xl px-3 py-2 text-sm text-[#2d2823] transition hover:bg-[#f3ede4]"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-left text-sm text-[#2d2823] transition hover:bg-[#f3ede4]"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
