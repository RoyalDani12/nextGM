import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, adminApiExtended, type AdminShopFilters, type AdminUserFilters, type AdminReviewFilters, type AdminOrderFilters, type AdminAuditFilters, type AdminCouponFilters, type AdminProductFilters } from "./admin.api";
// import { toast } from "react-hot-toast";

export const useAdminStats = () =>
    useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.getStats, staleTime: 60_000 });

export const useAdminUsers = (filters: AdminUserFilters) =>
    useQuery({
        queryKey: ["admin", "users", filters],
        queryFn: () => adminApi.listUsers(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

export const useAdminUser = (id: string) =>
    useQuery({
        queryKey: ["admin", "users", id],
        queryFn: () => adminApi.getUserById(id),
        enabled: !!id,
    });

export const useUpdateUserRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
        onSuccess: () => {
            alert("User role updated");
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to update role"),
    });
};

export const useUpdateUserStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateUserStatus(id, status),
        onSuccess: () => {
            alert("User status updated");
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to update status"),
    });
};

export const useAdminShops = (filters: AdminShopFilters) =>
    useQuery({
        queryKey: ["admin", "shops", filters],
        queryFn: () => adminApi.listShops(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

export const useAdminShop = (id: string) =>
    useQuery({
        queryKey: ["admin", "shops", id],
        queryFn: () => adminApi.getShopById(id),
        enabled: !!id,
    });

export const useUpdateShopStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateShopStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useApproveShop = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) => adminApi.approveShop(id, notes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useRejectShop = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
            adminApi.rejectShop(id, reason, notes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useSuspendShop = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
            adminApi.suspendShop(id, reason, notes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useCloseShop = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
            adminApi.closeShop(id, reason, notes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useReopenShop = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason, targetStatus }: { id: string; reason: string; targetStatus?: "ACTIVE" | "PENDING" }) =>
            adminApi.reopenShop(id, reason, targetStatus),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useUpdateShopVerification = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateShopVerification(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useAddShopDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shopId, data }: { shopId: string; data: any }) => adminApi.addShopDocument(shopId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useUpdateShopDocumentStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            documentId,
            status,
            rejectionReason,
            notes,
        }: {
            documentId: string;
            status: string;
            rejectionReason?: string;
            notes?: string;
        }) => adminApi.updateShopDocumentStatus(documentId, status, rejectionReason, notes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useDeleteShopDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ documentId }: { documentId: string }) => adminApi.deleteShopDocument(documentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useAddShopAdminNote = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shopId, content }: { shopId: string; content: string }) =>
            adminApi.addShopAdminNote(shopId, content),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useAddShopRiskFlag = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shopId, data }: { shopId: string; data: { flag: string; severity?: string; description?: string } }) =>
            adminApi.addShopRiskFlag(shopId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useResolveShopRiskFlag = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ flagId, notes }: { flagId: string; notes?: string }) =>
            adminApi.resolveShopRiskFlag(flagId, notes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });
};

export const useAdminReviews = (filters: AdminReviewFilters) =>
    useQuery({
        queryKey: ["admin", "reviews", filters],
        queryFn: () => adminApi.listReviews(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

export const useToggleReviewVisibility = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
            adminApi.toggleReviewVisibility(id, isVisible),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
        },
    });
};

export const useAdminDeleteReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.deleteReview(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
        },
    });
};

export const useAdminShipments = (filters: { status?: string; search?: string; page?: number; limit?: number }) =>
    useQuery({ queryKey: ["admin", "shipments", filters], queryFn: () => adminApi.listShipments(filters), placeholderData: (previous) => previous });

export const useAdminReturns = (filters: { status?: string; search?: string; page?: number; limit?: number }) =>
    useQuery({ queryKey: ["admin", "returns", filters], queryFn: () => adminApi.listReturns(filters), placeholderData: (previous) => previous });

export const useRefundReturn = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.refundReturn(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "returns"] }),
    });
};

// ─── Orders ───────────────────────────────────
export const useAdminOrders = (filters: AdminOrderFilters) =>
    useQuery({
        queryKey: ["admin", "orders", filters],
        queryFn: () => adminApiExtended.listOrders(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

export const useAdminOrderById = (id: string) =>
    useQuery({
        queryKey: ["admin", "orders", id],
        queryFn: () => adminApiExtended.getOrderById(id),
        enabled: !!id,
    });

// ─── Analytics ────────────────────────────────
export const usePlatformAnalytics = () =>
    useQuery({
        queryKey: ["admin", "analytics", "platform"],
        queryFn: () => adminApiExtended.getPlatformAnalytics(),
        staleTime: 60_000,
    });

// ─── Payouts ──────────────────────────────────
export const useAdminPayouts = (filters: { page?: number; limit?: number }) =>
    useQuery({
        queryKey: ["admin", "payouts", filters],
        queryFn: () => adminApiExtended.listPayouts(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

export const usePayoutsSummary = () =>
    useQuery({
        queryKey: ["admin", "payouts", "summary"],
        queryFn: () => adminApiExtended.getPayoutsSummary(),
        staleTime: 60_000,
    });

// ─── Billing ──────────────────────────────────
export const useBillingOverview = () =>
    useQuery({
        queryKey: ["admin", "billing", "overview"],
        queryFn: () => adminApiExtended.getBillingOverview(),
        staleTime: 60_000,
    });

// ─── Audit Logs ───────────────────────────────
export const useAdminAuditLogs = (filters: AdminAuditFilters) =>
    useQuery({
        queryKey: ["admin", "audit-logs", filters],
        queryFn: () => adminApiExtended.listAuditLogs(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

// ─── Coupons ──────────────────────────────────
export const useAdminCoupons = (filters: AdminCouponFilters) =>
    useQuery({
        queryKey: ["admin", "coupons", filters],
        queryFn: () => adminApiExtended.listCoupons(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

export const useToggleCoupon = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApiExtended.toggleCoupon(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to toggle coupon"),
    });
};

// ─── Products ─────────────────────────────────
export const useAdminProducts = (filters: AdminProductFilters) =>
    useQuery({
        queryKey: ["admin", "products", filters],
        queryFn: () => adminApiExtended.listProducts(filters),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

export const useAdminProductById = (id: string) =>
    useQuery({
        queryKey: ["admin", "products", id],
        queryFn: () => adminApiExtended.getProductById(id),
        enabled: !!id,
    });

export const useUpdateProductStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "DRAFT" | "ARCHIVED" }) =>
            adminApiExtended.updateProductStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to update product status"),
    });
};
export const useUpdateUserProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; role?: string; phone?: string } }) =>
            adminApi.updateUserProfile(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to update profile"),
    });
};

export const useResetUserPassword = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, customPassword }: { id: string; customPassword?: string }) =>
            adminApi.resetUserPassword(id, customPassword),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to reset password"),
    });
};

export const useSendUserEmail = () => {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { subject: string; message: string } }) =>
            adminApi.sendUserEmail(id, data),
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to send email"),
    });
};

export const useBulkUpdateUserStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userIds, status }: { userIds: string[]; status: string }) =>
            adminApi.bulkUpdateUserStatus(userIds, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to perform bulk status update"),
    });
};

export const useBulkSendUserEmail = () => {
    return useMutation({
        mutationFn: ({ userIds, subject, message }: { userIds: string[]; subject: string; message: string }) =>
            adminApi.bulkSendUserEmail(userIds, subject, message),
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to send bulk email"),
    });
};

