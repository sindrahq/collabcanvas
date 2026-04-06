"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileFormState = {
  fullName: string;
  avatarUrl: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<ProfileFormState>({
    fullName: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (!supabase) {
      setError("Authentication is unavailable. Missing Supabase environment variables.");
      setLoading(false);
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth?next=%2Fprofile");
        return;
      }

      setEmail(data.user.email || "");
      setProfile({
        fullName: typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : "",
        avatarUrl: typeof data.user.user_metadata?.avatar_url === "string" ? data.user.user_metadata.avatar_url : "",
      });
      setLoading(false);
    });
  }, [router, supabase]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Authentication is unavailable.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
      },
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Profile updated successfully.");
    }

    setSaving(false);
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Authentication is unavailable.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated successfully.");
      setPassword("");
    }

    setSaving(false);
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] px-6 py-12 text-[#1a1a1a]">
        <p className="mx-auto max-w-3xl text-sm text-[#6a6257]">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-6 py-12 text-[#1a1a1a]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/projects" className="text-sm text-[#6a6257] hover:text-[#1a1a1a]">
            Back to projects
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-lg border border-[#d7cec2] bg-white px-3 py-2 text-sm hover:bg-[#f2ece4]"
          >
            Log out
          </button>
        </div>

        <h1 className="mb-1 text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="mb-6 text-sm text-[#6a6257]">Manage your account details and security settings.</p>

        <section className="mb-4 rounded-2xl border border-[#dfd7cd] bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
          <p className="mb-4 text-sm text-[#6a6257]">Signed in as {email || "-"}</p>

          <form className="space-y-3" onSubmit={(event) => void handleSaveProfile(event)}>
            <input
              type="text"
              value={profile.fullName}
              onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
            />
            <input
              type="url"
              value={profile.avatarUrl}
              onChange={(event) => setProfile((prev) => ({ ...prev, avatarUrl: event.target.value }))}
              placeholder="Avatar URL"
              className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c2c2c] disabled:opacity-70"
            >
              Save profile
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#dfd7cd] bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
          <h2 className="mb-3 text-lg font-medium">Change password</h2>
          <form className="space-y-3" onSubmit={(event) => void handleChangePassword(event)}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              placeholder="New password"
              className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c2c2c] disabled:opacity-70"
            >
              Update password
            </button>
          </form>
        </section>

        {error ? <p className="mt-4 text-sm text-[#b43f3f]">{error}</p> : null}
        {!error && message ? <p className="mt-4 text-sm text-[#2f6f4f]">{message}</p> : null}
      </div>
    </main>
  );
}
