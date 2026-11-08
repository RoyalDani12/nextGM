import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Ticket,
    Search,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Download,
    Store,
    Percent,
    DollarSign,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Copy,
    Check,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
    Calendar,
    Tag,
} from "lucide-react";
import { useAdminCoupons, useToggleCoupon } from "@/features/admin/admin.hooks";
import type { AdminCoupon } from "@/features/admin/admin.api";
import { ModalPortal } from "@/components/ui/ds-components";

// Filter tabs definition (no icons, matching design system)
const COUPON_TABS = [
    { id: "ALL", label: "All Coupons" },
    { id: "ACTIVE", label: "Active" },
    { id: "PERCENTAGE", label: "Percentage (%)" },
    { id: "FIXED", label: "Fixed Amount ($)" },
    { id: "EXPIRED", label: "Expired / Inactive" },
] as const;

type CouponTab = (typeof COUPON_TABS)[number]["id"];

export const AdminCouponsPage = () => {
    const navigate = useNavigate();

    // Search and filter state
    const [activeTab, setActiveTab] = useState<CouponTab>("ALL");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Toast feedback notice
    const [feedbackNotice, setFeedbackNotice] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    // Modal state for inspecting coupon details
    const [selectedCoupon, setSelectedCoupon] = useState<AdminCoupon | null>(null);

    // Copied feedback helper
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Viewport-fixed Actions Dropdown
    const [dropdownState, setDropdownState] = useState<{
        couponId: string;
        coupon: AdminCoupon;
        top: number;
        right: number;
        openUpwards: boolean;
    } | null>(null);

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

    // Derive server filter arguments based on tab and dropdown filters
    const serverFilters = useMemo(() => {
        let isActive: boolean | undefined = undefined;
        let type: string | undefined = undefined;

        // Apply Tab filters
        if (activeTab === "ACTIVE") {
            isActive = true;
        } else if (activeTab === "EXPIRED") {
            isActive = false;
        } else if (activeTab === "PERCENTAGE") {
            type = "PERCENTAGE";
        } else if (activeTab === "FIXED") {
            type = "FIXED_AMOUNT";
        }

        // Apply dropdown overrides if set
        if (statusFilter === "ACTIVE") isActive = true;
        if (statusFilter === "INACTIVE") isActive = false;

        if (typeFilter === "PERCENTAGE") type = "PERCENTAGE";
        if (typeFilter === "FIXED_AMOUNT") type = "FIXED_AMOUNT";

        return {
            search: search.trim() || undefined,
            isActive,
            type,
            page,
            limit,
        };
    }, [activeTab, statusFilter, typeFilter, search, page, limit]);

    const { data, isLoading, isError, refetch } = useAdminCoupons(serverFilters);
    const toggleCoupon = useToggleCoupon();

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setFeedbackNotice({ text, type });
        setTimeout(() => {
            setFeedbackNotice((curr) => (curr?.text === text ? null : curr));
        }, 4000);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
    };

    const handleTabClick = (tabId: CouponTab) => {
        setActiveTab(tabId);
        setTypeFilter("ALL");
        setStatusFilter("ALL");
        setPage(1);
    };

    const handleClearAllFilters = () => {
        setActiveTab("ALL");
        setSearch("");
        setSearchInput("");
        setTypeFilter("ALL");
        setStatusFilter("ALL");
        setPage(1);
    };

    const isFiltered =
        activeTab !== "ALL" ||
        Boolean(search.trim()) ||
        typeFilter !== "ALL" ||
        statusFilter !== "ALL";

    // Open Actions Dropdown
    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, coupon: AdminCoupon) => {
        e.stopPropagation();
        if (dropdownState?.couponId === coupon.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 220;

        setDropdownState({
            couponId: coupon.id,
            coupon,
            top: openUpwards ? rect.top - 6 : rect.bottom + 6,
            right: window.innerWidth - rect.right,
            openUpwards,
        });
    };

    // Toggle coupon active status
    const handleToggleCouponStatus = (coupon: AdminCoupon) => {
        setDropdownState(null);
        toggleCoupon.mutate(coupon.id, {
            onSuccess: () => {
                showToast(
                    `Coupon "${coupon.code}" ${coupon.isActive ? "deactivated" : "activated"}.`,
                    "success"
                );
                if (selectedCoupon?.id === coupon.id) {
                    setSelectedCoupon((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
                }
            },
            onError: (err: any) => {
                showToast(err?.response?.data?.message || "Failed to toggle coupon status.", "error");
            },
        });
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        showToast(`${label} copied to clipboard`, "success");
        setTimeout(() => setCopiedCode(null), 2000);
        setDropdownState(null);
    };

    // Export coupons to CSV
    const handleExportCSV = () => {
        const couponsToExport = data?.coupons || [];
        if (!couponsToExport.length) {
            showToast("No coupon records available to export.", "error");
            return;
        }

        const headers = [
            "Coupon Code",
            "Store Name",
            "Store Slug",
            "Discount Type",
            "Discount Value",
            "Min Order Amount",
            "Used Count",
            "Max Uses",
            "Expires At",
            "Status",
            "Created At",
        ];

        const rows = couponsToExport.map((c) => [
            `"${c.code}"`,
            `"${(c.shop?.profile?.name || "").replace(/"/g, '""')}"`,
            `"${c.shop?.slug || ""}"`,
            `"${c.type}"`,
            `"${c.type === "PERCENTAGE" ? `${c.value}%` : `$${Number(c.value).toFixed(2)}`}"`,
            `"${c.minOrderAmount ? `$${Number(c.minOrderAmount).toFixed(2)}` : "None"}"`,
            `"${c.usedCount}"`,
            `"${c.maxUses || "Unlimited"}"`,
            `"${c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "Never"}"`,
            `"${c.isActive ? "Active" : "Inactive"}"`,
            `"${new Date(c.createdAt).toISOString().slice(0, 10)}"`,
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `platform-coupons-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Exported ${couponsToExport.length} coupon records to CSV`, "success");
    };

    // Stats
    const stats = data?.stats;

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Promotional Campaigns
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <Ticket className="size-3 text-emerald-600" />
                            Platform Governance
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Cross-tenant promotional codes, discount thresholds, merchant voucher compliance, and redemption volume.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Export filtered coupons to CSV"
                    >
                        <Download size={13} className="text-slate-500" />
                        <span>Export CSV</span>
                    </button>

                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh coupon list"
                    >
                        <RefreshCw
                            size={13}
                            className={isLoading ? "animate-spin text-orange-500" : "text-slate-500"}
                        />
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

            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. All Coupons */}
                <button
                    onClick={() => handleTabClick("ALL")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "ALL" && !isFiltered
                            ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-medium mb-1">
                        <span>All Coupons</span>
                        <Ticket size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.total.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Platform-wide vouchers</p>
                </button>

                {/* 2. Active Coupons (Good thing -> Green!) */}
                <button
                    onClick={() => handleTabClick("ACTIVE")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "ACTIVE"
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

                {/* 3. Percentage Discounts */}
                <button
                    onClick={() => handleTabClick("PERCENTAGE")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "PERCENTAGE"
                            ? "bg-blue-50/40 border-blue-500 ring-1 ring-blue-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-blue-800 font-medium mb-1">
                        <span>Percentage (%)</span>
                        <Percent size={14} className="text-blue-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats?.percentage !== undefined ? stats.percentage.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Relative discounts</p>
                </button>

                {/* 4. Fixed Amount Discounts */}
                <button
                    onClick={() => handleTabClick("FIXED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "FIXED"
                            ? "bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-indigo-800 font-medium mb-1">
                        <span>Fixed ($)</span>
                        <DollarSign size={14} className="text-indigo-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats?.fixed !== undefined ? stats.fixed.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Absolute deductions</p>
                </button>

                {/* 5. Total Redemptions */}
                <div className="text-left p-3.5 rounded-lg border bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Total Redemptions</span>
                        <Tag size={14} className="text-slate-500" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats?.totalRedemptions !== undefined ? stats.totalRedemptions.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Times used at checkout</p>
                </div>

                {/* 6. Expired / Inactive (Bad thing -> Red!) */}
                <button
                    onClick={() => handleTabClick("EXPIRED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "EXPIRED"
                            ? "bg-rose-50/40 border-rose-500 ring-1 ring-rose-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
                        <span>Expired / Inactive</span>
                        <XCircle size={14} className="text-rose-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.expired.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-rose-500" />
                        Expired or paused
                    </p>
                </button>
            </div>

            {/* Navigation Tabs Bar with High-Visibility Orange 600 Tracker */}
            <div className="flex items-center gap-1 border-b border-slate-200 mt-5 overflow-x-auto no-scrollbar">
                {COUPON_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    let count = stats?.total;
                    if (tab.id === "ACTIVE") count = stats?.active;
                    else if (tab.id === "PERCENTAGE") count = stats?.percentage;
                    else if (tab.id === "FIXED") count = stats?.fixed;
                    else if (tab.id === "EXPIRED") count = stats?.expired;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs border-b-2 whitespace-nowrap transition-all cursor-pointer rounded-t-md -mb-px ${
                                isActive
                                    ? "border-orange-600 bg-orange-50/80 font-semibold text-orange-950 shadow-2xs"
                                    : "border-transparent bg-transparent font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50/70 hover:border-slate-300"
                            }`}
                        >
                            <span>{tab.label}</span>
                            {count !== undefined && (
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                                        isActive
                                            ? "bg-orange-200/90 text-orange-950 font-bold border border-orange-300"
                                            : "bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                                    }`}
                                >
                                    {count.toLocaleString()}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Box: Filters & Table */}
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
                            placeholder="Search by coupon code, store name, or slug…"
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
                        {/* Type Select */}
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value="ALL">All Discount Types</option>
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                        </select>

                        {/* Status Select */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="INACTIVE">Inactive / Expired</option>
                        </select>

                        {/* Limit Select */}
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>

                        {/* Reset Filters Pill */}
                        {isFiltered && (
                            <button
                                onClick={handleClearAllFilters}
                                className="h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                                <X size={12} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Coupons Table */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                        <Loader2 className="animate-spin text-slate-500" size={24} />
                        <span className="text-xs font-medium">Loading coupon directory…</span>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-xs text-rose-600">
                        <AlertCircle className="mx-auto size-7 mb-2 text-rose-400" />
                        Failed to load coupons. Please retry.
                    </div>
                ) : !data || data.coupons.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Ticket className="mx-auto size-9 text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-800">No coupons found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isFiltered
                                ? "No coupons match your active filter criteria."
                                : "No platform coupons are currently registered."}
                        </p>
                        {isFiltered && (
                            <button
                                onClick={handleClearAllFilters}
                                className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 text-[11px]">
                                    <th className="py-2.5 px-4 font-semibold">Voucher Code</th>
                                    <th className="py-2.5 px-4 font-semibold">Issuing Store</th>
                                    <th className="py-2.5 px-4 font-semibold">Discount</th>
                                    <th className="py-2.5 px-4 font-semibold">Min Order</th>
                                    <th className="py-2.5 px-4 font-semibold">Redemptions</th>
                                    <th className="py-2.5 px-4 font-semibold">Validity</th>
                                    <th className="py-2.5 px-4 font-semibold">Status</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.coupons.map((coupon) => {
                                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                                    const isPercentage = coupon.type === "PERCENTAGE";

                                    return (
                                        <tr
                                            key={coupon.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                        >
                                            {/* Voucher Code */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-orange-50 text-orange-950 border border-orange-200 tracking-wider">
                                                        {coupon.code}
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(coupon.code, "Coupon code")}
                                                        className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded hover:bg-slate-100 transition-colors"
                                                        title="Copy code"
                                                    >
                                                        {copiedCode === coupon.code ? (
                                                            <Check size={12} className="text-emerald-600" />
                                                        ) : (
                                                            <Copy size={12} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Issuing Store */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                                        <Store size={12} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-slate-900 block truncate max-w-[150px]">
                                                            {coupon.shop?.profile?.name || coupon.shop?.slug || "Unknown Shop"}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                                                            /{coupon.shop?.slug}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Discount Value */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {isPercentage ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                                        <Percent size={11} className="text-blue-600" />
                                                        <span>{Number(coupon.value)}% off</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        <DollarSign size={11} className="text-emerald-600" />
                                                        <span>${Number(coupon.value).toFixed(2)} off</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Min Order */}
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                                {coupon.minOrderAmount ? (
                                                    <span className="font-mono text-xs font-medium text-slate-800">
                                                        ${Number(coupon.minOrderAmount).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">None</span>
                                                )}
                                            </td>

                                            {/* Redemptions / Usage */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-slate-900 tabular-nums">
                                                        {coupon.usedCount}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        {coupon.maxUses ? `/ ${coupon.maxUses}` : "(unlimited)"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Validity / Expiry */}
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                                {coupon.expiresAt ? (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={11} className="text-slate-400" />
                                                        <span className={isExpired ? "text-rose-600 font-semibold" : ""}>
                                                            {new Date(coupon.expiresAt).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                        Never expires
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {isExpired ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-800 border-rose-200">
                                                        <span className="size-1.5 rounded-full bg-rose-500" />
                                                        <span>Expired</span>
                                                    </span>
                                                ) : coupon.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-50 text-emerald-800 border-emerald-200">
                                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        <span>Active</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-700 border-slate-200">
                                                        <span className="size-1.5 rounded-full bg-slate-400" />
                                                        <span>Inactive</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions Button - All in One Unified Dropdown */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => handleOpenDropdown(e, coupon)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border shadow-2xs ${
                                                        dropdownState?.couponId === coupon.id
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
                            coupons
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                            >
                                <ChevronLeft size={13} />
                                <span>Previous</span>
                            </button>

                            <span className="px-2 text-xs text-slate-600 font-medium tabular-nums">
                                Page {data.page} of {data.totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
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

            {/* Floating Dropdown Menu (Fixed in viewport coordinates) */}
            {dropdownState && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setDropdownState(null)}
                    />
                    <div
                        className="fixed z-50 w-52 bg-white rounded-lg border border-slate-200 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: `${dropdownState.top}px`,
                            right: `${dropdownState.right}px`,
                        }}
                    >
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            Coupon Actions
                        </div>

                        {/* Inspect Coupon Details */}
                        <button
                            onClick={() => {
                                setSelectedCoupon(dropdownState.coupon);
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <Eye size={13} className="text-orange-500" />
                            <span>Inspect Details</span>
                        </button>

                        {/* Toggle Active / Inactive Status */}
                        <button
                            onClick={() => handleToggleCouponStatus(dropdownState.coupon)}
                            disabled={toggleCoupon.isPending}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer disabled:opacity-50"
                        >
                            {dropdownState.coupon.isActive ? (
                                <>
                                    <EyeOff size={13} className="text-rose-500" />
                                    <span>Deactivate Coupon</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>Activate Coupon</span>
                                </>
                            )}
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {/* Copy Code */}
                        <button
                            onClick={() => copyToClipboard(dropdownState.coupon.code, "Coupon code")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <Copy size={13} className="text-slate-400" />
                            <span>Copy Voucher Code</span>
                        </button>

                        {/* Copy Coupon ID */}
                        <button
                            onClick={() => copyToClipboard(dropdownState.coupon.id, "Coupon ID")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <Copy size={13} className="text-slate-400" />
                            <span>Copy Coupon ID</span>
                        </button>

                        {/* Visit Merchant Store */}
                        <button
                            onClick={() => {
                                setDropdownState(null);
                                navigate(`/superadmin/shops?search=${encodeURIComponent(dropdownState.coupon.shop?.slug || "")}`);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <ExternalLink size={13} className="text-slate-400" />
                            <span>View Store Profile</span>
                        </button>
                    </div>
                </>
            )}

            {/* Inspect Coupon Detail Modal */}
            {selectedCoupon && (
                <CouponDetailModal
                    coupon={selectedCoupon}
                    onClose={() => setSelectedCoupon(null)}
                    onToggleStatus={() => handleToggleCouponStatus(selectedCoupon)}
                    isToggling={toggleCoupon.isPending}
                />
            )}
        </div>
    );
};

// -----------------------------------------------------------------------------------------
// Coupon Detail Modal Component
// -----------------------------------------------------------------------------------------
interface CouponDetailModalProps {
    coupon: AdminCoupon;
    onClose: () => void;
    onToggleStatus: () => void;
    isToggling: boolean;
}

function CouponDetailModal({ coupon, onClose, onToggleStatus, isToggling }: CouponDetailModalProps) {
    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
    const isPercentage = coupon.type === "PERCENTAGE";

    return (
        <ModalPortal onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 my-auto overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                                <Ticket size={14} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                    <span>Voucher Details</span>
                                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-orange-50 text-orange-950 border border-orange-200 font-bold">
                                        {coupon.code}
                                    </span>
                                </h2>
                                <p className="text-[11px] text-slate-500">
                                    Promotional configuration, discount logic, and merchant assignment.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-pointer"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4 text-xs">
                        {/* Status Alert Banner */}
                        <div
                            className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                                isExpired
                                    ? "bg-rose-50 border-rose-200 text-rose-900"
                                    : coupon.isActive
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                    : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {isExpired ? (
                                    <XCircle size={15} className="text-rose-600 shrink-0" />
                                ) : coupon.isActive ? (
                                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <EyeOff size={15} className="text-slate-500 shrink-0" />
                                )}
                                <span className="font-medium text-xs">
                                    {isExpired
                                        ? "This voucher has expired and is rejected at checkout."
                                        : coupon.isActive
                                        ? "This voucher is active and accepting redemptions."
                                        : "This voucher is paused / deactivated by admin or merchant."}
                                </span>
                            </div>

                            <button
                                onClick={onToggleStatus}
                                disabled={isToggling}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
                                    coupon.isActive
                                        ? "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                                        : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                }`}
                            >
                                {isToggling ? "Updating…" : coupon.isActive ? "Deactivate" : "Activate"}
                            </button>
                        </div>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <span className="text-[10px] text-slate-400 font-medium block">
                                    Discount Rate
                                </span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                                    {isPercentage ? `${Number(coupon.value)}% Off` : `$${Number(coupon.value).toFixed(2)} Off`}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
                                    Type: {coupon.type}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <span className="text-[10px] text-slate-400 font-medium block">
                                    Order Minimum
                                </span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                                    {coupon.minOrderAmount ? `$${Number(coupon.minOrderAmount).toFixed(2)}` : "No minimum"}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
                                    Threshold requirement
                                </span>
                            </div>

                            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <span className="text-[10px] text-slate-400 font-medium block">
                                    Redemptions Used
                                </span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                                    {coupon.usedCount}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
                                    Cap: {coupon.maxUses ? `${coupon.maxUses} total` : "Unlimited"}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <span className="text-[10px] text-slate-400 font-medium block">
                                    Expiration Window
                                </span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block truncate">
                                    {coupon.expiresAt
                                        ? new Date(coupon.expiresAt).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                          })
                                        : "Never"}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
                                    {isExpired ? "Status: Expired" : "Status: Valid"}
                                </span>
                            </div>
                        </div>

                        {/* Store Details */}
                        <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Issuing Store Merchant
                            </span>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                                        <Store size={14} />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900 block text-xs">
                                            {coupon.shop?.profile?.name || coupon.shop?.slug || "Store Merchant"}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 block">
                                            /{coupon.shop?.slug}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">
                                    Shop ID: {coupon.shopId.slice(0, 10)}…
                                </span>
                            </div>
                        </div>

                        {/* Metadata Rows */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <div className="flex justify-between py-1">
                                <span>Coupon ID</span>
                                <span className="font-mono text-slate-700">{coupon.id}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>Created Date</span>
                                <span className="text-slate-700">
                                    {new Date(coupon.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}
