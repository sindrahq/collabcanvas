"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient, setSupabaseSessionPersistence } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const nextPath = searchParams.get("next") || "/projects";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function mapAuthError(raw: string | undefined) {
    const normalized = (raw || "").toLowerCase();

    if (normalized.includes("email rate limit exceeded") || normalized.includes("over_email_send_rate_limit")) {
      return "Too many verification emails were requested. Please wait a few minutes before trying again, or log in with an existing account.";
    }

    if (normalized.includes("invalid login credentials")) {
      return "Invalid email or password.";
    }

    return raw || "Authentication failed. Please try again.";
  }

  function validatePassword(value: string) {
    const rules = [
      { ok: value.length >= 8, message: "at least 8 characters" },
      { ok: /[a-z]/.test(value), message: "one lowercase letter" },
      { ok: /[A-Z]/.test(value), message: "one uppercase letter" },
      { ok: /\d/.test(value), message: "one number" },
      { ok: /[^A-Za-z0-9]/.test(value), message: "one special character" },
    ];

    return {
      ok: rules.every((rule) => rule.ok),
      missing: rules.filter((rule) => !rule.ok).map((rule) => rule.message),
    };
  }

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(nextPath);
      }
    });
  }, [nextPath, router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Authentication is unavailable. Missing Supabase environment variables.");
      return;
    }

    if (mode === "signup") {
      const passwordCheck = validatePassword(password);
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter both first name and last name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!passwordCheck.ok) {
        setError(`Password must contain ${passwordCheck.missing.join(", ")}.`);
        return;
      }
    }

    setSupabaseSessionPersistence(rememberMe);
    setLoading(true);

    try {
      if (mode === "signup") {
        const signUpResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
          }),
        });

        const signUpPayload = (await signUpResponse.json()) as {
          error?: string;
          session?: { access_token: string; refresh_token: string } | null;
          requiresEmailVerification?: boolean;
        };

        if (!signUpResponse.ok) {
          setError(mapAuthError(signUpPayload.error || "Could not create account."));
        } else if (signUpPayload.session) {
          if (supabase) {
            await supabase.auth.setSession(signUpPayload.session);
          }
          void router.prefetch(nextPath);
          router.replace(nextPath);
        } else if (signUpPayload.requiresEmailVerification) {
          setMessage("Sign up successful. Please verify your email to complete login.");
        } else {
          setMessage("Sign up successful.");
        }
      } else {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const loginPayload = (await loginResponse.json()) as {
          error?: string;
          session?: { access_token: string; refresh_token: string } | null;
        };

        if (!loginResponse.ok) {
          setError(mapAuthError(loginPayload.error || "Could not log in."));
        } else {
          if (supabase && loginPayload.session) {
            await supabase.auth.setSession(loginPayload.session);
          }
          void router.prefetch(nextPath);
          router.replace(nextPath);
        }
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unknown network error";
      setError(
        `Authentication request failed (${message}). Check network/security software blocking requests and try again.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#1a1a1a]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-4 text-center">
          <Link href="/" className="text-2xl font-semibold italic tracking-tight">
            CollabCanvas
          </Link>
        </div>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-[#dfd7cd] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[#f2ede6] p-1">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "login" ? "bg-[#1a1a1a] text-white" : "text-[#5f584e]"}`}
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "signup" ? "bg-[#1a1a1a] text-white" : "text-[#5f584e]"}`}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
            {mode === "signup" ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
                />
              </div>
            ) : null}

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
            />

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
              className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
            />

            {mode === "signup" ? (
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
              />
            ) : null}

            {mode === "signup" ? (
              <div className="rounded-lg border border-[#e8ded2] bg-[#faf6f1] px-3 py-2 text-xs leading-6 text-[#6a6257]">
                <p className="mb-1 font-medium text-[#4f453b]">Password requirements</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>
            ) : null}

            <label className="flex items-center gap-2 pt-1 text-sm text-[#5f584e]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#c9beaf] text-[#1a1a1a]"
              />
              Remember me
            </label>

            {error ? <p className="text-sm text-[#b43f3f]">{error}</p> : null}
            {!error && message ? <p className="text-sm text-[#2f6f4f]">{message}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2c2c2c] disabled:opacity-70"
            >
              {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>

          </form>
        </section>

        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-[#d7cec2] bg-white px-4 py-2 text-sm font-medium text-[#3f372e] shadow-sm transition hover:bg-[#f5f1eb]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
