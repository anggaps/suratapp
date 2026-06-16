"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { serializePayload } from "@/lib/utils/audit";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";
export type AuditEntityType =
  | "IncomingLetter"
  | "OutgoingLetter"
  | "IncomingDisposition"
  | "Attachment";

interface CreateAuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  payload?: Record<string, unknown>;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedBy: session.user.id,
      payload: input.payload ? JSON.stringify(serializePayload(input.payload)) : null,
    },
  });
}

export async function getAuditLogsForEntity(
  entityType: AuditEntityType,
  entityId: string,
  limit = 50
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { performer: { select: { name: true } } },
  });
}

export async function getRecentAuditLogs(limit = 20) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { performer: { select: { name: true } } },
  });
}

export async function getAllAuditLogs(options?: {
  entityType?: AuditEntityType;
  action?: AuditAction;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const { entityType, action, page = 1, pageSize = 20 } = options ?? {};
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { performer: { select: { name: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

