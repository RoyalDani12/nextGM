import { axiosInstance } from "@/lib/axios";

export type AdminStatsResponse = {
    totalUsers: number;
    totalShops: number;
    totalOrders: number;
    platformBalance: number;
    monthlyUsers: { month: string; count: number }[];
    monthlyShops: { month: string; count: number }[];
    monthlyOrders: { month: string; count: number; revenue: number }[];
};

export type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    profile: { avatar: string | null } | null;
    ownedShops: { id: string; slug: string; status: string; profile?: { name: string } }[];
};

export type AdminShop = {
    id: string;
    slug: string;
    status: string;
    createdAt: string;
    owner: { id: string; name: string; email: string };
    profile: { logo: string | null; name: string } | null;
    wallet: { balance: number } | null;
    _count: { products: number; orders: number };
};

export type AdminListResponse<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type AdminUserFilters = { role?: string; status?: string; search?: string; page?: number; limit?: number };
export type AdminShopFilters = { status?: string; search?: string; page?: number; limit?: number };

const base = "/admin";

export const adminApi = {
    getStats: async (): Promise<AdminStatsResponse> => {
        const res = await axiosInstance.get(`${base}/stats`);
        return res.data.data;
    },

    listUsers: async (filters: AdminUserFilters = {}): Promise<AdminListResponse<AdminUser>> => {
        const res = await axiosInstance.get(`${base}/users`, { params: filters });
        return res.data.data;
    },

    getUserById: async (id: string): Promise<AdminUser & { profile: any; ownedShops: any[] }> => {
        const res = await axiosInstance.get(`${base}/users/${id}`);
        return res.data.data;
    },

    updateUserRole: async (id: string, role: string) => {
        const res = await axiosInstance.patch(`${base}/users/${id}/role`, { role });
        return res.data;
    },

    updateUserStatus: async (id: string, status: string) => {
        const res = await axiosInstance.patch(`${base}/users/${id}/status`, { status });
        return res.data;
    },

    listShops: async (filters: AdminShopFilters = {}): Promise<AdminListResponse<AdminShop>> => {
        const res = await axiosInstance.get(`${base}/shops`, { params: filters });
        return res.data.data;
    },

    getShopById: async (id: string): Promise<AdminShop & { profile: any; wallet: any }> => {
        const res = await axiosInstance.get(`${base}/shops/${id}`);
        return res.data.data;
    },

    updateShopStatus: async (id: string, status: string) => {
        const res = await axiosInstance.patch(`${base}/shops/${id}/status`, { status });
        return res.data;
    },
};
