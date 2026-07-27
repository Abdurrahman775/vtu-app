import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export type SessionPayload = {
  userId: string;
  role: "USER" | "ADMIN";
};

export function signSession(payload: SessionPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload | null {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

/**
 * Mobile app calls send `Authorization: Bearer <token>`; the admin web
 * dashboard instead relies on the httpOnly `admin_session` cookie set at
 * /api/admin/login. Route handlers accept either.
 */
export function getSessionToken(request: Request): string | null {
  const bearer = getBearerToken(request);
  if (bearer) return bearer;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
