import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    Mail,
    Edit2,
    KeyRound,
    Ban,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    X,
    Users,
    Download,
    MoreVertical,
    Eye,
    ShieldCheck,
    Store,
    AlertCircle,
    Filter,
} from "lucide-react";
import {
    useAdminUsers,
    useUpdateUserStatus,
    useUpdateUserProfile,
    useResetUserPassword,
    useSendUserEmail,
    useBulkUpdateUserStatus,
    useBulkSendUserEmail,
} from "@/features/admin/admin.hooks";
import type { AdminUser } from "@/features/admin/admin.api";
import { useAuthStore } from "@/store/auth.store";
import { ModalPortal } from "@/components/ui/ds-components";

const ROLES = [
    { value: "", label: "All Roles" },
    { value: "CUSTOMER", label: "Customer" },
    { value: "SHOP_OWNER", label: "Shop Owner" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
];

const STATUSES = [
    { value: "", label: "All Statuses", dot: "bg-slate-400" },
    { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
    { value: "PENDING", label: "Pending", dot: "bg-amber-500" },
    { value: "SUSPENDED", label: "Suspended", dot: "bg-rose-500" },
    { value: "DEACTIVATED", label: "Deactivated", dot: "bg-slate-400" },
];

const LIMITS = [10, 20, 50, 100];

const RoleBadge = ({ role }: { role: string }) => {
    const badges: Record<string, { bg: string; text: string; border: string }> = {
        SUPER_ADMIN: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
        SHOP_OWNER: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
        CUSTOMER: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
        SHOP_EMPLOYEE: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
    };
    const style = badges[role] ?? { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
            {role.replace("_", " ")}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const badges: Record<string, { bg: string; text: string; dot: string }> = {
        ACTIVE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "Active", dot: "bg-emerald-500" },
        PENDING: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "Pending", dot: "bg-amber-500" },
        SUSPENDED: { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "Suspended", dot: "bg-rose-500" },
        DEACTIVATED: { bg: "bg-slate-100 text-slate-600 border-slate-200", text: "Deactivated", dot: "bg-slate-400" },
        DELETED: { bg: "bg-rose-100 text-rose-800 border-rose-300", text: "Deleted", dot: "bg-rose-600" },
    };
    const style = badges[status] ?? { bg: "bg-slate-100 text-slate-700 border-slate-200", text: status, dot: "bg-slate-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg}`}>
            <span className={`size-1.5 rounded-full ${style.dot}`} />
            {style.text}
        </span>
    );
};

export const AdminUsersPage = () => {
    const navigate = useNavigate();
    const currentAdmin = useAuthStore((s) => s.user);

    // Search and filter state
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Filter dropdown toggle states
    const [openFilterDropdown, setOpenFilterDropdown] = useState<"role" | "status" | "limit" | null>(null);

    // Multi-select state
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // 3-dot Floating Dropdown state (uses viewport coordinates to NEVER get clipped by table)
    const [dropdownState, setDropdownState] = useState<{
        userId: string;
        user: AdminUser;
        top: number;
        right: number;
        openUpwards: boolean;
    } | null>(null);

    // Modals state
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [emailingUser, setEmailingUser] = useState<AdminUser | null>(null);
    const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
    const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
    const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const { data, isLoading, isError } = useAdminUsers({ search, role, status, page, limit });
    const updateStatus = useUpdateUserStatus();
    const bulkUpdateStatus = useBulkUpdateUserStatus();

    // Close fixed dropdown on scroll or window resize
    useEffect(() => {
        const handleScrollOrResize = () => setDropdownState(null);
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, []);

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setFeedbackNotice({ text, type });
        setTimeout(() => setFeedbackNotice(null), 3500);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
        setSelectedUserIds([]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!data?.users) return;
        if (e.target.checked) {
            // Self account is excluded from bulk selection for safety
            const selectableIds = data.users
                .filter((u) => u.id !== currentAdmin?.id)
                .map((u) => u.id);
            setSelectedUserIds(selectableIds);
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleToggleSelectUser = (id: string) => {
        if (id === currentAdmin?.id) return; // Prevent self-selection
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleBulkStatusChange = (newStatus: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") => {
        const sanitizedIds = selectedUserIds.filter((id) => id !== currentAdmin?.id);
        if (!sanitizedIds.length) {
            showToast("No eligible users selected for this action.", "error");
            return;
        }

        const actionLabel = newStatus === "SUSPENDED" ? "BAN / SUSPEND" : newStatus === "DEACTIVATED" ? "DEACTIVATE" : "ACTIVATE";
        if (window.confirm(`Are you sure you want to ${actionLabel} ${sanitizedIds.length} selected users?`)) {
            bulkUpdateStatus.mutate(
                { userIds: sanitizedIds, status: newStatus },
                {
                    onSuccess: () => {
                        setSelectedUserIds([]);
                        showToast(`Successfully updated ${sanitizedIds.length} users to ${newStatus}.`, "success");
                    },
                    onError: (err: any) => {
                        showToast(err?.response?.data?.message || "Failed to update bulk status", "error");
                    },
                }
            );
        }
    };

    const handleExportCSV = () => {
        const usersToExport = selectedUserIds.length > 0
            ? (data?.users || []).filter((u) => selectedUserIds.includes(u.id))
            : (data?.users || []);

        if (!usersToExport.length) {
            showToast("No user records available to export.", "error");
            return;
        }

        const headers = ["User ID", "Full Name", "Email Address", "Phone", "Role", "Status", "Stores Count", "Joined Date"];
        const rows = usersToExport.map((u) => [
            `"${u.id}"`,
            `"${(u.name || "").replace(/"/g, '""')}"`,
            `"${(u.email || "").replace(/"/g, '""')}"`,
            `"${(u.profile?.phone || "").replace(/"/g, '""')}"`,
            `"${u.role}"`,
            `"${u.status}"`,
            `"${u.ownedShops?.length || 0}"`,
            `"${new Date(u.createdAt).toISOString().slice(0, 10)}"`,
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `nexions-users-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Exported ${usersToExport.length} user records to CSV`, "success");
    };

    // Calculate fixed dropdown coordinates to guarantee ZERO table clipping
    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, user: AdminUser) => {
        e.stopPropagation();
        if (dropdownState?.userId === user.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        // If button is within 280px of the bottom of the viewport, open upwards
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 280;

        setDropdownState({
            userId: user.id,
            user,
            top: openUpwards ? rect.top - 6 : rect.bottom + 6,
            right: window.innerWidth - rect.right,
            openUpwards,
        });
    };

    // Pagination helper: Smart numbers with ellipsis
    const renderPaginationNumbers = () => {
        if (!data) return null;
        const totalPages = data.totalPages || 1;
        const pages: (number | string)[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push("...");
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (page < totalPages - 2) pages.push("...");
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }

        return pages.map((p, idx) => {
            if (p === "...") {
                return (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs select-none">
                        …
                    </span>
                );
            }
            const isCurrent = p === page;
            return (
                <button
                    key={`page-${p}`}
                    onClick={() => {
                        setPage(Number(p));
                        setSelectedUserIds([]);
                    }}
                    className={`min-w-8 h-8 px-2 text-xs font-bold rounded-lg transition-all ${
                        isCurrent
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                    {p}
                </button>
            );
        });
    };

    const isAllSelected =
        !!data?.users?.length &&
        data.users.filter((u) => u.id !== currentAdmin?.id).length > 0 &&
        selectedUserIds.length === data.users.filter((u) => u.id !== currentAdmin?.id).length;

    const currentRoleLabel = ROLES.find((r) => r.value === role)?.label || "All Roles";
    const currentStatusItem = STATUSES.find((s) => s.value === status) || STATUSES[0];

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <Users className="size-6 text-orange-500" />
                        Users & Access Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {data ? `${data.total.toLocaleString()} total platform accounts` : "Manage accounts, security status, and communication"}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* CSV Export Button */}
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 rounded-xl shadow-sm transition-all"
                        title="Export filtered or selected users to CSV report"
                    >
                        <Download size={14} className="text-orange-500" />
                        Export CSV
                    </button>

                    {feedbackNotice && (
                        <span
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border animate-in fade-in ${
                                feedbackNotice.type === "success"
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                    : "text-rose-700 bg-rose-50 border-rose-200"
                            }`}
                        >
                            {feedbackNotice.text}
                        </span>
                    )}
                </div>
            </div>

            {/* Top Search & Interactive Filter Dropdowns */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or user ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-100 transition-all shrink-0"
                    >
                        Search
                    </button>
                </form>

                {/* Filter Dropdown Buttons */}
                <div className="flex flex-wrap items-center gap-2 relative">
                    {/* Role Filter Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "role" ? null : "role");
                            }}
                            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                                role
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-slate-50/50 hover:bg-white text-slate-700 border-slate-200"
                            }`}
                        >
                            <Filter size={13} className={role ? "text-orange-500" : "text-slate-400"} />
                            <span>{currentRoleLabel}</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "role" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {ROLES.map((r) => (
                                        <button
                                            key={r.value}
                                            onClick={() => {
                                                setRole(r.value);
                                                setPage(1);
                                                setSelectedUserIds([]);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3.5 py-2 text-xs flex items-center justify-between font-medium transition-colors ${
                                                role === r.value
                                                    ? "bg-orange-50 text-orange-700 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span>{r.label}</span>
                                            {role === r.value && <Check size={13} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "status" ? null : "status");
                            }}
                            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                                status
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-slate-50/50 hover:bg-white text-slate-700 border-slate-200"
                            }`}
                        >
                            <span className={`size-1.5 rounded-full ${currentStatusItem.dot}`} />
                            <span>{currentStatusItem.label}</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "status" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s.value}
                                            onClick={() => {
                                                setStatus(s.value);
                                                setPage(1);
                                                setSelectedUserIds([]);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3.5 py-2 text-xs flex items-center justify-between font-medium transition-colors ${
                                                status === s.value
                                                    ? "bg-orange-50 text-orange-700 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`size-1.5 rounded-full ${s.dot}`} />
                                                <span>{s.label}</span>
                                            </div>
                                            {status === s.value && <Check size={13} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Per Page Limit Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "limit" ? null : "limit");
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 transition-all"
                        >
                            <span>{limit} per page</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "limit" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {LIMITS.map((lim) => (
                                        <button
                                            key={lim}
                                            onClick={() => {
                                                setLimit(lim);
                                                setPage(1);
                                                setSelectedUserIds([]);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3.5 py-2 text-xs flex items-center justify-between font-medium transition-colors ${
                                                limit === lim
                                                    ? "bg-orange-50 text-orange-700 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span>{lim} per page</span>
                                            {limit === lim && <Check size={13} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Bulk Action Bar (Light SaaS Styling + Functional) */}
            {selectedUserIds.length > 0 && (
                <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <span className="bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold px-3 py-1 rounded-full">
                            {selectedUserIds.length} selected
                        </span>
                        <p className="text-xs font-semibold text-slate-600">Bulk Actions:</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowBulkEmailModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-100 transition-all"
                        >
                            <Mail size={13} />
                            Send Bulk Email
                        </button>
                        <button
                            onClick={() => handleBulkStatusChange("ACTIVE")}
                            disabled={bulkUpdateStatus.isPending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50"
                        >
                            <CheckCircle2 size={13} />
                            Activate Selected
                        </button>
                        <button
                            onClick={() => handleBulkStatusChange("DEACTIVATED")}
                            disabled={bulkUpdateStatus.isPending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all disabled:opacity-50"
                        >
                            <XCircle size={13} />
                            Deactivate Selected
                        </button>
                        <button
                            onClick={() => handleBulkStatusChange("SUSPENDED")}
                            disabled={bulkUpdateStatus.isPending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50"
                        >
                            <Ban size={13} />
                            Ban / Suspend Selected
                        </button>
                        <button
                            onClick={() => setSelectedUserIds([])}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-500 text-sm">
                        <AlertCircle className="mx-auto size-8 mb-2 opacity-50" />
                        Failed to load user catalog.
                    </div>
                ) : !data || data.users.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Users className="mx-auto size-12 opacity-30 mb-3" />
                        <p className="font-semibold text-slate-700 text-base">No users found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-5 py-3.5 w-10">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="size-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                        />
                                    </th>
                                    <th className="px-5 py-3.5">User Identity</th>
                                    <th className="px-5 py-3.5">Role</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Stores</th>
                                    <th className="px-5 py-3.5">Joined</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.users.map((user) => {
                                    const isSelf = currentAdmin?.id === user.id;
                                    const isSelected = selectedUserIds.includes(user.id);

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`hover:bg-slate-50/60 transition-colors ${
                                                isSelected ? "bg-orange-50/30" : ""
                                            } ${isSelf ? "bg-amber-50/20" : ""}`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-5 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isSelf}
                                                    title={isSelf ? "Protected: You cannot select your own account for bulk operations" : ""}
                                                    onChange={() => handleToggleSelectUser(user.id)}
                                                    className="size-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                />
                                            </td>

                                            {/* User Identity */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.profile?.avatar ? (
                                                        <img
                                                            src={user.profile.avatar}
                                                            alt={user.name}
                                                            className="size-10 rounded-full object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="size-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-xs">
                                                            {user.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-slate-900">{user.name}</p>
                                                            {isSelf && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                                    <ShieldCheck size={11} className="text-orange-500" />
                                                                    You (Current Admin)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                        {user.profile?.phone && (
                                                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                                {user.profile.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <RoleBadge role={user.role} />
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <StatusBadge status={user.status} />
                                            </td>

                                            {/* Stores */}
                                            <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/60">
                                                    <Store size={12} className="text-slate-400" />
                                                    {user.ownedShops?.length ?? 0} {user.ownedShops?.length === 1 ? "store" : "stores"}
                                                </span>
                                            </td>

                                            {/* Joined */}
                                            <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                                                {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Actions 3-Dot Trigger */}
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => handleOpenDropdown(e, user)}
                                                    className={`p-2 rounded-xl transition-all border ${
                                                        dropdownState?.userId === user.id
                                                            ? "bg-orange-50 text-orange-600 border-orange-200"
                                                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent hover:border-slate-200"
                                                    }`}
                                                    title="Open user actions menu"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls at the bottom of the table */}
            {data && data.total > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div>
                        Showing <span className="font-bold text-slate-800">{((page - 1) * limit) + 1}</span> to{" "}
                        <span className="font-bold text-slate-800">{Math.min(page * limit, data.total)}</span> of{" "}
                        <span className="font-bold text-slate-800">{data.total.toLocaleString()}</span> users
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* First Button */}
                        <button
                            onClick={() => {
                                setPage(1);
                                setSelectedUserIds([]);
                            }}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold"
                            title="Go to first page"
                        >
                            <ChevronsLeft size={14} />
                            First
                        </button>

                        {/* Prev Button */}
                        <button
                            onClick={() => {
                                setPage((p) => Math.max(1, p - 1));
                                setSelectedUserIds([]);
                            }}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold"
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-1">
                            {renderPaginationNumbers()}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => {
                                setPage((p) => Math.min(data.totalPages, p + 1));
                                setSelectedUserIds([]);
                            }}
                            disabled={page >= data.totalPages}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>

                        {/* Final Button */}
                        <button
                            onClick={() => {
                                setPage(data.totalPages);
                                setSelectedUserIds([]);
                            }}
                            disabled={page >= data.totalPages}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold"
                            title="Go to final page"
                        >
                            Final
                            <ChevronsRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Fixed Floating 3-Dot Dropdown Menu (Guaranteed ZERO clipping by table) */}
            {dropdownState && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setDropdownState(null)}
                    />
                    <div
                        style={{
                            position: "fixed",
                            top: dropdownState.openUpwards ? undefined : dropdownState.top,
                            bottom: dropdownState.openUpwards ? window.innerHeight - dropdownState.top : undefined,
                            right: dropdownState.right,
                        }}
                        className="z-50 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 text-left text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150"
                    >
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    const id = dropdownState.user.id;
                                    setDropdownState(null);
                                    navigate(`/superadmin/users/${id}`);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 font-medium transition-colors"
                            >
                                <Eye size={14} className="text-slate-400" />
                                View Full Profile
                            </button>
                            <button
                                onClick={() => {
                                    const u = dropdownState.user;
                                    setDropdownState(null);
                                    setEditingUser(u);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 font-medium transition-colors"
                            >
                                <Edit2 size={14} className="text-slate-400" />
                                Edit Profile Details
                            </button>
                            <button
                                onClick={() => {
                                    const u = dropdownState.user;
                                    setDropdownState(null);
                                    setEmailingUser(u);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 font-medium transition-colors"
                            >
                                <Mail size={14} className="text-slate-400" />
                                Send Direct Email
                            </button>
                            <button
                                onClick={() => {
                                    const u = dropdownState.user;
                                    setDropdownState(null);
                                    setResettingUser(u);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 font-medium transition-colors"
                            >
                                <KeyRound size={14} className="text-slate-400" />
                                Reset Password
                            </button>
                        </div>

                        {/* Status Controls */}
                        <div className="py-1">
                            {dropdownState.user.status !== "ACTIVE" && (
                                <button
                                    onClick={() => {
                                        const uid = dropdownState.user.id;
                                        setDropdownState(null);
                                        updateStatus.mutate(
                                            { id: uid, status: "ACTIVE" },
                                            { onSuccess: () => showToast("User activated successfully") }
                                        );
                                    }}
                                    className="w-full px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 font-medium transition-colors"
                                >
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    Activate Account
                                </button>
                            )}

                            {dropdownState.user.status !== "DEACTIVATED" && (
                                <button
                                    onClick={() => {
                                        if (currentAdmin?.id === dropdownState.user.id) return;
                                        const u = dropdownState.user;
                                        setDropdownState(null);
                                        if (window.confirm(`Deactivate account for ${u.name}? They will be unable to log in.`)) {
                                            updateStatus.mutate(
                                                { id: u.id, status: "DEACTIVATED" },
                                                { onSuccess: () => showToast("User deactivated successfully") }
                                            );
                                        }
                                    }}
                                    disabled={currentAdmin?.id === dropdownState.user.id}
                                    className={`w-full px-3.5 py-2 flex items-center gap-2.5 font-medium transition-colors ${
                                        currentAdmin?.id === dropdownState.user.id
                                            ? "text-slate-300 cursor-not-allowed"
                                            : "text-amber-700 hover:bg-amber-50"
                                    }`}
                                    title={currentAdmin?.id === dropdownState.user.id ? "Self-protection: Cannot deactivate your own account" : ""}
                                >
                                    <XCircle size={14} className={currentAdmin?.id === dropdownState.user.id ? "text-slate-300" : "text-amber-600"} />
                                    <span>Deactivate Account</span>
                                    {currentAdmin?.id === dropdownState.user.id && <span className="ml-auto text-[10px] text-slate-400 font-normal">Self</span>}
                                </button>
                            )}

                            {dropdownState.user.status !== "SUSPENDED" && (
                                <button
                                    onClick={() => {
                                        if (currentAdmin?.id === dropdownState.user.id) return;
                                        const u = dropdownState.user;
                                        setDropdownState(null);
                                        if (window.confirm(`Ban / Suspend user ${u.name}? All active sessions will be terminated immediately.`)) {
                                            updateStatus.mutate(
                                                { id: u.id, status: "SUSPENDED" },
                                                { onSuccess: () => showToast("User suspended and sessions terminated") }
                                            );
                                        }
                                    }}
                                    disabled={currentAdmin?.id === dropdownState.user.id}
                                    className={`w-full px-3.5 py-2 flex items-center gap-2.5 font-medium transition-colors ${
                                        currentAdmin?.id === dropdownState.user.id
                                            ? "text-slate-300 cursor-not-allowed"
                                            : "text-rose-700 hover:bg-rose-50"
                                    }`}
                                    title={currentAdmin?.id === dropdownState.user.id ? "Self-protection: Cannot ban your own account" : ""}
                                >
                                    <Ban size={14} className={currentAdmin?.id === dropdownState.user.id ? "text-slate-300" : "text-rose-600"} />
                                    <span>Ban / Suspend User</span>
                                    {currentAdmin?.id === dropdownState.user.id && <span className="ml-auto text-[10px] text-slate-400 font-normal">Self</span>}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    isSelf={currentAdmin?.id === editingUser.id}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => showToast("User profile updated successfully")}
                />
            )}

            {/* Reset Password Modal */}
            {resettingUser && (
                <ResetPasswordModal
                    user={resettingUser}
                    onClose={() => setResettingUser(null)}
                    onSuccess={() => showToast("Password reset successfully")}
                />
            )}

            {/* Send Individual Email Modal */}
            {emailingUser && (
                <SendEmailModal
                    user={emailingUser}
                    onClose={() => setEmailingUser(null)}
                    onSuccess={() => showToast("Email dispatched successfully")}
                />
            )}

            {/* Send Bulk Email Modal */}
            {showBulkEmailModal && (
                <BulkEmailModal
                    userIds={selectedUserIds}
                    onClose={() => setShowBulkEmailModal(false)}
                    onSuccess={() => {
                        setShowBulkEmailModal(false);
                        setSelectedUserIds([]);
                        showToast(`Bulk email dispatched to ${selectedUserIds.length} users!`);
                    }}
                />
            )}
        </div>
    );
};

// ─── Modal 1: Edit Profile Modal ──────────────────────────────────────
const EditUserModal = ({
    user,
    isSelf,
    onClose,
    onSuccess,
}: {
    user: AdminUser;
    isSelf: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [phone, setPhone] = useState(user.profile?.phone || "");

    const updateProfile = useUpdateUserProfile();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSelf && role !== "SUPER_ADMIN") {
            toast.error("Safety lock: You cannot remove your own Super Admin privileges.");
            return;
        }

        updateProfile.mutate(
            { id: user.id, data: { name, email, role, phone } },
            {
                onSuccess: () => {
                    onSuccess();
                    onClose();
                },
            }
        );
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Edit2 size={16} className="text-orange-500" />
                            Edit User Profile
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {isSelf && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                            <ShieldCheck size={16} className="text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <strong>Editing Your Admin Account:</strong> For system safety, your account role is locked to Super Administrator.
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Role & Permissions</label>
                            <select
                                value={role}
                                disabled={isSelf}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                                <option value="CUSTOMER">Customer (Standard User)</option>
                                <option value="SHOP_OWNER">Shop Owner (Merchant)</option>
                                <option value="SUPER_ADMIN">Super Administrator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateProfile.isPending}
                                className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm shadow-orange-100 flex items-center gap-1.5 cursor-pointer"
                            >
                                {updateProfile.isPending && <Loader2 size={13} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalPortal>
    );
};

// ─── Modal 2: Reset Password Modal ────────────────────────────────────
const ResetPasswordModal = ({
    user,
    onClose,
    onSuccess,
}: {
    user: AdminUser;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [customPassword, setCustomPassword] = useState("");
    const [resultPassword, setResultPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const resetPassword = useResetUserPassword();

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        resetPassword.mutate(
            { id: user.id, customPassword: customPassword || undefined },
            {
                onSuccess: (data: any) => {
                    setResultPassword(data.temporaryPassword);
                    onSuccess();
                },
            }
        );
    };

    const handleCopy = () => {
        if (!resultPassword) return;
        navigator.clipboard.writeText(resultPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <KeyRound size={16} className="text-amber-500" />
                            Reset User Password
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {!resultPassword ? (
                        <form onSubmit={handleReset} className="space-y-4 text-sm">
                            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 space-y-1">
                                <p className="font-bold">Security Notice</p>
                                <p>
                                    Resetting password will invalidate all active sessions for <strong>{user.name}</strong> ({user.email}).
                                    A notification email will be dispatched with the newly generated temporary password.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Custom Password (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Leave empty to auto-generate a secure random password"
                                    value={customPassword}
                                    onChange={(e) => setCustomPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-xs font-mono"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetPassword.isPending}
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-sm shadow-amber-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {resetPassword.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Generate & Reset Password
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 text-sm">
                            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                                Password has been reset successfully and emailed to <strong>{user.email}</strong>.
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1.5">Temporary Generated Password:</p>
                                <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl font-mono text-base font-bold text-slate-900 justify-between">
                                    <span>{resultPassword}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                        title="Copy temporary password"
                                    >
                                        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-all cursor-pointer"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

// ─── Modal 3: Send Individual Email Modal ──────────────────────────────
const SendEmailModal = ({
    user,
    onClose,
    onSuccess,
}: {
    user: AdminUser;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    const sendEmail = useSendUserEmail();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendEmail.mutate(
            { id: user.id, data: { subject, message } },
            {
                onSuccess: () => {
                    setSent(true);
                    onSuccess();
                    setTimeout(() => onClose(), 1500);
                },
            }
        );
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <Mail size={16} className="text-orange-500" />
                                Send Message to {user.name}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">Delivered directly to {user.email}</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {sent ? (
                        <div className="p-8 text-center text-emerald-600 font-semibold text-sm">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                            Email dispatched successfully!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Important update regarding your account..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Message Body</label>
                                <textarea
                                    rows={6}
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendEmail.isPending}
                                    className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm shadow-orange-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {sendEmail.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Send Email
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

// ─── Modal 4: Bulk Email Modal ─────────────────────────────────────────
const BulkEmailModal = ({
    userIds,
    onClose,
    onSuccess,
}: {
    userIds: string[];
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    const bulkSendEmail = useBulkSendUserEmail();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bulkSendEmail.mutate(
            { userIds, subject, message },
            {
                onSuccess: () => {
                    setSent(true);
                    setTimeout(() => onSuccess(), 1500);
                },
            }
        );
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <Mail size={16} className="text-orange-500" />
                                Send Bulk Email Broadcast
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Delivering to {userIds.length} selected recipients
                            </p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {sent ? (
                        <div className="p-8 text-center text-emerald-600 font-semibold text-sm">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                            Bulk email dispatched successfully to {userIds.length} recipients!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Platform announcement or policy update..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Message Body</label>
                                <textarea
                                    rows={6}
                                    placeholder="Write the announcement message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkSendEmail.isPending}
                                    className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm shadow-orange-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {bulkSendEmail.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Broadcast to {userIds.length} Users
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

export default AdminUsersPage;
