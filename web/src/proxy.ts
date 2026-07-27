import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. Handles two things:
 * - CORS for /api/** so the Flutter mobile app (a different origin —
 *   its own dev server port, or a native app with no browser origin at
 *   all) can call this backend. Restricted to non-credentialed requests
 *   only (mobile sends its JWT as an Authorization header, not a
 *   cookie) — the admin dashboard's cookie-based session never goes
 *   through this path since it's same-origin.
 * - Guards the admin dashboard pages using the admin_session cookie set
 *   at /admin/login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
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
  matcher: ["/admin/:path*", "/api/:path*"],
};
