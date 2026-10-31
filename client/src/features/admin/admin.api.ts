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
    profile: { avatar: string | null; phone?: string | null } | null;
    ownedShops: { id: string; slug: string; status: string; profile?: { name: string } }[];
};

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED";
export type LegalDocumentType =
    | "CERTIFICATE_OF_INCORPORATION"
    | "BUSINESS_LICENSE"
    | "TAX_CERTIFICATE"
    | "PROOF_OF_ADDRESS"
    | "OWNER_IDENTITY_FRONT"
    | "OWNER_IDENTITY_BACK"
    | "BANK_STATEMENT"
    | "OPERATING_LICENSE"
    | "OTHER";
export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AdminShopLegalDocument = {
    id: string;
    shopLegalInfoId: string;
    type: LegalDocumentType;
    name: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    status: VerificationStatus;
    rejectionReason?: string | null;
    notes?: string | null;
    verifiedAt?: string | null;
    createdAt: string;
};

export type AdminShopLegalInfo = {
    id: string;
    shopId: string;
    legalBusinessName: string;
    taxId: string;
    entityType: string;
    businessVerificationStatus: VerificationStatus;
    taxIdStatus: VerificationStatus;
    taxIdNotes?: string | null;
    taxIdVerifiedAt?: string | null;
    registeredAddress?: string | null;
    addressVerificationStatus: VerificationStatus;
    addressVerificationNotes?: string | null;
    addressVerifiedAt?: string | null;
    ownerKycStatus: VerificationStatus;
    ownerIdType?: string | null;
    ownerIdNumber?: string | null;
    ownerIdCardFront?: string | null;
    ownerIdCardBack?: string | null;
    ownerKycNotes?: string | null;
    ownerKycVerifiedAt?: string | null;
    documents?: AdminShopLegalDocument[];
    _count?: { documents: number };
};

export type AdminShopAdminNote = {
    id: string;
    shopId: string;
    adminId: string;
    adminName?: string | null;
    content: string;
    createdAt: string;
};

export type AdminShopRiskFlag = {
    id: string;
    shopId: string;
    flag: string;
    severity: RiskSeverity;
    description?: string | null;
    resolved: boolean;
    resolvedAt?: string | null;
    resolvedBy?: string | null;
    createdAt: string;
};

export type AdminShopChecklistItem = {
    id: string;
    title: string;
    description: string;
    isComplete: boolean;
    status: string;
    badge: string;
};

export type AdminShopHealthScore = {
    score: number;
    tier: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    tierLabel: string;
    tierColor: string;
    openFlagsCount: number;
};

export type AdminShop = {
    id: string;
    slug: string;
    status: string;
    healthScore?: number;
    rejectionReason?: string | null;
    rejectionNotes?: string | null;
    rejectedAt?: string | null;
    suspensionReason?: string | null;
    suspensionNotes?: string | null;
    suspendedAt?: string | null;
    closureReason?: string | null;
    closureNotes?: string | null;
    closedAt?: string | null;
    reopenedAt?: string | null;
    reopenReason?: string | null;
    adminNotes?: string | null;
    createdAt: string;
    updatedAt?: string;
    owner: { id: string; name: string; email: string };
    profile: {
        logo: string | null;
        name: string;
        phone?: string | null;
        email?: string | null;
        city?: string | null;
        country?: string | null;
    } | null;
    wallet: { balance: number; payoutsEnabled?: boolean } | null;
    legalInfo?: AdminShopLegalInfo | null;
    riskFlags?: AdminShopRiskFlag[];
    _count: { products: number; orders: number };
};

export type AdminShopDetail = AdminShop & {
    owner: {
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        createdAt: string;
        profile: any;
    };
    profile: any;
    legalInfo: AdminShopLegalInfo | null;
    wallet: any;
    adminNotesList: AdminShopAdminNote[];
    riskFlags: AdminShopRiskFlag[];
    checklist: AdminShopChecklistItem[];
    completedSteps: number;
    totalSteps: number;
    progressPercent: number;
    healthScoreMeta: AdminShopHealthScore;
    _count: { products: number; orders: number; employees: number; reviews: number };
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
    stats?: {
        pendingCount: number;
        inReviewCount: number;
        activeCount: number;
        suspendedCount: number;
        highRiskCount: number;
    };
};

export type AdminUserFilters = { role?: string; status?: string; search?: string; page?: number; limit?: number };
export type AdminShopFilters = {
    status?: string;
    verificationStatus?: string;
    riskLevel?: string;
    tab?: "all" | "pending_queue" | "flagged" | "suspended";
    search?: string;
    page?: number;
    limit?: number;
};
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

    updateUserProfile: async (
        id: string,
        data: { name?: string; email?: string; role?: string; phone?: string }
    ) => {
        const res = await api.patch(`${base}/users/${id}/profile`, data);
        return res.data;
    },

    resetUserPassword: async (id: string, customPassword?: string) => {
        const res = await api.post(`${base}/users/${id}/reset-password`, { customPassword });
        return res.data.data;
    },

    sendUserEmail: async (id: string, data: { subject: string; message: string }) => {
        const res = await api.post(`${base}/users/${id}/send-email`, data);
        return res.data;
    },

    bulkUpdateUserStatus: async (userIds: string[], status: string) => {
        const res = await api.post(`${base}/users/bulk-status`, { userIds, status });
        return res.data;
    },

    bulkSendUserEmail: async (userIds: string[], subject: string, message: string) => {
        const res = await api.post(`${base}/users/bulk-email`, { userIds, subject, message });
        return res.data.data;
    },

    listShops: async (filters: AdminShopFilters = {}): Promise<AdminShopsResponse> => {
        const res = await api.get(`${base}/shops`, { params: filters });
        return res.data.data;
    },

    getShopById: async (id: string): Promise<AdminShopDetail> => {
        const res = await api.get(`${base}/shops/${id}`);
        return res.data.data;
    },

    updateShopStatus: async (id: string, status: string) => {
        const res = await api.patch(`${base}/shops/${id}/status`, { status });
        return res.data;
    },

    approveShop: async (id: string, notes?: string) => {
        const res = await api.post(`${base}/shops/${id}/approve`, { notes });
        return res.data;
    },

    rejectShop: async (id: string, reason: string, notes?: string) => {
        const res = await api.post(`${base}/shops/${id}/reject`, { reason, notes });
        return res.data;
    },

    suspendShop: async (id: string, reason: string, notes?: string) => {
        const res = await api.post(`${base}/shops/${id}/suspend`, { reason, notes });
        return res.data;
    },

    closeShop: async (id: string, reason: string, notes?: string) => {
        const res = await api.post(`${base}/shops/${id}/close`, { reason, notes });
        return res.data;
    },

    reopenShop: async (id: string, reason: string, targetStatus?: "ACTIVE" | "PENDING") => {
        const res = await api.post(`${base}/shops/${id}/reopen`, { reason, targetStatus });
        return res.data;
    },

    updateShopVerification: async (id: string, data: any) => {
        const res = await api.patch(`${base}/shops/${id}/verification`, data);
        return res.data;
    },

    addShopDocument: async (shopId: string, data: any) => {
        const res = await api.post(`${base}/shops/${shopId}/documents`, data);
        return res.data;
    },

    updateShopDocumentStatus: async (documentId: string, status: string, rejectionReason?: string, notes?: string) => {
        const res = await api.patch(`${base}/shops/current/documents/${documentId}`, { status, rejectionReason, notes });
        return res.data;
    },

    deleteShopDocument: async (documentId: string) => {
        const res = await api.delete(`${base}/shops/current/documents/${documentId}`);
        return res.data;
    },

    addShopAdminNote: async (shopId: string, content: string) => {
        const res = await api.post(`${base}/shops/${shopId}/notes`, { content });
        return res.data;
    },

    addShopRiskFlag: async (shopId: string, data: { flag: string; severity?: string; description?: string }) => {
        const res = await api.post(`${base}/shops/${shopId}/risk-flags`, data);
        return res.data;
    },

    resolveShopRiskFlag: async (flagId: string, notes?: string) => {
        const res = await api.patch(`${base}/shops/current/risk-flags/${flagId}/resolve`, { notes });
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

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────
export type AdminOrder = {
    id: string;
    status: string;
    totalAmount: string | number;
    discountAmount: string | number;
    createdAt: string;
    customer: { id: string; name: string; email: string };
    shop: { id: string; slug: string; profile: { name: string } | null };
    _count: { items: number };
};

export type AdminOrderDetail = AdminOrder & {
    items: {
        id: string;
        quantity: number;
        unitPrice: string | number;
        product: { id: string; name: string; images: { url: string }[] };
        variant: { id: string; name: string } | null;
    }[];
    shipment: {
        id: string;
        method: string;
        fee: string | number;
        carrier: string | null;
        trackingNumber: string | null;
        trackingUrl: string | null;
        shippedAt: string | null;
        deliveredAt: string | null;
    } | null;
    coupon: { id: string; code: string; type: string; value: string | number } | null;
};

export type AdminOrdersResponse = {
    orders: AdminOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type AdminOrderFilters = {
    status?: string;
    shopId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export type PlatformAnalytics = {
    gmv: number;
    ordersByStatus: { status: string; count: number }[];
    topShops: { shopId: string; shopName: string; revenue: number; orderCount: number }[];
    userGrowth: { month: string; count: number }[];
    ordersByMonth: { month: string; count: number; revenue: number }[];
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUTS
// ─────────────────────────────────────────────────────────────────────────────
export type AdminPayoutShop = {
    id: string;
    slug: string;
    status: string;
    owner: { id: string; name: string; email: string };
    profile: { name: string; logo: string | null } | null;
    wallet: { id: string; balance: string | number; updatedAt: string } | null;
    walletTransactions: { createdAt: string; amount: string | number }[];
};

export type AdminPayoutsResponse = {
    shops: AdminPayoutShop[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type PayoutsSummary = {
    totalPlatformBalance: number;
    shopsWithBalance: number;
    totalWithdrawn: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// BILLING
// ─────────────────────────────────────────────────────────────────────────────
export type AdminBillingShop = {
    id: string;
    slug: string;
    status: string;
    createdAt: string;
    owner: { id: string; name: string; email: string };
    profile: { name: string; logo: string | null } | null;
    wallet: { balance: string | number } | null;
    membership: {
        status: string;
        expiresAt: string;
        plan: { name: string; price: string | number; billingCycle: string };
    } | null;
    _count: { products: number; orders: number };
};

export type BillingOverview = {
    shops: AdminBillingShop[];
    totalActive: number;
    totalSuspended: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────
export type AdminAuditLog = {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue: any;
    newValue: any;
    ip: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string };
};

export type AdminAuditLogsResponse = {
    logs: AdminAuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type AdminAuditFilters = {
    userId?: string;
    entity?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// COUPONS
// ─────────────────────────────────────────────────────────────────────────────
export type AdminCoupon = {
    id: string;
    code: string;
    type: string;
    value: string | number;
    minOrderAmount: string | number | null;
    maxUses: number | null;
    usedCount: number;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
    shopId: string;
    shop: { id: string; slug: string; profile: { name: string } | null };
    _count: { usages: number };
};

export type AdminCouponsResponse = {
    coupons: AdminCoupon[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: { total: number; active: number; expired: number };
};

export type AdminCouponFilters = {
    shopId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
export type AdminProduct = {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    sku: string | null;
    type: string;
    status: "ACTIVE" | "DRAFT" | "ARCHIVED";
    basePrice: number | string;
    stock: number;
    createdAt: string;
    updatedAt: string;
    shopId: string;
    shop: {
        id: string;
        slug: string;
        profile: { name: string; logo: string | null } | null;
        owner: { id: string; name: string; email: string };
    };
    platformCategory: { id: string; name: string } | null;
    images: { id: string; url: string; isPrimary: boolean }[];
    _count: { variants: number; reviews: number; orderItems: number };
};

export type AdminProductsResponse = {
    products: AdminProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: {
        total: number;
        active: number;
        draft: number;
        archived: number;
        outOfStock: number;
    };
};

export type AdminProductFilters = {
    search?: string;
    status?: string;
    shopId?: string;
    platformCategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Extended adminApi
// ─────────────────────────────────────────────────────────────────────────────
export const adminApiExtended = {
    // Products
    listProducts: async (filters: AdminProductFilters = {}): Promise<AdminProductsResponse> => {
        const res = await api.get(`${base}/products`, { params: filters });
        return res.data.data;
    },
    getProductById: async (id: string): Promise<any> => {
        const res = await api.get(`${base}/products/${id}`);
        return res.data.data;
    },
    updateProductStatus: async (id: string, status: "ACTIVE" | "DRAFT" | "ARCHIVED") => {
        const res = await api.patch(`${base}/products/${id}/status`, { status });
        return res.data.data;
    },
    // Orders
    listOrders: async (filters: AdminOrderFilters = {}): Promise<AdminOrdersResponse> => {
        const res = await api.get(`${base}/orders`, { params: filters });
        return res.data.data;
    },
    getOrderById: async (id: string): Promise<AdminOrderDetail> => {
        const res = await api.get(`${base}/orders/${id}`);
        return res.data.data;
    },

    // Analytics
    getPlatformAnalytics: async (): Promise<PlatformAnalytics> => {
        const res = await api.get(`${base}/analytics/platform`);
        return res.data.data;
    },

    // Payouts
    listPayouts: async (filters: { page?: number; limit?: number } = {}): Promise<AdminPayoutsResponse> => {
        const res = await api.get(`${base}/payouts`, { params: filters });
        return res.data.data;
    },
    getPayoutsSummary: async (): Promise<PayoutsSummary> => {
        const res = await api.get(`${base}/payouts/summary`);
        return res.data.data;
    },

    // Billing
    getBillingOverview: async (): Promise<BillingOverview> => {
        const res = await api.get(`${base}/billing/overview`);
        return res.data.data;
    },

    // Audit Logs
    listAuditLogs: async (filters: AdminAuditFilters = {}): Promise<AdminAuditLogsResponse> => {
        const res = await api.get(`${base}/audit-logs`, { params: filters });
        return res.data.data;
    },

    // Coupons
    listCoupons: async (filters: AdminCouponFilters = {}): Promise<AdminCouponsResponse> => {
        const res = await api.get(`${base}/coupons`, { params: filters });
        return res.data.data;
    },
    toggleCoupon: async (id: string) => {
        const res = await api.patch(`${base}/coupons/${id}/toggle`);
        return res.data.data;
    },

    // Impersonation
    impersonateUser: async (id: string): Promise<{ accessToken: string; user: any }> => {
        const res = await api.post(`${base}/users/${id}/impersonate`);
        return res.data.data;
    },
};