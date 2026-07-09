import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith("/projects") ||
    pathname.startsWith("/workspace-editor") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/editor")
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            // Extend session to 7 days on every request
            maxAge: 604800,
          });
        });
      },
    },
    cookieOptions: {
      maxAge: 604800, // 7 days
      path: "/",
    },
  });

  // Calling getUser refreshes the access token automatically when expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(pathname) && !user) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(authUrl);
  }

  // Redirect authenticated users away from the auth page
  if (pathname.startsWith("/auth") && user) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, images, and favicon.
     * This ensures session tokens are refreshed on every navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
