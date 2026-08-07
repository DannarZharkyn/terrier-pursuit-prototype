import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isApprovedOrganizerEmail } from "@/lib/auth/organizer";
import { getSupabaseConfig } from "@/lib/supabase/config";

const PUBLIC_ORGANIZER_PATHS = new Set([
  "/organizer/login",
  "/organizer/unauthorized",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isOrganizerApi = pathname.startsWith("/api/organizer");
  const isOrganizerPage = pathname.startsWith("/organizer");

  if (!isOrganizerApi && !isOrganizerPage) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const approved = isApprovedOrganizerEmail(user?.email);

  if (PUBLIC_ORGANIZER_PATHS.has(pathname)) {
    if (pathname === "/organizer/login" && approved) {
      return NextResponse.redirect(new URL("/organizer/dashboard", request.url));
    }

    return response;
  }

  if (!user) {
    if (isOrganizerApi) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const loginUrl = new URL("/organizer/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!approved) {
    await supabase.auth.signOut();

    if (isOrganizerApi) {
      return NextResponse.json({ ok: false, error: "Organizer access denied." }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/organizer/unauthorized", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/organizer/:path*", "/api/organizer/:path*"],
};
