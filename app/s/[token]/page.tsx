import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyShareToken } from "@/lib/share-links";

export default async function SharedLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = verifyShareToken(token);

  if (!payload) {
    redirect("/projects");
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    redirect("/projects");
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only here; auth cookies are managed by the auth routes.
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/s/${token}`)}`);
  }

  redirect(
    `/workspace-editor?workspaceId=${encodeURIComponent(payload.workspaceId)}&access=${encodeURIComponent(payload.accessLevel)}&shareToken=${encodeURIComponent(token)}`
  );
}
