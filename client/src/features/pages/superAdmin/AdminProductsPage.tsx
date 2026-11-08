import React, { useState, useEffect } from "react";
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Package,
    ExternalLink,
    Eye,
    CheckCircle2,
    Archive,
    X,
    Layers,
    RefreshCw,
    Copy,
    AlertTriangle,
    Boxes,
    Star,
    RotateCcw,
} from "lucide-react";
import { useAdminProducts, useAdminProductById, useUpdateProductStatus } from "@/features/admin/admin.hooks";
import { toast } from "@/components/ui/toast";
import { ModalPortal } from "@/components/ui/ds-components";
import type { AdminProduct } from "@/features/admin/admin.api";

// ─── Formatters & Utility Helpers ─────────────────────────────────
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

// ─── Soft Pastel Status Badges with Crisp Borders ─────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    ACTIVE: {
        label: "Active",
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    DRAFT: {
        label: "Draft",
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
    },
    ARCHIVED: {
        label: "Archived",
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
    },
};

export const ProductStatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] ?? {
        label: status,
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${cfg.badge}`}>
            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
            <span>{cfg.label}</span>
        </span>
    );
};

type CatalogTab = "ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED" | "OUT_OF_STOCK";

const LIMIT_OPTIONS = [20, 50, 100];

// ─── Filter Tabs ──────────────────────────────────────────────────
const PRODUCT_TABS = [
    { key: "ALL" as const, label: "All listings", countKey: "total" as const },
    { key: "ACTIVE" as const, label: "Active Listings", countKey: "active" as const },
    { key: "DRAFT" as const, label: "Draft Items", countKey: "draft" as const },
    { key: "ARCHIVED" as const, label: "Archived & Delisted", countKey: "archived" as const },
    { key: "OUT_OF_STOCK" as const, label: "Out of Stock", countKey: "outOfStock" as const },
];

// ─── Main Admin Products Page ──────────────────────────────────────
export const AdminProductsPage = () => {
    const [tab, setTab] = useState<CatalogTab>("ALL");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("");
    const [inStock, setInStock] = useState<string>("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Selected product for detail inspection modal
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    // Floating 3-dot dropdown state
    const [dropdownState, setDropdownState] = useState<{
        productId: string;
        product: AdminProduct;
        top: number;
        right: number;
        openUpwards: boolean;
    } | null>(null);

    // Status change confirmation modal state
    const [confirmationAction, setConfirmationAction] = useState<{
        product: AdminProduct;
        type: "ACTIVE" | "ARCHIVED" | "DRAFT";
    } | null>(null);

    // Close floating dropdown on scroll or resize
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

    const { data, isLoading, isError, refetch } = useAdminProducts({
        search,
        status: status || undefined,
        inStock: inStock === "" ? undefined : inStock === "true",
        page,
        limit,
    });

    const updateStatus = useUpdateProductStatus();

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

    const handleTabChange = (newTab: CatalogTab) => {
        setTab(newTab);
        setPage(1);
        if (newTab === "ALL") {
            setStatus("");
            setInStock("");
        } else if (newTab === "ACTIVE") {
            setStatus("ACTIVE");
            setInStock("");
        } else if (newTab === "DRAFT") {
            setStatus("DRAFT");
            setInStock("");
        } else if (newTab === "ARCHIVED") {
            setStatus("ARCHIVED");
            setInStock("");
        } else if (newTab === "OUT_OF_STOCK") {
            setStatus("");
            setInStock("false");
        }
    };

    const handleResetAllFilters = () => {
        setTab("ALL");
        setSearch("");
        setSearchInput("");
        setStatus("");
        setInStock("");
        setPage(1);
    };

    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, product: AdminProduct) => {
        e.stopPropagation();
        if (dropdownState?.productId === product.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 240;

        setDropdownState({
            productId: product.id,
            product,
            top: openUpwards ? rect.top - 4 : rect.bottom + 4,
            right: window.innerWidth - rect.right,
            openUpwards,
        });
    };

    const handleConfirmStatusChange = async () => {
        if (!confirmationAction) return;
        const { product, type } = confirmationAction;
        try {
            await updateStatus.mutateAsync({ id: product.id, status: type });
            const label = type === "ARCHIVED" ? "delisted" : type === "ACTIVE" ? "published" : "set to draft";
            toast.add({
                title: "Listing updated",
                description: `"${product.name}" has been ${label}.`,
                type: "success",
            });
            setConfirmationAction(null);
        } catch (err: any) {
            toast.add({
                title: "Update failed",
                description: err?.response?.data?.message ?? "An error occurred while updating status.",
                type: "error",
            });
        }
    };

    const stats = data?.stats;
    const isFiltered = Boolean(search || status || inStock || tab !== "ALL");

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
        <div className="space-y-5">
            {/* Page Header (Matching SettingsPage / Image Header Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Product Catalog
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Live Catalog
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Platform-wide inventory directory, SKU availability, and merchant listing status.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh catalog data"
                    >
                        <RefreshCw size={13} className={isLoading ? "animate-spin text-orange-500" : "text-slate-500"} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Summary Tiles (Interactive Quick Filters) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Total Catalog (Orange decore) */}
                <button
                    onClick={() => handleTabChange("ALL")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "ALL" && !inStock
                            ? "bg-orange-50/20 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Total Catalog</span>
                        <Boxes size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.total.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Platform-wide SKUs</p>
                </button>

                {/* 2. Active Listings (Good thing -> Green!) */}
                <button
                    onClick={() => handleTabChange("ACTIVE")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "ACTIVE"
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
                        Live on marketplace
                    </p>
                </button>

                {/* 3. Draft Items */}
                <button
                    onClick={() => handleTabChange("DRAFT")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "DRAFT"
                            ? "bg-amber-50/40 border-amber-500 ring-1 ring-amber-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-amber-800 font-medium mb-1">
                        <span>Drafts</span>
                        <Package size={14} className="text-amber-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.draft.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Unpublished by seller</p>
                </button>

                {/* 4. Delisted / Archived */}
                <button
                    onClick={() => handleTabChange("ARCHIVED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "ARCHIVED"
                            ? "bg-slate-100 border-slate-700 ring-1 ring-slate-700 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Archived</span>
                        <Archive size={14} className="text-slate-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.archived.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Delisted from public catalog</p>
                </button>

                {/* 5. Depleted Stock (Bad thing -> Red!) */}
                <button
                    onClick={() => handleTabChange("OUT_OF_STOCK")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "OUT_OF_STOCK"
                            ? "bg-rose-50/40 border-rose-500 ring-1 ring-rose-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
                        <span>Out of Stock</span>
                        <AlertTriangle size={14} className="text-rose-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.outOfStock.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-rose-500" />
                        0 units on hand
                    </p>
                </button>
            </div>

            {/* Navigation Tabs Bar with High-Visibility Orange 600 Tracker & Distinct Background */}
            <div className="flex items-center gap-1 border-b border-slate-200 mt-5 overflow-x-auto no-scrollbar">
                {PRODUCT_TABS.map((t) => {
                    const isActive = tab === t.key && (t.key !== "ALL" || !inStock);
                    const countVal = stats ? stats[t.countKey] : undefined;
                    return (
                        <button
                            key={t.key}
                            onClick={() => handleTabChange(t.key)}
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

            {/* Main Content Box: Filter Bar & Orders Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Search & Secondary Filter Controls */}
                <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/40">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Filter by title, SKU, or merchant…"
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
                        {/* Status Select */}
                        <select
                            value={status}
                            onChange={(e) => {
                                const val = e.target.value;
                                setStatus(val);
                                setPage(1);
                                if (val === "ACTIVE") setTab("ACTIVE");
                                else if (val === "DRAFT") setTab("DRAFT");
                                else if (val === "ARCHIVED") setTab("ARCHIVED");
                                else if (val === "") setTab(inStock === "false" ? "OUT_OF_STOCK" : "ALL");
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value="">All statuses</option>
                            <option value="ACTIVE">Active (Published)</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ARCHIVED">Archived / Delisted</option>
                        </select>

                        {/* Stock Inventory Filter */}
                        <select
                            value={inStock}
                            onChange={(e) => {
                                const val = e.target.value;
                                setInStock(val);
                                setPage(1);
                                if (val === "false") setTab("OUT_OF_STOCK");
                                else if (tab === "OUT_OF_STOCK") setTab("ALL");
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value="">All inventory</option>
                            <option value="true">In stock only</option>
                            <option value="false">Out of stock only</option>
                        </select>

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
                                onClick={handleResetAllFilters}
                                className="h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-transparent"
                            >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Table with Subtle Dividing Borders */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                        <Loader2 className="animate-spin text-slate-500" size={24} />
                        <span className="text-xs font-medium">Loading catalog data…</span>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-xs text-rose-600">
                        Failed to load product catalog. Please verify connection and retry.
                    </div>
                ) : !data || data.products.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Package className="mx-auto size-9 text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-800">No products found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isFiltered
                                ? "No items match your active search filters."
                                : "No products are currently registered on the platform."}
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
                                    <th className="py-2.5 px-4 font-semibold">Product & SKU</th>
                                    <th className="py-2.5 px-4 font-semibold">Merchant / Store</th>
                                    <th className="py-2.5 px-4 font-semibold">Category</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Unit Price</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Inventory</th>
                                    <th className="py-2.5 px-4 font-semibold">Status</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.products.map((product) => {
                                    const primaryImg = product.images.find((i) => i.isPrimary) || product.images[0];
                                    const isOutOfStock = product.stock <= 0;
                                    const isLowStock = product.stock > 0 && product.stock <= 5;

                                    return (
                                        <tr
                                            key={product.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                        >
                                            {/* Product Column */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                        {primaryImg ? (
                                                            <img
                                                                src={primaryImg.url}
                                                                alt={product.name}
                                                                className="size-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <Package size={16} className="text-slate-400 stroke-[1.5]" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs sm:max-w-sm">
                                                        <button
                                                            onClick={() => setSelectedProductId(product.id)}
                                                            className="text-left font-medium text-slate-900 truncate hover:text-slate-600 transition-colors cursor-pointer block w-full"
                                                            title={product.name}
                                                        >
                                                            {product.name}
                                                        </button>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {product.sku ? (
                                                                <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                                                    {product.sku}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-400">No SKU</span>
                                                            )}
                                                            {product._count.variants > 0 && (
                                                                <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                                                    <Layers size={10} />
                                                                    {product._count.variants} variants
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Store Column */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-medium text-slate-900 text-xs">
                                                            {product.shop.profile?.name || product.shop.slug}
                                                        </span>
                                                        <a
                                                            href={`/${product.shop.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                                            title="Open merchant storefront"
                                                        >
                                                            <ExternalLink size={11} />
                                                        </a>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {product.shop.owner.email}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Category Column */}
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                                {product.platformCategory?.name || "—"}
                                            </td>

                                            {/* Price Column */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <span className="font-medium text-slate-900 tabular-nums">
                                                    {formatCurrency(product.basePrice)}
                                                </span>
                                            </td>

                                            {/* Stock / Inventory Column */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <div className="inline-flex flex-col items-end">
                                                    <span className="font-medium text-slate-800 tabular-nums">
                                                        {product.stock.toLocaleString()}
                                                    </span>
                                                    {isOutOfStock ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200 mt-0.5">
                                                            Out of stock
                                                        </span>
                                                    ) : isLowStock ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 mt-0.5">
                                                            Low stock ({product.stock})
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>

                                            {/* Status Column */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <ProductStatusBadge status={product.status} />
                                            </td>

                                            {/* Action Column - All in One Unified Actions Button */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => handleOpenDropdown(e, product)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border shadow-2xs ${
                                                        dropdownState?.productId === product.id
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
                            products
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

            {/* Floating 3-Dot All-In-One Dropdown Menu */}
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
                                    const pId = dropdownState.productId;
                                    setDropdownState(null);
                                    setSelectedProductId(pId);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <Eye size={13} className="text-slate-400" />
                                <span>Inspect details</span>
                            </button>
                            <a
                                href={`/${dropdownState.product.shop.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setDropdownState(null)}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <ExternalLink size={13} className="text-slate-400" />
                                <span>View on storefront</span>
                            </a>
                        </div>

                        {/* Moderation Actions */}
                        <div className="py-1">
                            {dropdownState.product.status === "ACTIVE" ? (
                                <button
                                    onClick={() => {
                                        const p = dropdownState.product;
                                        setDropdownState(null);
                                        setConfirmationAction({ product: p, type: "ARCHIVED" });
                                    }}
                                    className="w-full px-3 py-1.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <Archive size={13} className="text-rose-500" />
                                    <span>Delist product</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        const p = dropdownState.product;
                                        setDropdownState(null);
                                        setConfirmationAction({ product: p, type: "ACTIVE" });
                                    }}
                                    className="w-full px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 size={13} className="text-emerald-500" />
                                    <span>Publish product</span>
                                </button>
                            )}
                            {dropdownState.product.status !== "DRAFT" && (
                                <button
                                    onClick={() => {
                                        const p = dropdownState.product;
                                        setDropdownState(null);
                                        setConfirmationAction({ product: p, type: "DRAFT" });
                                    }}
                                    className="w-full px-3 py-1.5 text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <Package size={13} className="text-amber-500" />
                                    <span>Move to draft</span>
                                </button>
                            )}
                        </div>

                        <div className="py-1">
                            {dropdownState.product.sku && (
                                <button
                                    onClick={() => {
                                        const sku = dropdownState.product.sku!;
                                        setDropdownState(null);
                                        copyToClipboard(sku, "SKU");
                                    }}
                                    className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <Copy size={13} className="text-slate-400" />
                                    <span>Copy SKU</span>
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    const id = dropdownState.product.id;
                                    setDropdownState(null);
                                    copyToClipboard(id, "Product ID");
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy Product ID</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Status Change Confirmation Modal */}
            {confirmationAction && (
                <ModalPortal onClose={() => setConfirmationAction(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setConfirmationAction(null);
                        }}
                    >
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {confirmationAction.type === "ARCHIVED"
                                        ? "Delist product from marketplace?"
                                        : confirmationAction.type === "ACTIVE"
                                        ? "Publish product to marketplace?"
                                        : "Move product to draft status?"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    {confirmationAction.type === "ARCHIVED"
                                        ? `Delisting "${confirmationAction.product.name}" will immediately hide it from public search results, categories, and buyer shopping carts.`
                                        : confirmationAction.type === "ACTIVE"
                                        ? `Publishing "${confirmationAction.product.name}" will make it publicly visible and purchasable across storefronts.`
                                        : `Moving "${confirmationAction.product.name}" to draft will unpublish it while preserving all inventory and pricing records.`}
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setConfirmationAction(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmStatusChange}
                                    disabled={updateStatus.isPending}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md shadow-2xs transition-colors cursor-pointer ${
                                        confirmationAction.type === "ARCHIVED"
                                            ? "bg-rose-600 hover:bg-rose-700"
                                            : confirmationAction.type === "ACTIVE"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-slate-900 hover:bg-slate-800"
                                    }`}
                                >
                                    {updateStatus.isPending && <Loader2 size={12} className="animate-spin" />}
                                    <span>
                                        {confirmationAction.type === "ARCHIVED"
                                            ? "Confirm Delist"
                                            : confirmationAction.type === "ACTIVE"
                                            ? "Confirm Publish"
                                            : "Confirm Draft"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Product Detail / Inspection Modal */}
            {selectedProductId && (
                <AdminProductDetailModal
                    productId={selectedProductId}
                    onClose={() => setSelectedProductId(null)}
                />
            )}
        </div>
    );
};

// ─── Refined Fintech Product Detail Modal ─────────────────────────
interface AdminProductDetailModalProps {
    productId: string;
    onClose: () => void;
}

const AdminProductDetailModal = ({ productId, onClose }: AdminProductDetailModalProps) => {
    const { data: product, isLoading } = useAdminProductById(productId);
    const updateStatus = useUpdateProductStatus();
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const handleStatusUpdate = async (newStatus: "ACTIVE" | "DRAFT" | "ARCHIVED") => {
        if (!product) return;
        try {
            await updateStatus.mutateAsync({ id: product.id, status: newStatus });
            const label = newStatus === "ARCHIVED" ? "delisted" : newStatus === "ACTIVE" ? "published" : "set to draft";
            toast.add({
                title: "Listing updated",
                description: `Product is now ${label}.`,
                type: "success",
            });
        } catch (err: any) {
            toast.add({
                title: "Update failed",
                description: err?.response?.data?.message ?? "An error occurred.",
                type: "error",
            });
        }
    };

    const images = product?.images ?? [];
    const activeImage = images[activeImageIndex] || images[0];
    const assetValuation = (Number(product?.basePrice) || 0) * (Number(product?.stock) || 0);

    return (
        <ModalPortal onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-auto max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                    {/* Modal Sticky Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-2.5 min-w-0 pr-4">
                            <h2 className="font-semibold text-slate-900 text-sm truncate">
                                {isLoading ? "Loading product…" : product?.name}
                            </h2>
                            {product && <ProductStatusBadge status={product.status} />}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {product?.shop?.slug && (
                                <a
                                    href={`/${product.shop.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
                                    title="Open merchant storefront"
                                >
                                    <ExternalLink size={12} className="text-slate-400" />
                                    <span>Storefront</span>
                                </a>
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
                        <div className="flex flex-col items-center justify-center h-72 gap-2 text-slate-400">
                            <Loader2 className="animate-spin text-slate-500" size={24} />
                            <span className="text-xs font-medium">Fetching listing records…</span>
                        </div>
                    ) : product ? (
                        <div className="p-5 space-y-5 text-xs">
                            {/* Financial & Inventory Overview Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md">
                                    <p className="text-[11px] font-medium text-slate-500">Unit Base Price</p>
                                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                                        {formatCurrency(product.basePrice)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">List price</p>
                                </div>

                                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md">
                                    <p className="text-[11px] font-medium text-slate-500">Inventory on Hand</p>
                                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                                        {product.stock.toLocaleString()} units
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {product.stock <= 0 ? "Depleted" : product.stock <= 5 ? "Low stock" : "Available"}
                                    </p>
                                </div>

                                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md">
                                    <p className="text-[11px] font-medium text-slate-500">Inventory Asset Value</p>
                                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                                        {formatCurrency(assetValuation)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Units × unit price</p>
                                </div>

                                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md">
                                    <p className="text-[11px] font-medium text-slate-500">Order Volume</p>
                                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                                        {(product._count?.orderItems || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Purchased items</p>
                                </div>
                            </div>

                            {/* Gallery Preview Strip */}
                            {images.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span className="font-medium">Product Imagery ({images.length})</span>
                                        {activeImage?.isPrimary && (
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                                Primary photo
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {images.map((img: any, idx: number) => {
                                            const isSelected = idx === activeImageIndex;
                                            return (
                                                <button
                                                    key={img.id || idx}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={`relative size-16 rounded-md border overflow-hidden shrink-0 transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "border-slate-900 ring-1 ring-slate-900"
                                                            : "border-slate-200 opacity-70 hover:opacity-100"
                                                    }`}
                                                >
                                                    <img
                                                        src={img.url}
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                    {img.isPrimary && (
                                                        <span className="absolute bottom-0.5 left-0.5 bg-slate-900/80 text-white text-[8px] px-1 rounded font-medium">
                                                            Primary
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Specifications Grid */}
                            <div className="border border-slate-200 rounded-md divide-y divide-slate-100 bg-white">
                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                    <div className="p-3 space-y-2">
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-medium">Merchant Storefront</span>
                                            <p className="text-xs font-medium text-slate-900 mt-0.5">
                                                {product.shop?.profile?.name || product.shop?.slug}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-medium">Store Owner</span>
                                            <p className="text-xs text-slate-700 mt-0.5 font-mono">
                                                {product.shop?.owner?.name} ({product.shop?.owner?.email})
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-medium">Catalog Category</span>
                                            <p className="text-xs text-slate-700 mt-0.5">
                                                {product.platformCategory?.name || "Uncategorized"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3 space-y-2">
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-medium">SKU</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="font-mono text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                                                    {product.sku || "—"}
                                                </span>
                                                {product.sku && (
                                                    <button
                                                        onClick={() => copyToClipboard(product.sku, "SKU")}
                                                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                                        title="Copy SKU"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-medium">Fulfillment Type</span>
                                            <p className="text-xs text-slate-700 mt-0.5">
                                                {product.type || "PHYSICAL"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-medium">Registration Date</span>
                                            <p className="text-xs text-slate-700 mt-0.5">
                                                {formatDate(product.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="space-y-1.5">
                                    <span className="font-medium text-slate-500">Listing Description</span>
                                    <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-md text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {product.description}
                                    </div>
                                </div>
                            )}

                            {/* Variants Matrix */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-500">
                                            Variants Breakdown ({product.variants.length})
                                        </span>
                                    </div>
                                    <div className="border border-slate-200 rounded-md overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-3 py-2 font-semibold">Variant Name</th>
                                                    <th className="px-3 py-2 font-semibold">SKU</th>
                                                    <th className="px-3 py-2 font-semibold text-right">Unit Price</th>
                                                    <th className="px-3 py-2 font-semibold text-right">Stock</th>
                                                    <th className="px-3 py-2 font-semibold text-right">Valuation</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {product.variants.map((v: any) => {
                                                    const varValuation = (Number(v.price) || 0) * (Number(v.stock) || 0);
                                                    return (
                                                        <tr
                                                            key={v.id}
                                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                                        >
                                                            <td className="px-3 py-2 font-medium text-slate-900">{v.name}</td>
                                                            <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                                                                {v.sku || "—"}
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-medium text-slate-900 tabular-nums">
                                                                {formatCurrency(v.price)}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                                                                {v.stock}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-slate-600 tabular-nums">
                                                                {formatCurrency(varValuation)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Recent Reviews (if any) */}
                            {product.reviews && product.reviews.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="font-medium text-slate-500">Recent Customer Reviews</span>
                                    <div className="border border-slate-200 rounded-md divide-y divide-slate-100 overflow-hidden">
                                        {product.reviews.map((rev: any) => (
                                            <div key={rev.id} className="p-3 text-xs space-y-1 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                        <span>{rev.user?.name || "Customer"}</span>
                                                        <span className="text-[11px] text-slate-400 font-normal">
                                                            ({rev.user?.email})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-amber-500">
                                                        <Star size={11} className="fill-amber-400" />
                                                        <span className="font-semibold text-slate-700 tabular-nums">
                                                            {rev.rating} / 5
                                                        </span>
                                                    </div>
                                                </div>
                                                {rev.comment && (
                                                    <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Platform Listing Governance Controls */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                                <div>
                                    <h4 className="font-semibold text-slate-900 text-xs">
                                        Platform Listing Status
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Status directly controls whether this listing is indexed in marketplace search, visible on storefronts, or withheld.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        onClick={() => handleStatusUpdate("ACTIVE")}
                                        disabled={product.status === "ACTIVE" || updateStatus.isPending}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
                                            product.status === "ACTIVE"
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold cursor-default"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-emerald-700 shadow-2xs"
                                        }`}
                                    >
                                        <CheckCircle2 size={13} className={product.status === "ACTIVE" ? "text-emerald-600" : "text-slate-400"} />
                                        <span>Active (Published)</span>
                                    </button>

                                    <button
                                        onClick={() => handleStatusUpdate("DRAFT")}
                                        disabled={product.status === "DRAFT" || updateStatus.isPending}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
                                            product.status === "DRAFT"
                                                ? "bg-amber-50 text-amber-800 border-amber-300 font-semibold cursor-default"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-amber-700 shadow-2xs"
                                        }`}
                                    >
                                        <Package size={13} className={product.status === "DRAFT" ? "text-amber-600" : "text-slate-400"} />
                                        <span>Draft (Unpublished)</span>
                                    </button>

                                    <button
                                        onClick={() => handleStatusUpdate("ARCHIVED")}
                                        disabled={product.status === "ARCHIVED" || updateStatus.isPending}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
                                            product.status === "ARCHIVED"
                                                ? "bg-slate-200 text-slate-800 border-slate-300 font-semibold cursor-default"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 shadow-2xs"
                                        }`}
                                    >
                                        <Archive size={13} className={product.status === "ARCHIVED" ? "text-slate-700" : "text-slate-400"} />
                                        <span>Delisted (Archived)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 text-xs">
                            Product record could not be loaded.
                        </div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

export default AdminProductsPage;
