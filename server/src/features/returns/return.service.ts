import { ReturnStatus } from "@prisma/client";
import { AppError } from "../../middleware/appError.js";
import { prisma } from "../../config/db.js";
import { notifyShopOwner, notifyUser } from "../notification/notification.service.js";

const activeReturnStatuses: ReturnStatus[] = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "ITEM_SHIPPED",
  "ITEM_RECEIVED",
  "REFUND_PENDING",
  "REFUNDED",
  "REPLACEMENT_SENT",
  "CLOSED",
];

const returnInclude = {
  items: {
    include: {
      orderItem: {
        include: {
          product: { select: { name: true, images: { where: { isPrimary: true }, select: { url: true }, take: 1 } } },
          variant: { select: { name: true } },
        },
      },
    },
  },
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  order: {
    select: {
      id: true,
      shopId: true,
      totalAmount: true,
      createdAt: true,
      customer: { select: { id: true, name: true, email: true } },
      shop: { select: { slug: true, profile: { select: { name: true, logo: true } } } },
    },
  },
} as const;

const notifyReturnRequested = async (returnRequest: {
  id: string;
  orderId: string;
  customerId: string;
  order: { shopId: string };
}) => {
  try {
    await notifyShopOwner({
      shopId: returnRequest.order.shopId,
      type: "RETURN_REQUESTED",
      title: "New return request",
      body: `A customer requested a return for order #${returnRequest.orderId.slice(-8).toUpperCase()}.`,
      meta: { returnRequestId: returnRequest.id, orderId: returnRequest.orderId },
    });
  } catch (error) {
    console.error("Failed to notify shop owner about return request:", error);
  }
};

export const createReturnRequestService = async (
  customerId: string,
  input: {
    orderId: string;
    reason: "DAMAGED" | "WRONG_ITEM" | "MISSING_ITEM" | "NOT_AS_DESCRIBED" | "QUALITY_ISSUE" | "CHANGED_MIND" | "OTHER";
    resolution: "REFUND" | "REPLACEMENT";
    customerNote?: string;
    items: Array<{ orderItemId: string; quantity: number }>;
  },
) => {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, customerId, status: "DELIVERED", deletedAt: null },
    include: { items: true },
  });
  if (!order) throw new AppError("Only delivered orders can be returned.", 400);

  const requestedItemIds = new Set<string>();
  for (const item of input.items) {
    if (requestedItemIds.has(item.orderItemId)) {
      throw new AppError("Each order item can only be selected once.", 400);
    }
    requestedItemIds.add(item.orderItemId);
  }

  const orderItemMap = new Map(order.items.map((item) => [item.id, item]));
  const previousReturns = await prisma.returnItem.findMany({
    where: {
      orderItemId: { in: input.items.map((item) => item.orderItemId) },
      returnRequest: { status: { in: activeReturnStatuses } },
    },
    select: { orderItemId: true, quantity: true },
  });
  const returnedQuantities = new Map<string, number>();
  for (const item of previousReturns) {
    returnedQuantities.set(item.orderItemId, (returnedQuantities.get(item.orderItemId) ?? 0) + item.quantity);
  }

  for (const item of input.items) {
    const orderItem = orderItemMap.get(item.orderItemId);
    if (!orderItem) throw new AppError("One or more selected items do not belong to this order.", 400);
    const alreadyRequested = returnedQuantities.get(item.orderItemId) ?? 0;
    if (alreadyRequested + item.quantity > orderItem.quantity) {
      throw new AppError("The requested return quantity exceeds the remaining eligible quantity.", 400);
    }
  }

  const returnRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.returnRequest.create({
      data: {
        orderId: order.id,
        customerId,
        reason: input.reason,
        resolution: input.resolution,
        customerNote: input.customerNote,
        evidenceUrls: [],
        items: { create: input.items },
        statusHistory: { create: { status: "REQUESTED", note: "Return request submitted by customer." } },
      },
      include: returnInclude,
    });
    return created;
  });

  await notifyReturnRequested(returnRequest);
  return returnRequest;
};

export const getCustomerReturnsService = async (customerId: string) =>
  prisma.returnRequest.findMany({
    where: { customerId },
    include: returnInclude,
    orderBy: { createdAt: "desc" },
  });

export const getCustomerReturnByIdService = async (customerId: string, returnId: string) => {
  const returnRequest = await prisma.returnRequest.findFirst({
    where: { id: returnId, customerId },
    include: returnInclude,
  });
  if (!returnRequest) throw new AppError("Return request not found.", 404);
  return returnRequest;
};

export const cancelCustomerReturnService = async (customerId: string, returnId: string) => {
  const returnRequest = await prisma.returnRequest.findFirst({
    where: { id: returnId, customerId },
    select: { id: true, status: true },
  });
  if (!returnRequest) throw new AppError("Return request not found.", 404);
  if (!["REQUESTED", "UNDER_REVIEW"].includes(returnRequest.status)) {
    throw new AppError("This return request can no longer be cancelled.", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.returnStatusHistory.create({
      data: { returnRequestId: returnId, status: "CANCELLED", note: "Cancelled by customer." },
    });
    return tx.returnRequest.update({
      where: { id: returnId },
      data: { status: "CANCELLED", resolvedAt: new Date() },
      include: returnInclude,
    });
  });
  return updated;
};

export const updateCustomerReturnEvidenceService = async (
  customerId: string,
  returnId: string,
  evidenceUrls: string[],
) => {
  const returnRequest = await prisma.returnRequest.findFirst({
    where: { id: returnId, customerId },
    select: { id: true, status: true },
  });
  if (!returnRequest) throw new AppError("Return request not found.", 404);
  if (!["REQUESTED", "UNDER_REVIEW"].includes(returnRequest.status)) {
    throw new AppError("Evidence can only be added while the request is under review.", 400);
  }
  return prisma.returnRequest.update({
    where: { id: returnId },
    data: { evidenceUrls },
    include: returnInclude,
  });
};

const sellerTransitions: Record<string, ReturnStatus[]> = {
  REQUESTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["ITEM_RECEIVED", "CLOSED"],
  ITEM_SHIPPED: ["ITEM_RECEIVED"],
  ITEM_RECEIVED: ["REFUND_PENDING", "REPLACEMENT_SENT", "CLOSED"],
  REPLACEMENT_SENT: ["CLOSED"],
};

const notifyCustomerReturnUpdate = async (returnRequest: {
  id: string;
  orderId: string;
  customerId: string;
  status: ReturnStatus;
  note?: string;
}) => {
  try {
    await notifyUser({
      userId: returnRequest.customerId,
      type: "RETURN_UPDATED",
      title: "Return request updated",
      body: `Your return for order #${returnRequest.orderId.slice(-8).toUpperCase()} is now ${returnRequest.status.replaceAll("_", " ").toLowerCase()}.`,
      meta: { returnRequestId: returnRequest.id, orderId: returnRequest.orderId, status: returnRequest.status, note: returnRequest.note },
    });
  } catch (error) {
    console.error("Failed to notify customer about return update:", error);
  }
};

const ensureShopReturn = async (shopId: string, returnId: string) => {
  const returnRequest = await prisma.returnRequest.findFirst({
    where: { id: returnId, order: { shopId } },
    include: returnInclude,
  });
  if (!returnRequest) throw new AppError("Return request not found for this shop.", 404);
  return returnRequest;
};

export const getShopReturnsService = async (
  shopId: string,
  query: { status?: string; search?: string; page: number; limit: number },
) => {
  const where = {
    order: { shopId },
    ...(query.status && query.status !== "ALL" ? { status: query.status as ReturnStatus } : {}),
    ...(query.search
      ? {
          OR: [
            { id: { contains: query.search, mode: "insensitive" as const } },
            { orderId: { contains: query.search, mode: "insensitive" as const } },
            { order: { customer: { name: { contains: query.search, mode: "insensitive" as const } } } },
            { order: { customer: { email: { contains: query.search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };
  const [returns, total, statusCounts] = await prisma.$transaction([
    prisma.returnRequest.findMany({
      where,
      include: returnInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.groupBy({ by: ["status"], where, _count: { _all: true } }),
  ]);
  return {
    returns,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    statusCounts: Object.fromEntries(statusCounts.map((entry) => [entry.status, entry._count._all])),
  };
};

export const getShopReturnByIdService = (shopId: string, returnId: string) =>
  ensureShopReturn(shopId, returnId);

export const updateShopReturnStatusService = async (
  shopId: string,
  returnId: string,
  nextStatus: ReturnStatus,
  note?: string,
) => {
  const current = await ensureShopReturn(shopId, returnId);
  const allowed = sellerTransitions[current.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`A return cannot move from ${current.status} to ${nextStatus}.`, 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.returnStatusHistory.create({
      data: { returnRequestId: returnId, status: nextStatus, note: note || `Updated by shop.` },
    });
    return tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: nextStatus,
        sellerNote: note,
        resolvedAt: ["REJECTED", "CLOSED"].includes(nextStatus) ? new Date() : null,
      },
      include: returnInclude,
    });
  });

  await notifyCustomerReturnUpdate({
    id: updated.id,
    orderId: updated.orderId,
    customerId: updated.customerId,
    status: updated.status,
    note,
  });
  return updated;
};
