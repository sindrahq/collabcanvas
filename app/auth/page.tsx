"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient, getSessionSafely, setSupabaseSessionPersistence } from "@/lib/supabase/client";
import { PastelBlobBackground } from "@/components/landing/pastel-blob-background";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { FallingPetals } from "@/components/landing/falling-petals";
import { useGlobalThemeStore, THEME_BACKGROUNDS } from "@/store/globalThemeStore";

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const nextPath = searchParams.get("next") || "/projects";

  const theme = useGlobalThemeStore((s) => s.theme);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);

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

    void getSessionSafely(supabase).then((session) => {
      if (session) {
        setHasSession(true);
        router.replace(nextPath);
      } else {
        setHasSession(false);
      }
    });
  }, [nextPath, router, supabase]);

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email to receive a password reset link.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(mapAuthError(payload.error || "Could not send reset email."));
      } else {
        setMessage(payload.message || "If an account exists for this email, a reset link has been sent.");
        setForgotPasswordOpen(false);
      }
    } catch (requestError) {
      const requestMessage = requestError instanceof Error ? requestError.message : "Unknown network error";
      setError(`Password reset request failed (${requestMessage}). Please try again.`);
    } finally {
      setResetLoading(false);
    }
  }

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
      const normalizedUsername = username.trim().replace(/^@+/, "").toLowerCase();
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter both first name and last name.");
        return;
      }
      if (!normalizedUsername) {
        setError("Please choose a username.");
        return;
      }
      if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
        setError("Username must be 3-30 chars and only contain letters, numbers, or underscores.");
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
            username: username.trim().replace(/^@+/, "").toLowerCase(),
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
    <main className="min-h-screen text-[#1a1a1a] relative overflow-hidden">
      {/* Background Assets */}
      <div 
        className="fixed inset-0 pointer-events-none z-[0] transition-all duration-1000"
        style={{
          backgroundImage: `url(${THEME_BACKGROUNDS[theme] || THEME_BACKGROUNDS.cherry})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-white/50 backdrop-blur-[2px] z-[1]" />
      
      <div className="relative z-10 w-full h-full min-h-screen">
        <PastelBlobBackground theme={theme} />
        <CustomCursor />
        <FallingPetals theme={theme} />

        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12 relative z-20">
          <div className="mb-8 text-center">
            <Link href={hasSession ? "/projects" : "/auth?next=%2Fprojects"} className="text-4xl font-semibold italic tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              CollabCanvas
            </Link>
          </div>

          <section className="mx-auto w-full max-w-md rounded-[2rem] glass-panel-deep p-8">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/40 p-1">
            <button
              type="button"
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${mode === "login" ? "bg-[#2D3436] text-white shadow-md" : "text-[#2D3436] hover:bg-white/40"}`}
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
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${mode === "signup" ? "bg-[#2D3436] text-white shadow-md" : "text-[#2D3436] hover:bg-white/40"}`}
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

            {mode === "signup" ? (
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-[#ddd4c9] px-3 py-2 text-sm outline-none focus:border-[#8b7355]"
              />
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

            {mode === "login" ? (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-[#8b7355] hover:text-[#6f5b44]"
                  onClick={() => setForgotPasswordOpen((open) => !open)}
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            {mode === "login" && forgotPasswordOpen ? (
              <div className="rounded-lg border border-[#e8ded2] bg-[#faf6f1] px-3 py-2.5 text-xs text-[#6a6257]">
                <p className="mb-2">Send a reset link to your email.</p>
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={resetLoading}
                  className="w-full rounded-lg bg-[#2D3436] px-3 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-70"
                >
                  {resetLoading ? "Sending..." : "Send reset email"}
                </button>
              </div>
            ) : null}

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
              className="w-full rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-bold text-white transition hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 mt-4"
            >
              {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>

          </form>
        </section>

        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-md px-6 py-2.5 text-sm font-bold text-[#2D3436] shadow-sm transition hover:bg-white/60 relative z-20"
        >
          Back to home
        </Link>
        </div>
      </div>
    </main>
  );
}

export default function AuthPageWithSuspense() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
