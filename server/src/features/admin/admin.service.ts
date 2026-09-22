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
} from "./admin.repository.js";

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
