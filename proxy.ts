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

  let response = NextResponse.next({
    request,
  });

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
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute(pathname) && !user) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(authUrl);
  }

  if (pathname.startsWith("/auth") && user) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/projects/:path*", "/workspace-editor/:path*", "/profile/:path*", "/editor/:path*", "/auth/:path*"],
};
