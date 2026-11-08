import React, { useState, useEffect } from "react";
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ShoppingCart,
    Eye,
    X,
    RefreshCw,
    Copy,
    ExternalLink,
    RotateCcw,
    Package,
    Truck,
    Tag,
    CheckCircle2,
} from "lucide-react";
import { useAdminOrders, useAdminOrderById, useAdminOrderAnalytics } from "@/features/admin/admin.hooks";
import { toast } from "@/components/ui/toast";
import { ModalPortal } from "@/components/ui/ds-components";
import { AdminOrderAnalyticsSection, OrderLifecyclePipeline } from "./AdminOrderAnalytics";
import type { AdminOrder } from "@/features/admin/admin.api";

// ─── Order Status Configuration (Fintech Pastel Badges with Crisp Borders) ───────
const ORDER_STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    PENDING: {
        label: "Pending",
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
    },
    CONFIRMED: {
        label: "Confirmed",
        dot: "bg-emerald-500", // Good -> Green!
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    PROCESSING: {
        label: "Processing",
        dot: "bg-orange-500", // Decore -> Orange!
        badge: "bg-orange-50 text-orange-800 border-orange-200",
    },
    SHIPPED: {
        label: "Shipped",
        dot: "bg-violet-500",
        badge: "bg-violet-50 text-violet-800 border-violet-200",
    },
    DELIVERED: {
        label: "Delivered",
        dot: "bg-emerald-500", // Good -> Green!
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    CANCELLED: {
        label: "Cancelled",
        dot: "bg-rose-500", // Bad -> Red!
        badge: "bg-rose-50 text-rose-800 border-rose-200",
    },
    REFUNDED: {
        label: "Refunded",
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
    },
    EXPIRED: {
        label: "Expired",
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
    },
    REFUND_PENDING: {
        label: "Refund Pending",
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
    },
    RETURN_REQUESTED: {
        label: "Return Requested",
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
    },
    RETURNED: {
        label: "Returned",
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
    },
};

export const OrderStatusBadge = ({ status }: { status: string }) => {
    const cfg = ORDER_STATUS_CONFIG[status] ?? {
        label: status,
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200/80",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${cfg.badge}`}>
            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
            <span>{cfg.label}</span>
        </span>
    );
};

const formatCurrency = (val: number | string | undefined | null) => {
    const num = typeof val === "string" ? parseFloat(val) : (val ?? 0);
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
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

const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return dateStr;
    }
};

const copyToClipboard = async (text: string, label: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.add({
            title: "Copied to clipboard",
            description: `${label} copied.`,
            type: "success",
        });
    } catch {
        toast.add({
            title: "Copy failed",
            description: "Unable to copy to clipboard.",
            type: "error",
        });
    }
};

const ALL_ORDER_STATUSES = [
    "",
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
    "EXPIRED",
    "REFUND_PENDING",
    "RETURN_REQUESTED",
    "RETURNED",
];

const ORDER_TABS = [
    { id: "", label: "All Orders", countKey: "totalOrders" as const },
    { id: "DELIVERED", label: "Delivered", countKey: "deliveredOrders" as const },
    { id: "CONFIRMED", label: "Confirmed", statusKey: "CONFIRMED" },
    { id: "PROCESSING", label: "Processing", countKey: "processingOrders" as const },
    { id: "SHIPPED", label: "Shipped", countKey: "shippedOrders" as const },
    { id: "PENDING", label: "Pending", countKey: "pendingOrders" as const },
    { id: "CANCELLED", label: "Cancelled", countKey: "cancelledOrders" as const },
    { id: "REFUNDED", label: "Refunded", countKey: "returnedOrders" as const },
];

const LIMIT_OPTIONS = [20, 50, 100];

// ─── Main Admin Orders Page ────────────────────────────────────────
export const AdminOrdersPage = () => {
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Floating 3-dot dropdown menu state
    const [dropdownState, setDropdownState] = useState<{
        orderId: string;
        order: AdminOrder;
        top: number;
        right: number;
        openUpwards: boolean;
    } | null>(null);

    useEffect(() => {
        const handleScrollOrResize = () => {
            setDropdownState(null);
        };
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, []);

    const { data, isLoading, isError, refetch } = useAdminOrders({
        search,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
    });

    const { data: analyticsData } = useAdminOrderAnalytics({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
    };

    const resetFilters = () => {
        setSearch("");
        setSearchInput("");
        setStatus("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, order: AdminOrder) => {
        e.stopPropagation();
        if (dropdownState?.orderId === order.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 180;

        setDropdownState({
            orderId: order.id,
            order,
            top: openUpwards ? rect.top - 4 : rect.bottom + 4,
            right: window.innerWidth - rect.right,
            openUpwards,
        });
    };

    const isFiltered = Boolean(search || status || dateFrom || dateTo);

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
                    onClick={() => setPage(Number(p))}
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

    return (
        <div className="space-y-6">
            {/* Header (Matching SettingsPage / Protected Status Header Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Orders
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Live Registry
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Platform transaction registry, order lifecycle states, and customer settlement records.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh orders list"
                    >
                        <RefreshCw size={13} className={isLoading ? "animate-spin text-orange-500" : "text-slate-500"} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Order Lifecycle Pipeline (Interactive KPI Status Tiles) */}
            <OrderLifecyclePipeline
                dateFrom={dateFrom}
                dateTo={dateTo}
                activeStatus={status}
                onSelectStatus={(s) => {
                    setStatus(status === s ? "" : s);
                    setPage(1);
                }}
            />

            {/* Order Analytics Suite (Permanently Displayed - No Collapse) */}
            <AdminOrderAnalyticsSection parentDateFrom={dateFrom} parentDateTo={dateTo} />

            {/* Navigation Tabs Bar with High-Visibility Orange 600 Tracker & Distinct Background */}
            <div className="flex items-center gap-1 border-b border-slate-200 mt-5 overflow-x-auto no-scrollbar">
                {ORDER_TABS.map((t) => {
                    const isActive = status === t.id;
                    let countVal: number | undefined;
                    if (analyticsData) {
                        if ("countKey" in t && t.countKey) {
                            countVal = (analyticsData as any)[t.countKey];
                        } else if ("statusKey" in t && t.statusKey) {
                            const item = analyticsData.ordersByStatus?.find((s) => s.status === t.statusKey);
                            countVal = item?.count;
                        }
                    }
                    return (
                        <button
                            key={t.id || "all"}
                            onClick={() => {
                                setStatus(t.id);
                                setPage(1);
                            }}
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

            {/* Main Content Box: Filters Bar & Orders Data Table */}
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
                            placeholder="Filter by customer, email, order ID, or store…"
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

                    {/* Secondary Dropdown & Date Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Select (all including expired, refund requested, etc.) */}
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value="">All statuses</option>
                            {ALL_ORDER_STATUSES.filter(Boolean).map((s) => (
                                <option key={s} value={s}>
                                    {ORDER_STATUS_CONFIG[s]?.label ?? s}
                                </option>
                            ))}
                        </select>

                        {/* Date Range Inputs */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setPage(1);
                                }}
                                className="h-8 border border-slate-200 rounded-md px-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                title="From date"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setPage(1);
                                }}
                                className="h-8 border border-slate-200 rounded-md px-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                title="To date"
                            />
                        </div>

                        {/* Rows Per Page */}
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            {LIMIT_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / page
                                </option>
                            ))}
                        </select>

                        {/* Reset Filters Pill */}
                        {isFiltered && (
                            <button
                                onClick={resetFilters}
                                className="h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-transparent"
                            >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                        <Loader2 className="animate-spin text-slate-500" size={24} />
                        <span className="text-xs font-medium">Loading orders…</span>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-xs text-rose-600">
                        Failed to load orders. Please verify network connection and retry.
                    </div>
                ) : !data || data.orders.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <ShoppingCart className="mx-auto size-9 text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-800">No orders found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isFiltered
                                ? "No orders match your active filter criteria."
                                : "No orders are currently recorded on the platform."}
                        </p>
                        {isFiltered && (
                            <button
                                onClick={resetFilters}
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
                                    <th className="py-2.5 px-4 font-semibold">Order ID</th>
                                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                                    <th className="py-2.5 px-4 font-semibold">Merchant / Store</th>
                                    <th className="py-2.5 px-4 font-semibold">Status</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Items</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Total Amount</th>
                                    <th className="py-2.5 px-4 font-semibold">Date</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.orders.map((order) => (
                                    <tr key={order.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                                        {/* Order ID */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedOrderId(order.id)}
                                                className="font-mono text-xs font-medium text-slate-900 hover:text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                                title={`View order #${order.id}`}
                                            >
                                                <span>#{order.id.slice(0, 8)}</span>
                                            </button>
                                        </td>

                                        {/* Customer */}
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium text-slate-900 text-xs">
                                                    {order.customer.name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    {order.customer.email}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Store / Merchant */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-medium text-slate-900 text-xs">
                                                    {order.shop.profile?.name ?? order.shop.slug}
                                                </span>
                                                <a
                                                    href={`/${order.shop.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                                    title="Open merchant storefront"
                                                >
                                                    <ExternalLink size={11} />
                                                </a>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <OrderStatusBadge status={order.status} />
                                        </td>

                                        {/* Items Count */}
                                        <td className="py-3 px-4 whitespace-nowrap text-right text-slate-600">
                                            <span className="tabular-nums font-medium text-xs">
                                                {order._count.items}
                                            </span>{" "}
                                            <span className="text-[11px] text-slate-400">
                                                {order._count.items === 1 ? "item" : "items"}
                                            </span>
                                        </td>

                                        {/* Total Amount */}
                                        <td className="py-3 px-4 whitespace-nowrap text-right">
                                            <span className="font-semibold text-slate-900 tabular-nums">
                                                {formatCurrency(order.totalAmount)}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                            {formatDate(order.createdAt)}
                                        </td>

                                        {/* Actions - All in One Unified Actions Button */}
                                        <td className="py-3 px-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={(e) => handleOpenDropdown(e, order)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border shadow-2xs ${
                                                    dropdownState?.orderId === order.id
                                                        ? "bg-slate-100 text-slate-900 border-slate-300"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                            >
                                                <span>Actions</span>
                                                <ChevronDown size={12} className="text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Bar */}
                {data && data.total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white text-xs text-slate-500">
                        <div>
                            Showing{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {Math.min((data.page - 1) * data.limit + 1, data.total)}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {Math.min(data.page * data.limit, data.total)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {data.total.toLocaleString()}
                            </span>{" "}
                            orders
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

                            <div className="hidden sm:flex items-center gap-1">
                                {renderPaginationNumbers()}
                            </div>

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

            {/* Floating 3-Dot Dropdown Menu */}
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
                                    const oId = dropdownState.orderId;
                                    setDropdownState(null);
                                    setSelectedOrderId(oId);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <Eye size={13} className="text-slate-400" />
                                <span>Inspect order details</span>
                            </button>
                            <a
                                href={`/${dropdownState.order.shop.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setDropdownState(null)}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <ExternalLink size={13} className="text-slate-400" />
                                <span>Open storefront</span>
                            </a>
                        </div>

                        <div className="py-1">
                            <button
                                onClick={() => {
                                    const id = dropdownState.order.id;
                                    setDropdownState(null);
                                    copyToClipboard(id, "Order ID");
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy Order ID</span>
                            </button>
                            {dropdownState.order.customer?.email && (
                                <button
                                    onClick={() => {
                                        const email = dropdownState.order.customer.email;
                                        setDropdownState(null);
                                        copyToClipboard(email, "Customer email");
                                    }}
                                    className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <Copy size={13} className="text-slate-400" />
                                    <span>Copy Customer Email</span>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Order Detail Modal */}
            {selectedOrderId && (
                <AdminOrderModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </div>
    );
};

// ─── Refined Fintech Order Detail Modal ───────────────────────────
interface AdminOrderModalProps {
    orderId: string;
    onClose: () => void;
}

const AdminOrderModal = ({ orderId, onClose }: AdminOrderModalProps) => {
    const { data: order, isLoading } = useAdminOrderById(orderId);

    return (
        <ModalPortal onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-auto max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                    {/* Modal Sticky Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-2.5 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                                    #{orderId.slice(0, 12)}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(orderId, "Order ID")}
                                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                    title="Copy full Order ID"
                                >
                                    <Copy size={12} />
                                </button>
                            </div>
                            {order && <OrderStatusBadge status={order.status} />}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {order?.createdAt && (
                                <span className="text-[11px] text-slate-400 mr-2">
                                    {formatDateTime(order.createdAt)}
                                </span>
                            )}
                            <button
                                onClick={onClose}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                            <Loader2 className="animate-spin text-slate-500" size={24} />
                            <span className="text-xs font-medium">Fetching order records…</span>
                        </div>
                    ) : order ? (
                        <div className="p-5 space-y-5 text-xs">
                            {/* Financial Summary Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md">
                                    <p className="text-[11px] font-medium text-slate-500">Total Charged</p>
                                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                                        {formatCurrency(order.totalAmount)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Gross settlement</p>
                                </div>

                                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md">
                                    <p className="text-[11px] font-medium text-slate-500">Discount Applied</p>
                                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                                        {Number(order.discountAmount) > 0
                                            ? `-${formatCurrency(order.discountAmount)}`
                                            : "$0.00"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Promotions</p>
                                </div>

                                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md col-span-2 sm:col-span-1">
                                    <p className="text-[11px] font-medium text-slate-500">Purchased Units</p>
                                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                                        {order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || order.items?.length || 1} units
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {order.items?.length || 0} unique line items
                                    </p>
                                </div>
                            </div>

                            {/* Specifications Grid: Customer & Merchant Info */}
                            <div className="border border-slate-200 rounded-md divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2">
                                <div className="p-3 space-y-2">
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium">Customer</span>
                                        <p className="text-xs font-semibold text-slate-900 mt-0.5">
                                            {order.customer?.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                            {order.customer?.email}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium">Customer ID</span>
                                        <p className="text-xs font-mono text-slate-600 mt-0.5">
                                            {order.customer?.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 space-y-2">
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium">Merchant Storefront</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {order.shop?.profile?.name ?? order.shop?.slug}
                                            </p>
                                            {order.shop?.slug && (
                                                <a
                                                    href={`/${order.shop.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 hover:text-slate-700"
                                                    title="View storefront"
                                                >
                                                    <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium">Store Slug</span>
                                        <p className="text-xs font-mono text-slate-600 mt-0.5">
                                            @{order.shop?.slug}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipment Details Box */}
                            {order.shipment && (() => {
                                const shipment = order.shipment;
                                return (
                                    <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-2">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                                            <Truck size={13} className="text-slate-500" />
                                            <span>Fulfillment & Shipment</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                                            <div>
                                                <span className="text-[11px] text-slate-400">Method</span>
                                                <p className="font-medium text-slate-900 mt-0.5">{shipment.method}</p>
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-slate-400">Carrier</span>
                                                <p className="font-medium text-slate-900 mt-0.5">{shipment.carrier || "Standard"}</p>
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-slate-400">Tracking Number</span>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="font-mono text-slate-800">{shipment.trackingNumber || "—"}</span>
                                                    {shipment.trackingNumber && (
                                                        <button
                                                            onClick={() => copyToClipboard(shipment.trackingNumber!, "Tracking number")}
                                                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                                            title="Copy tracking"
                                                        >
                                                            <Copy size={11} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Coupon Applied */}
                            {order.coupon && (
                                <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <Tag size={13} className="text-emerald-600" />
                                        <div>
                                            <span className="font-mono font-semibold text-emerald-900">
                                                {order.coupon.code}
                                            </span>
                                            <span className="text-emerald-700 text-[11px] ml-2">
                                                Promotion Applied
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                                        {order.coupon.type === "PERCENTAGE"
                                            ? `${order.coupon.value}% discount`
                                            : `-${formatCurrency(order.coupon.value)} discount`}
                                    </span>
                                </div>
                            )}

                            {/* Order Line Items */}
                            <div className="space-y-1.5">
                                <span className="font-medium text-slate-500">
                                    Order Items ({order.items?.length || 0})
                                </span>
                                <div className="border border-slate-200 rounded-md overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2 font-semibold">Product</th>
                                                <th className="px-3 py-2 font-semibold text-right">Unit Price</th>
                                                <th className="px-3 py-2 font-semibold text-right">Qty</th>
                                                <th className="px-3 py-2 font-semibold text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {order.items?.map((item: any, idx: number) => {
                                                const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
                                                const imgUrl = item.product?.images?.[0]?.url;
                                                return (
                                                    <tr key={item.id || idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="size-8 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                                    {imgUrl ? (
                                                                        <img src={imgUrl} alt="" className="size-full object-cover" />
                                                                    ) : (
                                                                        <Package size={14} className="text-slate-400 stroke-[1.5]" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-slate-900 truncate">
                                                                        {item.product?.name}
                                                                    </p>
                                                                    {item.variant && (
                                                                        <p className="text-[11px] text-slate-400 font-normal">
                                                                            {item.variant.name}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-medium text-slate-800 tabular-nums">
                                                            {formatCurrency(item.unitPrice)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">
                                                            ×{item.quantity}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                                                            {formatCurrency(lineTotal)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 text-xs">
                            Order record not found.
                        </div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

export default AdminOrdersPage;
