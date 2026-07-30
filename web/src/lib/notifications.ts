import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Creates an in-app notification for a user. Fire-and-forget from the
 * caller's perspective — callers should not let a notification failure
 * block the underlying wallet/purchase operation, so wrap calls to this
 * in a try/catch (or void it) if that operation must not fail because a
 * notification couldn't be written.
 */
export function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({ data: params });
}
