import { api } from "@/lib/axios";

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

export type AdminUsersResponse = {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type AdminShopsResponse = {
    shops: AdminShop[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type AdminUserFilters = { role?: string; status?: string; search?: string; page?: number; limit?: number };
export type AdminShopFilters = { status?: string; search?: string; page?: number; limit?: number };
export type AdminReturn = {
    id: string;
    orderId: string;
    status: string;
    reason: string;
    resolution: string;
    customerNote: string | null;
    sellerNote: string | null;
    evidenceUrls: string[];
    createdAt: string;
    order: { id: string; totalAmount: number | string; customer: { name: string; email: string }; shop: { id: string; slug: string; profile: { name: string } | null } };
    items: { quantity: number; orderItem: { product: { name: string; images: { url: string }[] }; variant: { name: string } | null } }[];
};
export type AdminReturnsResponse = {
    returns: AdminReturn[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    statusCounts: Record<string, number>;
};

const base = "/admin";

export const adminApi = {
    getStats: async (): Promise<AdminStatsResponse> => {
        const res = await api.get(`${base}/stats`);
        return res.data.data;
    },

    listUsers: async (filters: AdminUserFilters = {}): Promise<AdminUsersResponse> => {
        const res = await api.get(`${base}/users`, { params: filters });
        return res.data.data;
    },

    getUserById: async (id: string): Promise<AdminUser & { profile: any; ownedShops: any[] }> => {
        const res = await api.get(`${base}/users/${id}`);
        return res.data.data;
    },

    updateUserRole: async (id: string, role: string) => {
        const res = await api.patch(`${base}/users/${id}/role`, { role });
        return res.data;
    },

    updateUserStatus: async (id: string, status: string) => {
        const res = await api.patch(`${base}/users/${id}/status`, { status });
        return res.data;
    },

    listShops: async (filters: AdminShopFilters = {}): Promise<AdminShopsResponse> => {
        const res = await api.get(`${base}/shops`, { params: filters });
        return res.data.data;
    },

    getShopById: async (id: string): Promise<AdminShop & { profile: any; wallet: any }> => {
        const res = await api.get(`${base}/shops/${id}`);
        return res.data.data;
    },

    updateShopStatus: async (id: string, status: string) => {
        const res = await api.patch(`${base}/shops/${id}/status`, { status });
        return res.data;
    },

    listReviews: async (filters: AdminReviewFilters = {}): Promise<AdminReviewsResponse> => {
        const res = await api.get(`${base}/reviews`, { params: filters });
        return res.data.data;
    },

    toggleReviewVisibility: async (id: string, isVisible: boolean) => {
        const res = await api.patch(`${base}/reviews/${id}/visibility`, { isVisible });
        return res.data;
    },

    deleteReview: async (id: string) => {
        const res = await api.delete(`${base}/reviews/${id}`);
        return res.data;
    },
    listShipments: async (filters: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
        const res = await api.get(`${base}/shipments`, { params: filters });
        return res.data.data as { shipments: any[]; total: number; stats: { pending: number; shipped: number; delivered: number } };
    },
    listReturns: async (filters: { status?: string; search?: string; page?: number; limit?: number } = {}): Promise<AdminReturnsResponse> => {
        const res = await api.get(`${base}/returns`, { params: filters });
        return res.data.data;
    },
    getReturn: async (id: string): Promise<AdminReturn> => {
        const res = await api.get(`${base}/returns/${id}`);
        return res.data.data;
    },
    refundReturn: async (id: string) => {
        const res = await api.post(`${base}/returns/${id}/refund`);
        return res.data.data;
    },
};

export type AdminReview = {
    id: string;
    shopId: string;
    productId: string;
    userId: string;
    rating: number;
    comment: string | null;
    isVisible: boolean;
    createdAt: string;
    updatedAt: string;
    product: {
        id: string;
        name: string;
        slug: string;
        images: { url: string }[];
    };
    shop: {
        id: string;
        slug: string;
        profile: { name: string } | null;
    };
    user: {
        id: string;
        name: string;
        email: string;
    };
    reply: {
        id: string;
        comment: string;
        createdAt: string;
    } | null;
};

export type AdminReviewsResponse = {
    reviews: AdminReview[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: {
        totalPlatformReviews: number;
        visibleCount: number;
        hiddenCount: number;
        avgRating: number;
    };
};

export type AdminReviewFilters = {
    search?: string;
    rating?: number;
    isVisible?: boolean;
    shopId?: string;
    page?: number;
    limit?: number;
};
