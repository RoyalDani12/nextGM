import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminShopFilters, type AdminUserFilters, type AdminReviewFilters } from "./admin.api";
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
            alert("Shop status updated");
            qc.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
        onError: (err: any) => alert(err?.response?.data?.message ?? "Failed to update shop status"),
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

