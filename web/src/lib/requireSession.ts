import { getSessionToken, verifySession, type SessionPayload } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export function requireSession(request: Request): SessionPayload {
  const token = getSessionToken(request);
  const session = token ? verifySession(token) : null;
  if (!session) throw new UnauthorizedError();
  return session;
}

export function requireAdmin(request: Request): SessionPayload {
  const session = requireSession(request);
  if (session.role !== "ADMIN") throw new UnauthorizedError();
  return session;
}
