import { Request } from "express";
import { prisma } from "../../config/db.js";
import { AuditAction } from "@prisma/client";

export interface RecordAuditLogParams {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";
  entity: string;
  entityId: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  ip?: string | null;
}

export const extractClientIp = (req: Request | any): string | undefined => {
  if (!req) return undefined;
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0];
    return first ? first.trim() : undefined;
  }
  return req.ip || req.socket?.remoteAddress || undefined;
};

export const recordAuditLog = async (params: RecordAuditLogParams) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action as AuditAction,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        ip: params.ip ?? null,
      },
    });
  } catch (error: any) {
    console.error(`[AUDIT_LOG_ERROR] Could not write audit log for ${params.entity}:${params.entityId}:`, error?.message);
    return null;
  }
};
