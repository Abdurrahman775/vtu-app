import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. Guards the admin
 * dashboard pages (not the JSON API routes, which check the bearer token
 * themselves) using the admin_session cookie set at /admin/login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

export const config = {
  matcher: ["/admin/:path*"],
};
