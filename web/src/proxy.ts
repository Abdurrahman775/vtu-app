import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. Handles two things:
 * - CORS for /api/** and /uploads/** so the Flutter mobile app (a
 *   different origin — its own dev server port, or a native app with no
 *   browser origin at all) can call this backend. /uploads/** (user
 *   avatars, see docs/PROFILE_MEDIA.md) needs this too even though it's
 *   static files, not an API route: Flutter web's canvas-based renderer
 *   treats a cross-origin image with no CORS headers as tainted and
 *   refuses to draw it, which surfaces as a vague "HTTP request failed,
 *   statusCode: 0" from NetworkImage with no other explanation.
 *   Restricted to non-credentialed requests only (mobile sends its JWT
 *   as an Authorization header, not a cookie) — the admin dashboard's
 *   cookie-based session never goes through this path since it's
 *   same-origin.
 * - Guards the admin dashboard pages using the admin_session cookie set
 *   at /admin/login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/uploads")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders() });
    }
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(corsHeaders())) {
      response.headers.set(key, value);
    }
    return response;
  }

  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.role !== "ADMIN") {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/uploads/:path*"],
};
