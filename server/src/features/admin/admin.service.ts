import { AppError } from "../../middleware/appError.js";
import {
    getPlatformStats,
    listUsersAdmin,
    getUserByIdAdmin,
    updateUserRoleAdmin,
    updateUserStatusAdmin,
    listShopsAdmin,
    getShopByIdAdmin,
    updateShopStatusAdmin,
    listReviewsAdmin,
    updateReviewVisibilityAdmin,
    deleteReviewAdmin,
    listShipmentsAdmin,
    listReturnsAdmin,
    getReturnAdmin,
    setReturnRefundPendingAdmin,
} from "./admin.repository.js";
import { initiateRefundService } from "../payment/payment.service.js";

export const getPlatformStatsService = async () => {
    return getPlatformStats();
};

export const listUsersService = async (filters: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    return listUsersAdmin(filters);
};

export const getUserByIdService = async (id: string) => {
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);
    return user;
};

export const updateUserRoleService = async (id: string, role: string) => {
    const validRoles = ["CUSTOMER", "SHOP_OWNER", "SUPER_ADMIN"];
    if (!validRoles.includes(role)) throw new AppError("Invalid role", 400);
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);
    return updateUserRoleAdmin(id, role);
};

export const updateUserStatusService = async (id: string, status: string) => {
    const validStatuses = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid status", 400);
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);
    return updateUserStatusAdmin(id, status);
};

export const listShopsService = async (filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    return listShopsAdmin(filters);
};

export const getShopByIdService = async (id: string) => {
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    return shop;
};

export const updateShopStatusService = async (id: string, status: string) => {
    const validStatuses = ["ACTIVE", "PAUSED", "SUSPENDED", "CLOSED"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid shop status", 400);
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    if (shop.status === "CLOSED") throw new AppError("Cannot change status of a closed shop", 400);
    return updateShopStatusAdmin(id, status);
};

export const listReviewsService = async (filters: {
    search?: string;
    rating?: number;
    isVisible?: boolean;
    shopId?: string;
    page?: number;
    limit?: number;
}) => {
    return listReviewsAdmin(filters);
};

export const toggleReviewVisibilityService = async (id: string, isVisible: boolean) => {
    return updateReviewVisibilityAdmin(id, isVisible);
};

export const deleteReviewAdminService = async (id: string) => {
    return deleteReviewAdmin(id);
};

export const listShipmentsService = (filters: { status?: string; search?: string; page?: number; limit?: number }) => listShipmentsAdmin(filters);

export const listReturnsService = (filters: { status?: string; search?: string; page?: number; limit?: number }) => listReturnsAdmin(filters);

export const getReturnService = async (id: string) => {
    const request = await getReturnAdmin(id);
    if (!request) throw new AppError("Return request not found.", 404);
    return request;
};

export const refundReturnService = async (id: string) => {
    const request = await getReturnAdmin(id);
    if (!request) throw new AppError("Return request not found.", 404);
    if (request.resolution !== "REFUND") throw new AppError("This return requests a replacement, not a refund.", 400);
    if (request.status !== "ITEM_RECEIVED") throw new AppError("The return must be marked as received before refunding.", 400);
    const updated = await setReturnRefundPendingAdmin(id);
    if (!updated) throw new AppError("Return request not found.", 404);
    try {
        return await initiateRefundService(request.orderId);
    } catch (error) {
        await prismaReturnRollback(id);
        throw error;
    }
};

const prismaReturnRollback = async (id: string) => {
    const { prisma } = await import("../../config/db.js");
    await prisma.$transaction(async (tx) => {
        await tx.returnStatusHistory.create({ data: { returnRequestId: id, status: "ITEM_RECEIVED", note: "Refund initiation failed; returned to received state." } });
        await tx.returnRequest.update({ where: { id }, data: { status: "ITEM_RECEIVED" } });
    });
};
