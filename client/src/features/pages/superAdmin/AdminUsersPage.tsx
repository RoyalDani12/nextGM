import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
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
    Eye,
    ShieldCheck,
    Store,
    AlertCircle,
    RefreshCw,
    RotateCcw,
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
    { value: "SHOP_EMPLOYEE", label: "Shop Employee" },
];

const STATUSES = [
    { value: "", label: "All Statuses", dot: "bg-slate-400" },
    { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
    { value: "PENDING", label: "Pending", dot: "bg-amber-500" },
    { value: "SUSPENDED", label: "Suspended", dot: "bg-rose-500" },
    { value: "DEACTIVATED", label: "Deactivated", dot: "bg-slate-400" },
];

const LIMITS = [10, 20, 50, 100];

const USER_TABS = [
    { id: "ALL", label: "All Users", countKey: "total" as const },
    { id: "CUSTOMER", label: "Customers", countKey: "customers" as const },
    { id: "SHOP_OWNER", label: "Shop Owners", countKey: "shopOwners" as const },
    { id: "SUPER_ADMIN", label: "Super Admins", countKey: "superAdmins" as const },
    { id: "ACTIVE", label: "Active", countKey: "active" as const },
    { id: "SUSPENDED", label: "Suspended", countKey: "suspended" as const },
];

const RoleBadge = ({ role }: { role: string }) => {
    const badges: Record<string, { bg: string; text: string; border: string }> = {
        SUPER_ADMIN: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
        SHOP_OWNER: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
        CUSTOMER: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
        SHOP_EMPLOYEE: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
    };
    const style = badges[role] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
            {role.replace("_", " ")}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const badges: Record<string, { badge: string; text: string; dot: string }> = {
        ACTIVE: { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", text: "Active", dot: "bg-emerald-500" },
        PENDING: { badge: "bg-amber-50 text-amber-800 border-amber-200", text: "Pending", dot: "bg-amber-500" },
        SUSPENDED: { badge: "bg-rose-50 text-rose-800 border-rose-200", text: "Suspended", dot: "bg-rose-500" },
        DEACTIVATED: { badge: "bg-slate-50 text-slate-700 border-slate-200", text: "Deactivated", dot: "bg-slate-400" },
        DELETED: { badge: "bg-rose-50 text-rose-800 border-rose-200", text: "Deleted", dot: "bg-rose-500" },
    };
    const style = badges[status] ?? { badge: "bg-slate-50 text-slate-700 border-slate-200", text: status, dot: "bg-slate-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${style.badge}`}>
            <span className={`size-1.5 rounded-full ${style.dot}`} />
            <span>{style.text}</span>
        </span>
    );
};

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
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
    const [limit, setLimit] = useState(20);

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

    const { data, isLoading, isError, refetch } = useAdminUsers({ search, role, status, page, limit });
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
        setSearch(searchInput.trim());
        setPage(1);
        setSelectedUserIds([]);
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
        setSelectedUserIds([]);
    };

    const handleResetAllFilters = () => {
        setSearch("");
        setSearchInput("");
        setRole("");
        setStatus("");
        setPage(1);
        setSelectedUserIds([]);
    };

    const handleTabClick = (tabId: string) => {
        if (tabId === "ALL") {
            setRole("");
            setStatus("");
        } else if (tabId === "CUSTOMER") {
            setRole("CUSTOMER");
            setStatus("");
        } else if (tabId === "SHOP_OWNER") {
            setRole("SHOP_OWNER");
            setStatus("");
        } else if (tabId === "SUPER_ADMIN") {
            setRole("SUPER_ADMIN");
            setStatus("");
        } else if (tabId === "ACTIVE") {
            setRole("");
            setStatus("ACTIVE");
        } else if (tabId === "SUSPENDED") {
            setRole("");
            setStatus("SUSPENDED");
        }
        setPage(1);
        setSelectedUserIds([]);
    };

    const isTabActive = (tabId: string) => {
        if (tabId === "ALL") return !role && !status;
        if (tabId === "CUSTOMER") return role === "CUSTOMER";
        if (tabId === "SHOP_OWNER") return role === "SHOP_OWNER";
        if (tabId === "SUPER_ADMIN") return role === "SUPER_ADMIN";
        if (tabId === "ACTIVE") return status === "ACTIVE";
        if (tabId === "SUSPENDED") return status === "SUSPENDED";
        return false;
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!data?.users) return;
        if (e.target.checked) {
            const selectableIds = data.users
                .filter((u) => u.id !== currentAdmin?.id)
                .map((u) => u.id);
            setSelectedUserIds(selectableIds);
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleToggleSelectUser = (id: string) => {
        if (id === currentAdmin?.id) return;
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

    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, user: AdminUser) => {
        e.stopPropagation();
        if (dropdownState?.userId === user.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
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
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs select-none">
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
                    className={`min-w-7 h-7 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        isCurrent
                            ? "bg-slate-900 text-white shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                    {p}
                </button>
            );
        });
    };

    const stats = data?.stats;
    const isFiltered = Boolean(search || role || status);
    const isAllSelected =
        !!data?.users?.length &&
        data.users.filter((u) => u.id !== currentAdmin?.id).length > 0 &&
        selectedUserIds.length === data.users.filter((u) => u.id !== currentAdmin?.id).length;

    return (
        <div className="space-y-5">
            {/* Page Header (Matching SettingsPage / Protected Directory Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            User Directory
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            Protected Access
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Platform user identities, credentials, role-based authorization, and account security.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Export filtered users to CSV"
                    >
                        <Download size={13} className="text-slate-500" />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh user list"
                    >
                        <RefreshCw size={13} className={isLoading ? "animate-spin text-orange-500" : "text-slate-500"} />
                        <span>Refresh</span>
                    </button>
                    {feedbackNotice && (
                        <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-md border animate-in fade-in ${
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

            {/* KPI Metric Summary Cards (Shop Owner, Customer, Super Admin, Active, Suspended) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. All Users */}
                <button
                    onClick={() => handleTabClick("ALL")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        !role && !status
                            ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-medium mb-1">
                        <span>All Accounts</span>
                        <Users size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.total.toLocaleString() : data?.total.toLocaleString() ?? "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Total user directory</p>
                </button>

                {/* 2. Customers */}
                <button
                    onClick={() => handleTabClick("CUSTOMER")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        role === "CUSTOMER"
                            ? "bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Customers</span>
                        <Users size={14} className="text-slate-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.customers.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Retail consumers</p>
                </button>

                {/* 3. Shop Owners */}
                <button
                    onClick={() => handleTabClick("SHOP_OWNER")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        role === "SHOP_OWNER"
                            ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-medium mb-1">
                        <span>Shop Owners</span>
                        <Store size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.shopOwners.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Store merchants</p>
                </button>

                {/* 4. Super Admins */}
                <button
                    onClick={() => handleTabClick("SUPER_ADMIN")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        role === "SUPER_ADMIN"
                            ? "bg-purple-50/40 border-purple-500 ring-1 ring-purple-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-purple-800 font-medium mb-1">
                        <span>Super Admins</span>
                        <ShieldCheck size={14} className="text-purple-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.superAdmins.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Full platform authority</p>
                </button>

                {/* 5. Active Accounts (Good thing -> Green!) */}
                <button
                    onClick={() => handleTabClick("ACTIVE")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        status === "ACTIVE"
                            ? "bg-emerald-50/40 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
                        <span>Active</span>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.active.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        In good standing
                    </p>
                </button>

                {/* 6. Suspended Accounts (Bad thing -> Red!) */}
                <button
                    onClick={() => handleTabClick("SUSPENDED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        status === "SUSPENDED"
                            ? "bg-rose-50/40 border-rose-500 ring-1 ring-rose-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
                        <span>Suspended</span>
                        <Ban size={14} className="text-rose-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.suspended.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-rose-500" />
                        Restricted / banned
                    </p>
                </button>
            </div>

            {/* Navigation Tabs Bar with High-Visibility Orange 600 Tracker & Distinct Background */}
            <div className="flex items-center gap-1 border-b border-slate-200 mt-5 overflow-x-auto no-scrollbar">
                {USER_TABS.map((t) => {
                    const isActive = isTabActive(t.id);
                    const countVal = stats ? stats[t.countKey] : undefined;
                    return (
                        <button
                            key={t.id}
                            onClick={() => handleTabClick(t.id)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs border-b-2 whitespace-nowrap transition-all cursor-pointer rounded-t-md -mb-px ${
                                isActive
                                    ? "border-orange-600 bg-orange-50/80 font-semibold text-orange-950 shadow-2xs"
                                    : "border-transparent bg-transparent font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50/70 hover:border-slate-300"
                            }`}
                        >
                            <span>{t.label}</span>
                            {countVal !== undefined && (
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                                        isActive
                                            ? "bg-orange-200/90 text-orange-950 font-bold border border-orange-300"
                                            : "bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                                    }`}
                                >
                                    {countVal.toLocaleString()}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Box: Filters & Users Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Search & Secondary Filter Controls Header Strip */}
                <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/40">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Filter by name, email, or user ID…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-md placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </form>

                    {/* Secondary Dropdown Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Role Select */}
                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                setPage(1);
                                setSelectedUserIds([]);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>

                        {/* Status Select */}
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                                setSelectedUserIds([]);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            {STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>

                        {/* Rows Per Page */}
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                                setSelectedUserIds([]);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            {LIMITS.map((lim) => (
                                <option key={lim} value={lim}>
                                    {lim} / page
                                </option>
                            ))}
                        </select>

                        {/* Reset Filters Pill */}
                        {isFiltered && (
                            <button
                                onClick={handleResetAllFilters}
                                className="h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-transparent"
                            >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Action Header Banner */}
                {selectedUserIds.length > 0 && (
                    <div className="px-4 py-2 bg-orange-50/60 border-b border-orange-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-900 border border-orange-300 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                                {selectedUserIds.length} selected
                            </span>
                            <span className="text-slate-600 font-medium text-xs">Bulk Operations:</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                onClick={() => setShowBulkEmailModal(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Mail size={12} className="text-orange-600" />
                                <span>Send Bulk Email</span>
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange("ACTIVE")}
                                disabled={bulkUpdateStatus.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>Activate</span>
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange("DEACTIVATED")}
                                disabled={bulkUpdateStatus.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <XCircle size={12} className="text-amber-600" />
                                <span>Deactivate</span>
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange("SUSPENDED")}
                                disabled={bulkUpdateStatus.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Ban size={12} className="text-rose-600" />
                                <span>Suspend</span>
                            </button>
                            <button
                                onClick={() => setSelectedUserIds([])}
                                className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                        <Loader2 className="animate-spin text-slate-500" size={24} />
                        <span className="text-xs font-medium">Loading user directory…</span>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-xs text-rose-600">
                        <AlertCircle className="mx-auto size-7 mb-2 text-rose-400" />
                        Failed to load user directory. Please retry.
                    </div>
                ) : !data || data.users.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Users className="mx-auto size-9 text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-800">No users found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isFiltered
                                ? "No users match your active filter criteria."
                                : "No users are currently registered."}
                        </p>
                        {isFiltered && (
                            <button
                                onClick={handleResetAllFilters}
                                className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-4 w-9">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="size-3.5 rounded border-slate-300 text-orange-600 focus:ring-0 cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-2.5 px-4 font-semibold">User Identity</th>
                                    <th className="py-2.5 px-4 font-semibold">Role</th>
                                    <th className="py-2.5 px-4 font-semibold">Status</th>
                                    <th className="py-2.5 px-4 font-semibold">Stores</th>
                                    <th className="py-2.5 px-4 font-semibold">Joined</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.users.map((user) => {
                                    const isSelf = currentAdmin?.id === user.id;
                                    const isSelected = selectedUserIds.includes(user.id);

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors ${
                                                isSelected ? "bg-orange-50/30" : ""
                                            } ${isSelf ? "bg-amber-50/15" : ""}`}
                                        >
                                            {/* Checkbox */}
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isSelf}
                                                    title={isSelf ? "Protected: You cannot select your own account for bulk operations" : ""}
                                                    onChange={() => handleToggleSelectUser(user.id)}
                                                    className="size-3.5 rounded border-slate-300 text-orange-600 focus:ring-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                />
                                            </td>

                                            {/* User Identity */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    {user.profile?.avatar ? (
                                                        <img
                                                            src={user.profile.avatar}
                                                            alt={user.name}
                                                            className="size-8 rounded-full object-cover border border-slate-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="size-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0">
                                                            {user.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => navigate(`/superadmin/users/${user.id}`)}
                                                                className="font-medium text-slate-900 hover:text-slate-600 transition-colors truncate cursor-pointer text-xs"
                                                            >
                                                                {user.name}
                                                            </button>
                                                            {isSelf && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                                                            {user.email}
                                                        </p>
                                                        {user.profile?.phone && (
                                                            <p className="text-[10px] text-slate-400 font-mono">
                                                                {user.profile.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <RoleBadge role={user.role} />
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <StatusBadge status={user.status} />
                                            </td>

                                            {/* Stores */}
                                            <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200/80">
                                                    <Store size={11} className="text-slate-400" />
                                                    <span>{user.ownedShops?.length ?? 0}</span>
                                                </span>
                                            </td>

                                            {/* Joined */}
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                                {formatDate(user.createdAt)}
                                            </td>

                                            {/* Actions Button - All in One Unified Dropdown */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => handleOpenDropdown(e, user)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border shadow-2xs ${
                                                        dropdownState?.userId === user.id
                                                            ? "bg-slate-100 text-slate-900 border-slate-300"
                                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                                    }`}
                                                >
                                                    <span>Actions</span>
                                                    <ChevronDown size={12} className="text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {data && data.total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white text-xs text-slate-500">
                        <div>
                            Showing{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {Math.min((page - 1) * limit + 1, data.total)}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {Math.min(page * limit, data.total)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {data.total.toLocaleString()}
                            </span>{" "}
                            users
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => {
                                    setPage((p) => Math.max(1, p - 1));
                                    setSelectedUserIds([]);
                                }}
                                disabled={page === 1}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                            >
                                <ChevronLeft size={13} />
                                <span>Previous</span>
                            </button>

                            <div className="hidden sm:flex items-center gap-1">
                                {renderPaginationNumbers()}
                            </div>

                            <button
                                onClick={() => {
                                    setPage((p) => Math.min(data.totalPages, p + 1));
                                    setSelectedUserIds([]);
                                }}
                                disabled={page >= data.totalPages}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                            >
                                <span>Next</span>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Dropdown Menu */}
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
                        className="z-50 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-left text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                    >
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    const id = dropdownState.user.id;
                                    setDropdownState(null);
                                    navigate(`/superadmin/users/${id}`);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <Eye size={13} className="text-slate-400" />
                                <span>Inspect full profile</span>
                            </button>
                            <button
                                onClick={() => {
                                    const u = dropdownState.user;
                                    setDropdownState(null);
                                    setEditingUser(u);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <Edit2 size={13} className="text-slate-400" />
                                <span>Edit profile details</span>
                            </button>
                            <button
                                onClick={() => {
                                    const u = dropdownState.user;
                                    setDropdownState(null);
                                    setEmailingUser(u);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <Mail size={13} className="text-slate-400" />
                                <span>Send direct email</span>
                            </button>
                            <button
                                onClick={() => {
                                    const u = dropdownState.user;
                                    setDropdownState(null);
                                    setResettingUser(u);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <KeyRound size={13} className="text-slate-400" />
                                <span>Reset password</span>
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
                                    className="w-full px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>Activate account</span>
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
                                    className={`w-full px-3 py-1.5 flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                                        currentAdmin?.id === dropdownState.user.id
                                            ? "text-slate-300 cursor-not-allowed"
                                            : "text-amber-700 hover:bg-amber-50"
                                    }`}
                                >
                                    <XCircle size={13} className={currentAdmin?.id === dropdownState.user.id ? "text-slate-300" : "text-amber-600"} />
                                    <span>Deactivate account</span>
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
                                    className={`w-full px-3 py-1.5 flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                                        currentAdmin?.id === dropdownState.user.id
                                            ? "text-slate-300 cursor-not-allowed"
                                            : "text-rose-700 hover:bg-rose-50"
                                    }`}
                                >
                                    <Ban size={13} className={currentAdmin?.id === dropdownState.user.id ? "text-slate-300" : "text-rose-600"} />
                                    <span>Ban / Suspend user</span>
                                    {currentAdmin?.id === dropdownState.user.id && <span className="ml-auto text-[10px] text-slate-400 font-normal">Self</span>}
                                </button>
                            )}
                        </div>

                        <div className="py-1">
                            <button
                                onClick={() => {
                                    const id = dropdownState.user.id;
                                    setDropdownState(null);
                                    navigator.clipboard.writeText(id);
                                    showToast("User ID copied to clipboard");
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy User ID</span>
                            </button>
                            <button
                                onClick={() => {
                                    const email = dropdownState.user.email;
                                    setDropdownState(null);
                                    navigator.clipboard.writeText(email);
                                    showToast("Email address copied to clipboard");
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy Email</span>
                            </button>
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
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 my-auto overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                        <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <Edit2 size={14} className="text-orange-500" />
                            <span>Edit User Profile</span>
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-pointer">
                            <X size={15} />
                        </button>
                    </div>

                    {isSelf && (
                        <div className="p-3 mx-4 mt-4 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                            <ShieldCheck size={14} className="text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <strong>Admin Account Notice:</strong> Your account role is locked to Super Administrator.
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Role & Permissions</label>
                            <select
                                value={role}
                                disabled={isSelf}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                <option value="CUSTOMER">Customer (Standard User)</option>
                                <option value="SHOP_OWNER">Shop Owner (Merchant)</option>
                                <option value="SUPER_ADMIN">Super Administrator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateProfile.isPending}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {updateProfile.isPending && <Loader2 size={12} className="animate-spin" />}
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
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 my-auto overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                        <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <KeyRound size={14} className="text-amber-500" />
                            <span>Reset User Password</span>
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-pointer">
                            <X size={15} />
                        </button>
                    </div>

                    {!resultPassword ? (
                        <form onSubmit={handleReset} className="p-4 space-y-3.5 text-xs">
                            <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-800 space-y-1">
                                <p className="font-semibold">Security Notice</p>
                                <p>
                                    Resetting password will invalidate all active sessions for <strong>{user.name}</strong> ({user.email}).
                                    A notification email will be dispatched with the temporary password.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Custom Password (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Leave empty to auto-generate a secure password"
                                    value={customPassword}
                                    onChange={(e) => setCustomPassword(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetPassword.isPending}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {resetPassword.isPending && <Loader2 size={12} className="animate-spin" />}
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-4 space-y-3.5 text-xs">
                            <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200 text-xs text-emerald-800">
                                Password has been reset and emailed to <strong>{user.email}</strong>.
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-600 mb-1">Temporary Password:</p>
                                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs font-semibold text-slate-900 justify-between">
                                    <span>{resultPassword}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                        title="Copy password"
                                    >
                                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-slate-100">
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors cursor-pointer"
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
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 my-auto overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                        <div>
                            <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Mail size={14} className="text-orange-500" />
                                <span>Send Message to {user.name}</span>
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{user.email}</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-pointer">
                            <X size={15} />
                        </button>
                    </div>

                    {sent ? (
                        <div className="p-8 text-center text-emerald-600 font-medium text-xs">
                            <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                            Email dispatched successfully!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Account notification subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Message Body</label>
                                <textarea
                                    rows={5}
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendEmail.isPending}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {sendEmail.isPending && <Loader2 size={12} className="animate-spin" />}
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
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 my-auto overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                        <div>
                            <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Mail size={14} className="text-orange-500" />
                                <span>Bulk Email Broadcast</span>
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Delivering to {userIds.length} selected recipients
                            </p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-pointer">
                            <X size={15} />
                        </button>
                    </div>

                    {sent ? (
                        <div className="p-8 text-center text-emerald-600 font-medium text-xs">
                            <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                            Bulk email dispatched successfully to {userIds.length} recipients!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Platform update subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Message Body</label>
                                <textarea
                                    rows={5}
                                    placeholder="Write the broadcast message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkSendEmail.isPending}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {bulkSendEmail.isPending && <Loader2 size={12} className="animate-spin" />}
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
