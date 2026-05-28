import { createBrowserClient } from "@supabase/ssr";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SESSION_MODE_KEY = "cc-auth-session-mode";

type SessionMode = "persistent" | "session";

let browserClient: SupabaseClient | null = null;

function isInvalidRefreshTokenError(error: unknown): boolean {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "").toLowerCase()
      : "";

  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}

export async function getSessionSafely(client: SupabaseClient): Promise<Session | null> {
  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await client.auth.signOut({ scope: "local" });
      }
      return null;
    }

    return data.session ?? null;
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      try {
        await client.auth.signOut({ scope: "local" });
      } catch {
        // Best effort clear for corrupted persisted sessions.
      }
    }
    return null;
  }
}

function readSessionMode(): SessionMode {
  if (typeof window === "undefined") return "persistent";

  const mode = window.localStorage.getItem(SESSION_MODE_KEY);
  return mode === "session" ? "session" : "persistent";
}

function writeSessionMode(mode: SessionMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_MODE_KEY, mode);
}

function createHybridStorage() {
  return {
    getItem(key: string) {
      if (typeof window === "undefined") return null;
      return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
    },
    setItem(key: string, value: string) {
      if (typeof window === "undefined") return;

      if (readSessionMode() === "session") {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
        return;
      }

      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    },
    removeItem(key: string) {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    },
  };
}

export function setSupabaseSessionPersistence(rememberMe: boolean) {
  writeSessionMode(rememberMe ? "persistent" : "session");
}

export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: createHybridStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // Clear stale persisted auth tokens early to avoid repeated refresh errors.
    void getSessionSafely(browserClient);
  }

  return browserClient;
}
