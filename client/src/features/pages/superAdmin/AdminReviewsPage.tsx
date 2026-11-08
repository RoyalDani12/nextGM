import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Star,
    Eye,
    EyeOff,
    Trash2,
    MessageSquare,
    CheckCircle2,
    Package,
    Store,
    ShieldCheck,
    Download,
    RefreshCw,
    X,
    ChevronDown,
    Copy,
    Check,
    ExternalLink,
    AlertCircle,
    User,
    CornerDownRight,
} from "lucide-react";
import {
    useAdminReviews,
    useToggleReviewVisibility,
    useAdminDeleteReview,
} from "@/features/admin/admin.hooks";
import type { AdminReview } from "@/features/admin/admin.api";
import { ModalPortal } from "@/components/ui/ds-components";

// Filter tabs definition (no icons, matching design system)
const REVIEW_TABS = [
    { id: "ALL", label: "All Reviews" },
    { id: "VISIBLE", label: "Visible" },
    { id: "HIDDEN", label: "Hidden / Moderated" },
    { id: "FIVE_STAR", label: "5-Star Praise" },
    { id: "CRITICAL", label: "Critical (1-2 Stars)" },
] as const;

type ReviewTab = (typeof REVIEW_TABS)[number]["id"];

export const AdminReviewsPage = () => {
    // Search and filter state
    const [activeTab, setActiveTab] = useState<ReviewTab>("ALL");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [ratingFilter, setRatingFilter] = useState<string>("ALL");
    const [visibilityFilter, setVisibilityFilter] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Toast feedback notice
    const [feedbackNotice, setFeedbackNotice] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    // Modal states
    const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
    const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null);

    // Copied feedback helper
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Viewport-fixed Actions Dropdown
    const [dropdownState, setDropdownState] = useState<{
        reviewId: string;
        review: AdminReview;
        top: number;
        right: number;
        openUpwards: boolean;
    } | null>(null);

    // Close fixed dropdown on window resize or scroll
    useEffect(() => {
        const handleScrollOrResize = () => setDropdownState(null);
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, []);

    // Derive server filter query arguments based on active tab and secondary dropdowns
    const serverFilters = useMemo(() => {
        let isVisible: boolean | undefined = undefined;
        let rating: number | undefined = undefined;

        // Apply Tab filters
        if (activeTab === "VISIBLE") {
            isVisible = true;
        } else if (activeTab === "HIDDEN") {
            isVisible = false;
        } else if (activeTab === "FIVE_STAR") {
            rating = 5;
        }

        // Apply secondary dropdown filters (overrides if explicitly set)
        if (visibilityFilter === "VISIBLE") isVisible = true;
        if (visibilityFilter === "HIDDEN") isVisible = false;

        if (ratingFilter !== "ALL") {
            rating = parseInt(ratingFilter, 10);
        }

        return {
            search: search.trim() || undefined,
            rating,
            isVisible,
            page,
            limit,
        };
    }, [activeTab, visibilityFilter, ratingFilter, search, page, limit]);

    const { data, isLoading, isError, refetch } = useAdminReviews(serverFilters);
    const toggleVisibilityMutation = useToggleReviewVisibility();
    const deleteReviewMutation = useAdminDeleteReview();

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setFeedbackNotice({ text, type });
        setTimeout(() => {
            setFeedbackNotice((curr) => (curr?.text === text ? null : curr));
        }, 4000);
    };

    // Client-side filtering for complex tab conditions (e.g., 1-2 stars critical)
    const reviews = useMemo(() => {
        const rawReviews = data?.reviews ?? [];
        if (activeTab === "CRITICAL") {
            return rawReviews.filter((r) => r.rating <= 2);
        }
        return rawReviews;
    }, [data?.reviews, activeTab]);

    const stats = data?.stats;

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

    const handleTabClick = (tabId: ReviewTab) => {
        setActiveTab(tabId);
        setVisibilityFilter("ALL");
        setRatingFilter("ALL");
        setPage(1);
    };

    const handleClearAllFilters = () => {
        setActiveTab("ALL");
        setSearch("");
        setSearchInput("");
        setVisibilityFilter("ALL");
        setRatingFilter("ALL");
        setPage(1);
    };

    const isFiltered =
        activeTab !== "ALL" ||
        Boolean(search.trim()) ||
        visibilityFilter !== "ALL" ||
        ratingFilter !== "ALL";

    // Open Actions Dropdown
    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, review: AdminReview) => {
        e.stopPropagation();
        if (dropdownState?.reviewId === review.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 240;

        setDropdownState({
            reviewId: review.id,
            review,
            top: openUpwards ? rect.top - 6 : rect.bottom + 6,
            right: window.innerWidth - rect.right,
            openUpwards,
        });
    };

    // Toggle Review Visibility
    const handleToggleVisibility = (review: AdminReview) => {
        setDropdownState(null);
        const nextState = !review.isVisible;
        toggleVisibilityMutation.mutate(
            { id: review.id, isVisible: nextState },
            {
                onSuccess: () => {
                    showToast(
                        nextState
                            ? "Review published and visible on marketplace."
                            : "Review hidden from public listings.",
                        "success"
                    );
                    if (selectedReview?.id === review.id) {
                        setSelectedReview((prev) => prev ? { ...prev, isVisible: nextState } : null);
                    }
                },
                onError: (err: any) => {
                    showToast(err?.response?.data?.message || "Failed to update review visibility.", "error");
                },
            }
        );
    };

    // Permanently Delete Review
    const handleConfirmDelete = () => {
        if (!reviewToDelete) return;
        deleteReviewMutation.mutate(reviewToDelete.id, {
            onSuccess: () => {
                showToast("Review and merchant replies permanently deleted.", "success");
                setReviewToDelete(null);
                if (selectedReview?.id === reviewToDelete.id) {
                    setSelectedReview(null);
                }
            },
            onError: (err: any) => {
                showToast(err?.response?.data?.message || "Failed to delete review.", "error");
            },
        });
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        showToast(`${label} copied to clipboard`, "success");
        setTimeout(() => setCopiedId(null), 2000);
        setDropdownState(null);
    };

    // Export reviews to CSV
    const handleExportCSV = () => {
        const reviewsToExport = reviews;
        if (!reviewsToExport.length) {
            showToast("No review records available to export.", "error");
            return;
        }

        const headers = [
            "Review ID",
            "Product Name",
            "Product Slug",
            "Store Name",
            "Store Slug",
            "Customer Name",
            "Customer Email",
            "Rating",
            "Comment",
            "Merchant Reply",
            "Visibility",
            "Created Date",
        ];

        const rows = reviewsToExport.map((r) => [
            `"${r.id}"`,
            `"${(r.product?.name || "").replace(/"/g, '""')}"`,
            `"${r.product?.slug || ""}"`,
            `"${(r.shop?.profile?.name || r.shop?.slug || "").replace(/"/g, '""')}"`,
            `"${r.shop?.slug || ""}"`,
            `"${(r.user?.name || "").replace(/"/g, '""')}"`,
            `"${r.user?.email || ""}"`,
            `"${r.rating}"`,
            `"${(r.comment || "").replace(/"/g, '""')}"`,
            `"${(r.reply?.comment || "").replace(/"/g, '""')}"`,
            `"${r.isVisible ? "Visible" : "Hidden"}"`,
            `"${new Date(r.createdAt).toISOString().slice(0, 10)}"`,
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reviews-moderation-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Exported ${reviewsToExport.length} review records to CSV`, "success");
    };

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Review Moderation
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            Platform Compliance
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Customer feedback sentiment, merchant response moderation, rating distributions, and visibility governance.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Export filtered reviews to CSV"
                    >
                        <Download size={13} className="text-slate-500" />
                        <span>Export CSV</span>
                    </button>

                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh reviews list"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Total Reviews */}
                <button
                    onClick={() => handleTabClick("ALL")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "ALL" && !isFiltered
                            ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-medium mb-1">
                        <span>All Reviews</span>
                        <MessageSquare size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats?.totalPlatformReviews?.toLocaleString() ?? data?.total.toLocaleString() ?? "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Cross-store feedback</p>
                </button>

                {/* 2. Platform Rating */}
                <div className="text-left p-3.5 rounded-lg border bg-white border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-amber-800 font-medium mb-1">
                        <span>Platform Score</span>
                        <Star size={14} className="fill-amber-400 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                            {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : "0.0"}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Average sentiment score</p>
                </div>

                {/* 3. Visible Reviews (Good thing -> Green!) */}
                <button
                    onClick={() => handleTabClick("VISIBLE")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "VISIBLE"
                            ? "bg-emerald-50/40 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
                        <span>Visible</span>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats?.visibleCount?.toLocaleString() ?? "—"}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Live on product pages
                    </p>
                </button>

                {/* 4. Hidden / Moderated (Bad thing -> Red!) */}
                <button
                    onClick={() => handleTabClick("HIDDEN")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "HIDDEN"
                            ? "bg-rose-50/40 border-rose-500 ring-1 ring-rose-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
                        <span>Hidden / Moderated</span>
                        <EyeOff size={14} className="text-rose-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats?.hiddenCount?.toLocaleString() ?? "—"}
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-rose-500" />
                        Restricted / invisible
                    </p>
                </button>

                {/* 5. 5-Star Praise */}
                <button
                    onClick={() => handleTabClick("FIVE_STAR")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "FIVE_STAR"
                            ? "bg-blue-50/40 border-blue-500 ring-1 ring-blue-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-blue-800 font-medium mb-1">
                        <span>5-Star Praise</span>
                        <Star size={14} className="text-blue-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        Top Rated
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Maximum customer satisfaction</p>
                </button>
            </div>

            {/* Navigation Tabs Bar with High-Visibility Orange 600 Tracker */}
            <div className="flex items-center gap-1 border-b border-slate-200 mt-5 overflow-x-auto no-scrollbar">
                {REVIEW_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    let count: number | undefined = undefined;
                    if (tab.id === "ALL") count = stats?.totalPlatformReviews ?? data?.total;
                    else if (tab.id === "VISIBLE") count = stats?.visibleCount;
                    else if (tab.id === "HIDDEN") count = stats?.hiddenCount;

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

            {/* Main Content Box: Filters & Reviews Table */}
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
                            placeholder="Search by comment, product, customer name or email…"
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
                        {/* Rating Select */}
                        <select
                            value={ratingFilter}
                            onChange={(e) => {
                                setRatingFilter(e.target.value);
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value="ALL">All Star Ratings</option>
                            <option value="5">5 Stars Only</option>
                            <option value="4">4 Stars Only</option>
                            <option value="3">3 Stars Only</option>
                            <option value="2">2 Stars Only</option>
                            <option value="1">1 Star Only</option>
                        </select>

                        {/* Visibility Select */}
                        <select
                            value={visibilityFilter}
                            onChange={(e) => {
                                setVisibilityFilter(e.target.value);
                                setPage(1);
                            }}
                            className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                            <option value="ALL">All Visibility</option>
                            <option value="VISIBLE">Visible Only</option>
                            <option value="HIDDEN">Hidden Only</option>
                        </select>

                        {/* Page limit selector */}
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

                {/* Reviews Table */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                        <Loader2 className="animate-spin text-slate-500" size={24} />
                        <span className="text-xs font-medium">Loading review records…</span>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-xs text-rose-600">
                        <AlertCircle className="mx-auto size-7 mb-2 text-rose-400" />
                        Failed to load platform reviews. Please retry.
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <MessageSquare className="mx-auto size-9 text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-800">No reviews found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isFiltered
                                ? "No reviews match your active filter criteria."
                                : "No platform reviews have been submitted yet."}
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
                                    <th className="py-2.5 px-4 font-semibold">Product & Merchant</th>
                                    <th className="py-2.5 px-4 font-semibold">Customer Reviewer</th>
                                    <th className="py-2.5 px-4 font-semibold">Rating Score</th>
                                    <th className="py-2.5 px-4 font-semibold">Comment & Response</th>
                                    <th className="py-2.5 px-4 font-semibold">Visibility</th>
                                    <th className="py-2.5 px-4 font-semibold">Date</th>
                                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reviews.map((review) => {
                                    const productImage = review.product.images?.[0]?.url;

                                    return (
                                        <tr
                                            key={review.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                        >
                                            {/* Product & Store */}
                                            <td className="py-3 px-4 max-w-xs">
                                                <div className="flex items-center gap-2.5">
                                                    {productImage ? (
                                                        <img
                                                            src={productImage}
                                                            alt={review.product.name}
                                                            className="size-8 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-50"
                                                        />
                                                    ) : (
                                                        <div className="size-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                                            <Package size={14} />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-slate-900 text-xs block truncate max-w-[160px]">
                                                            {review.product.name}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
                                                            <Store size={10} className="shrink-0" />
                                                            <span className="truncate">
                                                                {review.shop?.profile?.name || review.shop?.slug || "Store"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Customer Reviewer */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                                                        {review.user?.name ? review.user.name.slice(0, 2).toUpperCase() : <User size={11} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-slate-900 block truncate text-xs">
                                                            {review.user?.name || "Customer"}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                                                            {review.user?.email || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rating Score */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center text-amber-400">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star
                                                                key={s}
                                                                size={11}
                                                                className={
                                                                    s <= review.rating
                                                                        ? "fill-amber-400 text-amber-400"
                                                                        : "text-slate-200"
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                    <span
                                                        className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md tabular-nums border ${
                                                            review.rating >= 4
                                                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                : review.rating === 3
                                                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                                                : "bg-rose-50 text-rose-800 border-rose-200"
                                                        }`}
                                                    >
                                                        {review.rating}.0
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Comment & Merchant Reply */}
                                            <td className="py-3 px-4 max-w-xs">
                                                <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                                                    {review.comment ? (
                                                        review.comment
                                                    ) : (
                                                        <span className="italic text-slate-400">No written feedback provided</span>
                                                    )}
                                                </p>
                                                {review.reply && (
                                                    <div className="mt-1 flex items-start gap-1 p-1.5 rounded-md bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                                                        <CornerDownRight size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                                        <div className="min-w-0 truncate">
                                                            <strong className="text-slate-800 font-semibold">Store: </strong>
                                                            <span>{review.reply.comment}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Visibility Status */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {review.isVisible ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-50 text-emerald-800 border-emerald-200">
                                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        <span>Visible</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-800 border-rose-200">
                                                        <span className="size-1.5 rounded-full bg-rose-500" />
                                                        <span>Hidden</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Actions Button - All in One Unified Dropdown */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => handleOpenDropdown(e, review)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border shadow-2xs ${
                                                        dropdownState?.reviewId === review.id
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

                {/* Pagination Footer */}
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
                            reviews
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
                            Moderation Actions
                        </div>

                        {/* Inspect Details */}
                        <button
                            onClick={() => {
                                setSelectedReview(dropdownState.review);
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            <Eye size={13} className="text-orange-500" />
                            <span>Inspect Review & Reply</span>
                        </button>

                        {/* Toggle Visibility */}
                        <button
                            onClick={() => handleToggleVisibility(dropdownState.review)}
                            disabled={toggleVisibilityMutation.isPending}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer disabled:opacity-50"
                        >
                            {dropdownState.review.isVisible ? (
                                <>
                                    <EyeOff size={13} className="text-rose-500" />
                                    <span>Hide from Marketplace</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>Make Visible</span>
                                </>
                            )}
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {/* Copy Review Text */}
                        {dropdownState.review.comment && (
                            <button
                                onClick={() => copyToClipboard(dropdownState.review.comment || "", "Review text")}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                            >
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy Review Text</span>
                            </button>
                        )}

                        {/* Copy Review ID */}
                        <button
                            onClick={() => copyToClipboard(dropdownState.review.id, "Review ID")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                            {copiedId === dropdownState.review.id ? (
                                <Check size={13} className="text-emerald-600" />
                            ) : (
                                <Copy size={13} className="text-slate-400" />
                            )}
                            <span>Copy Review ID</span>
                        </button>

                        {/* View Product Page */}
                        <a
                            href={`/product/${dropdownState.review.product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                        >
                            <ExternalLink size={13} className="text-slate-400" />
                            <span>View Product Page</span>
                        </a>

                        <div className="my-1 border-t border-slate-100" />

                        {/* Delete Review */}
                        <button
                            onClick={() => {
                                setReviewToDelete(dropdownState.review);
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                            <Trash2 size={13} className="text-rose-500" />
                            <span>Delete Review</span>
                        </button>
                    </div>
                </>
            )}

            {/* Inspect Review & Reply Modal */}
            {selectedReview && (
                <ReviewDetailModal
                    review={selectedReview}
                    onClose={() => setSelectedReview(null)}
                    onToggleVisibility={() => handleToggleVisibility(selectedReview)}
                    onDelete={() => {
                        setReviewToDelete(selectedReview);
                        setSelectedReview(null);
                    }}
                    isToggling={toggleVisibilityMutation.isPending}
                />
            )}

            {/* Delete Confirmation Modal */}
            {reviewToDelete && (
                <ModalPortal onClose={() => !deleteReviewMutation.isPending && setReviewToDelete(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !deleteReviewMutation.isPending) {
                                setReviewToDelete(null);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <Trash2 size={15} className="text-rose-600" />
                                    <span>Delete Review</span>
                                </h3>
                                <button
                                    onClick={() => setReviewToDelete(null)}
                                    disabled={deleteReviewMutation.isPending}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="p-4 space-y-3 text-xs text-slate-600">
                                <p>
                                    Are you sure you want to permanently delete this customer review for{" "}
                                    <strong className="text-slate-900 font-semibold">
                                        "{reviewToDelete.product?.name}"
                                    </strong>
                                    ?
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    This action cannot be undone. Associated merchant replies and sentiment scores will be permanently purged.
                                </p>
                            </div>

                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setReviewToDelete(null)}
                                    disabled={deleteReviewMutation.isPending}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={deleteReviewMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-2xs cursor-pointer font-semibold disabled:opacity-50"
                                >
                                    {deleteReviewMutation.isPending ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={13} />
                                    )}
                                    <span>{deleteReviewMutation.isPending ? "Deleting…" : "Confirm Delete"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

// -----------------------------------------------------------------------------------------
// Review Detail Modal Component
// -----------------------------------------------------------------------------------------
interface ReviewDetailModalProps {
    review: AdminReview;
    onClose: () => void;
    onToggleVisibility: () => void;
    onDelete: () => void;
    isToggling: boolean;
}

function ReviewDetailModal({
    review,
    onClose,
    onToggleVisibility,
    onDelete,
    isToggling,
}: ReviewDetailModalProps) {
    const productImage = review.product.images?.[0]?.url;

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
                                <MessageSquare size={14} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900 text-sm">
                                    Review & Response Audit
                                </h2>
                                <p className="text-[11px] text-slate-500">
                                    Customer sentiment inspection, ratings validation, and merchant reply governance.
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
                        {/* Status Strip */}
                        <div
                            className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                                review.isVisible
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                    : "bg-rose-50 border-rose-200 text-rose-900"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {review.isVisible ? (
                                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <EyeOff size={15} className="text-rose-600 shrink-0" />
                                )}
                                <span className="font-medium text-xs">
                                    {review.isVisible
                                        ? "This review is currently visible on the product storefront."
                                        : "This review is hidden from public view."}
                                </span>
                            </div>

                            <button
                                onClick={onToggleVisibility}
                                disabled={isToggling}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
                                    review.isVisible
                                        ? "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                                        : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                }`}
                            >
                                {isToggling ? "Updating…" : review.isVisible ? "Hide from Store" : "Make Visible"}
                            </button>
                        </div>

                        {/* Product & Store Summary */}
                        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {productImage ? (
                                    <img
                                        src={productImage}
                                        alt={review.product.name}
                                        className="size-10 rounded-md object-cover border border-slate-200 shrink-0 bg-white"
                                    />
                                ) : (
                                    <div className="size-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                        <Package size={16} />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <span className="font-semibold text-slate-900 text-xs block truncate">
                                        {review.product.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                        <Store size={11} className="text-slate-400" />
                                        <span className="truncate">
                                            {review.shop?.profile?.name || review.shop?.slug}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <a
                                href={`/product/${review.product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 shadow-2xs shrink-0"
                            >
                                <span>Storefront</span>
                                <ExternalLink size={11} />
                            </a>
                        </div>

                        {/* Reviewer & Star Score */}
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                                    {review.user?.name ? review.user.name.slice(0, 2).toUpperCase() : <User size={13} />}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-900 block text-xs">
                                        {review.user?.name || "Customer"}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 block">
                                        {review.user?.email || "—"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center text-amber-400">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={14}
                                            className={
                                                s <= review.rating
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-slate-200"
                                            }
                                        />
                                    ))}
                                </div>
                                <span className="font-bold text-sm text-slate-900 tabular-nums">
                                    {review.rating}.0
                                </span>
                            </div>
                        </div>

                        {/* Customer Comment */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Customer Feedback
                            </label>
                            <div className="p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed italic">
                                "{review.comment || "No written review comment provided."}"
                            </div>
                        </div>

                        {/* Merchant Reply */}
                        {review.reply && (
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <CornerDownRight size={12} className="text-orange-500" />
                                    <span>Merchant Response</span>
                                </label>
                                <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/30 text-xs text-slate-800 leading-relaxed">
                                    {review.reply.comment}
                                    <span className="block text-[10px] text-slate-400 mt-2 font-mono">
                                        Replied on {new Date(review.reply.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Metadata Rows */}
                        <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                            <div className="flex justify-between py-0.5">
                                <span>Review ID</span>
                                <span className="font-mono text-slate-600">{review.id}</span>
                            </div>
                            <div className="flex justify-between py-0.5">
                                <span>Submission Date</span>
                                <span className="text-slate-600">
                                    {new Date(review.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={onDelete}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                            <Trash2 size={13} />
                            <span>Delete Review</span>
                        </button>

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
