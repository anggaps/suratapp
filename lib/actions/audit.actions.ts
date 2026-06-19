"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdminOrPimpinan } from "@/lib/auth-utils";
import { serializePayload } from "@/lib/utils/audit";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT";
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
  const user = await requireAuth();

  return prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedBy: user.id,
      payload: input.payload ? JSON.stringify(serializePayload(input.payload)) : null,
    },
  });
}

export async function getAuditLogsForEntity(
  entityType: AuditEntityType,
  entityId: string,
  limit = 50
) {
  await requireAuth();

  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { performer: { select: { name: true } } },
  });
}

export async function getRecentAuditLogs(limit = 20) {
  await requireAuth();

  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { performer: { select: { name: true } } },
  });
}

export async function getAllAuditLogs(options?: {
  entityType?: AuditEntityType;
  action?: AuditAction;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAdminOrPimpinan();

  const { entityType, action, fromDate, toDate, search, page = 1, pageSize = 20 } = options ?? {};
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;

  if (fromDate || toDate) {
    const createdAtFilter: Record<string, Date> = {};
    if (fromDate) createdAtFilter.gte = new Date(`${fromDate}T00:00:00`);
    if (toDate) createdAtFilter.lte = new Date(`${toDate}T23:59:59.999`);
    where.createdAt = createdAtFilter;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { entityId: { contains: term, mode: "insensitive" } },
      { payload: { contains: term, mode: "insensitive" } },
      { performer: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

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

