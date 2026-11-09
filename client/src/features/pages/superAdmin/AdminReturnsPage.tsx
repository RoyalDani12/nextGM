import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Download,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock3,
    PackageCheck,
    DollarSign,
    Copy,
    Check,
    Eye,
    Loader2,
    Building2,
    User,
    ArrowLeftRight,
    Package,
    FileText,
    Image as ImageIcon,
} from "lucide-react";
import {
    useAdminReturns,
    useUpdateReturnStatus,
    useRefundReturn,
} from "@/features/admin/admin.hooks";
import type { AdminReturn } from "@/features/admin/admin.api";
import { ModalPortal } from "@/components/ui/ds-components";

// Status configuration definitions
const RETURN_TABS = [
    { id: "ALL", label: "All Claims" },
    { id: "NEEDS_REVIEW", label: "Needs Review" },
    { id: "APPROVED", label: "Approved" },
    { id: "ITEM_RECEIVED", label: "Item Received" },
    { id: "REFUNDED", label: "Refund Settled" },
    { id: "REJECTED", label: "Rejected" },
] as const;

type ReturnTab = (typeof RETURN_TABS)[number]["id"];

const statusBadgeConfig = (status: string) => {
    switch (status) {
        case "REFUNDED":
            return {
                label: "Refund Settled",
                badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
                dotClass: "bg-emerald-500",
            };
        case "APPROVED":
            return {
                label: "Approved",
                badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
                dotClass: "bg-blue-500",
            };
        case "ITEM_RECEIVED":
            return {
                label: "Item Received",
                badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
                dotClass: "bg-amber-500",
            };
        case "ITEM_SHIPPED":
            return {
                label: "Item Shipped",
                badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
                dotClass: "bg-sky-500",
            };
        case "REQUESTED":
            return {
                label: "Requested",
                badgeClass: "bg-amber-50/80 text-amber-900 border-amber-300",
                dotClass: "bg-amber-500",
            };
        case "UNDER_REVIEW":
            return {
                label: "Under Review",
                badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
                dotClass: "bg-indigo-500",
            };
        case "REFUND_PENDING":
            return {
                label: "Refund Pending",
                badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
                dotClass: "bg-purple-500",
            };
        case "REJECTED":
            return {
                label: "Rejected",
                badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
                dotClass: "bg-rose-500",
            };
        case "REPLACEMENT_SENT":
            return {
                label: "Replacement Sent",
                badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
                dotClass: "bg-teal-500",
            };
        case "CLOSED":
            return {
                label: "Closed",
                badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                dotClass: "bg-slate-400",
            };
        default:
            return {
                label: status.replace(/_/g, " "),
                badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                dotClass: "bg-slate-400",
            };
    }
};

export const AdminReturnsPage = () => {
    // Filter and search state
    const [activeTab, setActiveTab] = useState<ReturnTab>("ALL");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [resolutionFilter, setResolutionFilter] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Toast feedback notice
    const [feedbackNotice, setFeedbackNotice] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    // Modal states
    const [selectedReturnForInspect, setSelectedReturnForInspect] = useState<AdminReturn | null>(null);
    const [selectedReturnForRefund, setSelectedReturnForRefund] = useState<AdminReturn | null>(null);
    const [selectedReturnForReject, setSelectedReturnForReject] = useState<AdminReturn | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Copied indicator
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Actions dropdown menu positioned in fixed viewport coordinates
    const [dropdownState, setDropdownState] = useState<{
        returnId: string;
        claim: AdminReturn;
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

    // Derive server filters
    const serverFilters = useMemo(() => {
        let status: string | undefined = undefined;

        if (activeTab === "NEEDS_REVIEW") {
            status = "REQUESTED,UNDER_REVIEW";
        } else if (activeTab === "APPROVED") {
            status = "APPROVED";
        } else if (activeTab === "ITEM_RECEIVED") {
            status = "ITEM_RECEIVED";
        } else if (activeTab === "REFUNDED") {
            status = "REFUNDED,REFUND_PENDING";
        } else if (activeTab === "REJECTED") {
            status = "REJECTED,CLOSED";
        }

        // Dropdown status override
        if (statusFilter !== "ALL") {
            status = statusFilter;
        }

        return {
            status: status && status !== "ALL" ? status : undefined,
            search: search.trim() || undefined,
            resolution: resolutionFilter !== "ALL" ? resolutionFilter : undefined,
            page,
            limit,
        };
    }, [activeTab, statusFilter, resolutionFilter, search, page, limit]);

    const { data, isLoading, isError, refetch } = useAdminReturns(serverFilters);
    const updateStatusMutation = useUpdateReturnStatus();
    const refundMutation = useRefundReturn();

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setFeedbackNotice({ text, type });
        setTimeout(() => {
            setFeedbackNotice((curr) => (curr?.text === text ? null : curr));
        }, 4000);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
    };

    const handleTabClick = (tabId: ReturnTab) => {
        setActiveTab(tabId);
        setStatusFilter("ALL");
        setPage(1);
    };

    const handleResetAllFilters = () => {
        setActiveTab("ALL");
        setSearchInput("");
        setSearch("");
        setStatusFilter("ALL");
        setResolutionFilter("ALL");
        setPage(1);
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        showToast(`${label} copied to clipboard!`, "success");
        setTimeout(() => setCopiedId(null), 2500);
    };

    // Fast status updates
    const handleQuickStatusUpdate = async (claimId: string, nextStatus: string, note?: string) => {
        try {
            await updateStatusMutation.mutateAsync({ id: claimId, status: nextStatus, note });
            showToast(`Claim status updated to ${nextStatus.replace(/_/g, " ")}`, "success");
            setDropdownState(null);
            if (selectedReturnForInspect?.id === claimId) {
                setSelectedReturnForInspect((prev) => (prev ? { ...prev, status: nextStatus } : null));
            }
        } catch {
            // Handled in mutation error toast
        }
    };

    // Confirm Refund Execution
    const handleConfirmRefund = async () => {
        if (!selectedReturnForRefund) return;
        try {
            await refundMutation.mutateAsync(selectedReturnForRefund.id);
            setSelectedReturnForRefund(null);
            showToast("Customer refund settled and wallet ledger balanced successfully!", "success");
            if (selectedReturnForInspect?.id === selectedReturnForRefund.id) {
                setSelectedReturnForInspect((prev) => (prev ? { ...prev, status: "REFUNDED" } : null));
            }
        } catch {
            // Handled in mutation error toast
        }
    };

    // Confirm Rejection Execution
    const handleConfirmReject = async () => {
        if (!selectedReturnForReject) return;
        try {
            await updateStatusMutation.mutateAsync({
                id: selectedReturnForReject.id,
                status: "REJECTED",
                note: rejectionReason.trim() || "Return claim rejected by administrator.",
            });
            showToast("Return claim rejected.", "success");
            setSelectedReturnForReject(null);
            setRejectionReason("");
            if (selectedReturnForInspect?.id === selectedReturnForReject.id) {
                setSelectedReturnForInspect((prev) => (prev ? { ...prev, status: "REJECTED" } : null));
            }
        } catch {
            // Handled in mutation error toast
        }
    };

    // CSV export
    const handleExportCSV = () => {
        const claimsToExport = data?.returns ?? [];
        if (!claimsToExport.length) {
            showToast("No claims available to export.", "error");
            return;
        }

        const headers = [
            "Claim ID",
            "Order ID",
            "Customer Name",
            "Customer Email",
            "Store Name",
            "Order Amount (USD)",
            "Resolution",
            "Reason",
            "Status",
            "Customer Note",
            "Admin Note",
            "Requested At",
        ];

        const rows = claimsToExport.map((c) => [
            `"${c.id}"`,
            `"${c.orderId}"`,
            `"${(c.order?.customer?.name || "").replace(/"/g, '""')}"`,
            `"${c.order?.customer?.email || ""}"`,
            `"${(c.order?.shop?.profile?.name || c.order?.shop?.slug || "").replace(/"/g, '""')}"`,
            `"${Number(c.order?.totalAmount || 0).toFixed(2)}"`,
            `"${c.resolution}"`,
            `"${c.reason}"`,
            `"${c.status}"`,
            `"${(c.customerNote || "").replace(/"/g, '""')}"`,
            `"${(c.adminNote || "").replace(/"/g, '""')}"`,
            `"${new Date(c.createdAt).toISOString()}"`,
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `returns-refunds-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Exported ${claimsToExport.length} claim records to CSV`, "success");
    };

    const counts = data?.statusCounts ?? {};
    const totalClaims = data?.pagination?.total ?? 0;
    const needsReviewCount = (counts.REQUESTED ?? 0) + (counts.UNDER_REVIEW ?? 0);
    const approvedCount = counts.APPROVED ?? 0;
    const itemReceivedCount = counts.ITEM_RECEIVED ?? 0;
    const refundedCount = (counts.REFUNDED ?? 0) + (counts.REFUND_PENDING ?? 0);
    const rejectedCount = (counts.REJECTED ?? 0) + (counts.CLOSED ?? 0);

    const isFiltered = search !== "" || statusFilter !== "ALL" || resolutionFilter !== "ALL" || activeTab !== "ALL";

    return (
        <div className="w-full space-y-5">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Returns & Customer Refunds
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            Financial Settlement
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Arbitrate customer claims, inspect photographic evidence, verify warehouse receipt, and execute ledger-balanced refunds.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Export filtered return claims to CSV"
                    >
                        <Download size={13} className="text-slate-500" />
                        <span>Export CSV</span>
                    </button>

                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh return requests queue"
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
                {/* 1. All Claims */}
                <button
                    onClick={() => handleTabClick("ALL")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "ALL" && !isFiltered
                            ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-medium mb-1">
                        <span>All Claims</span>
                        <ArrowLeftRight size={14} className="text-orange-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {totalClaims.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Total filed returns</p>
                </button>

                {/* 2. Needs Review */}
                <button
                    onClick={() => handleTabClick("NEEDS_REVIEW")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "NEEDS_REVIEW"
                            ? "bg-amber-50/40 border-amber-500 ring-1 ring-amber-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-amber-800 font-medium mb-1">
                        <span>Needs Review</span>
                        <Clock3 size={14} className="text-amber-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {needsReviewCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending triage
                    </p>
                </button>

                {/* 3. Approved */}
                <button
                    onClick={() => handleTabClick("APPROVED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "APPROVED"
                            ? "bg-blue-50/40 border-blue-500 ring-1 ring-blue-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-blue-800 font-medium mb-1">
                        <span>Approved</span>
                        <CheckCircle2 size={14} className="text-blue-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {approvedCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-blue-700 mt-1 font-medium">
                        Awaiting return/refund
                    </p>
                </button>

                {/* 4. Item Received */}
                <button
                    onClick={() => handleTabClick("ITEM_RECEIVED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "ITEM_RECEIVED"
                            ? "bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-indigo-800 font-medium mb-1">
                        <span>Item Received</span>
                        <PackageCheck size={14} className="text-indigo-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {itemReceivedCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-indigo-700 mt-1 font-medium">
                        Verified at store/hub
                    </p>
                </button>

                {/* 5. Refund Settled */}
                <button
                    onClick={() => handleTabClick("REFUNDED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "REFUNDED"
                            ? "bg-emerald-50/40 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
                        <span>Refund Settled</span>
                        <DollarSign size={14} className="text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {refundedCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Payout finalized
                    </p>
                </button>

                {/* 6. Rejected / Closed */}
                <button
                    onClick={() => handleTabClick("REJECTED")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        activeTab === "REJECTED"
                            ? "bg-rose-50/40 border-rose-500 ring-1 ring-rose-500 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
                        <span>Rejected / Closed</span>
                        <XCircle size={14} className="text-rose-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {rejectedCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1 font-medium">
                        Disallowed claims
                    </p>
                </button>
            </div>

            {/* High-Contrast Underline Filter Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-2 overflow-x-auto ds-scroll" aria-label="Return status tabs">
                    {RETURN_TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        let count = totalClaims;
                        if (tab.id === "NEEDS_REVIEW") count = needsReviewCount;
                        if (tab.id === "APPROVED") count = approvedCount;
                        if (tab.id === "ITEM_RECEIVED") count = itemReceivedCount;
                        if (tab.id === "REFUNDED") count = refundedCount;
                        if (tab.id === "REJECTED") count = rejectedCount;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                                    isActive
                                        ? "border-orange-600 bg-orange-50/80 font-bold text-orange-950 shadow-2xs rounded-t-md -mb-px"
                                        : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 font-medium"
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                                        isActive
                                            ? "bg-orange-600 text-white"
                                            : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Unified Table Container */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                {/* Filter and Search Bar Inside Container */}
                <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by claim ID, order ID, customer name, email, or store..."
                            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Clear search"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Resolution Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Resolution:</span>
                            <select
                                value={resolutionFilter}
                                onChange={(e) => {
                                    setResolutionFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                                <option value="ALL">All Resolutions</option>
                                <option value="REFUND">Refund Only</option>
                                <option value="REPLACEMENT">Replacement Only</option>
                            </select>
                        </div>

                        {/* Granular Status Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="REQUESTED">Requested</option>
                                <option value="UNDER_REVIEW">Under Review</option>
                                <option value="APPROVED">Approved</option>
                                <option value="ITEM_SHIPPED">Item Shipped</option>
                                <option value="ITEM_RECEIVED">Item Received</option>
                                <option value="REFUND_PENDING">Refund Pending</option>
                                <option value="REFUNDED">Refunded</option>
                                <option value="REPLACEMENT_SENT">Replacement Sent</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>

                        {/* Page Limit */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Rows:</span>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>

                        {isFiltered && (
                            <button
                                onClick={handleResetAllFilters}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                                title="Reset all applied filters"
                            >
                                <X size={12} />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table View */}
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">
                        <Loader2 className="mx-auto size-6 animate-spin text-orange-500 mb-2" />
                        <p className="text-xs font-medium text-slate-600">Loading return claims queue...</p>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-500 text-sm">
                        <AlertCircle className="mx-auto size-6 text-rose-500 mb-2" />
                        <p className="text-xs font-semibold text-rose-700">Unable to load returns queue.</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-2 text-xs text-orange-600 hover:underline font-medium cursor-pointer"
                        >
                            Retry loading
                        </button>
                    </div>
                ) : !data?.returns?.length ? (
                    <div className="p-12 text-center text-slate-400">
                        <ShieldCheck className="mx-auto size-8 opacity-40 mb-2 text-slate-400" />
                        <p className="font-semibold text-xs text-slate-700">No return requests found</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {isFiltered
                                ? "No returns match your filter criteria. Try resetting filters."
                                : "No return claims have been filed on the platform yet."}
                        </p>
                        {isFiltered && (
                            <button
                                onClick={handleResetAllFilters}
                                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto ds-scroll">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 font-semibold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Claim & Order</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Store</th>
                                    <th className="px-4 py-3">Returned Item</th>
                                    <th className="px-4 py-3">Resolution & Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Filed Date</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.returns.map((claim) => {
                                    const cfg = statusBadgeConfig(claim.status);
                                    const isRefund = claim.resolution === "REFUND";
                                    const primaryItem = claim.items?.[0];
                                    const itemImage = primaryItem?.orderItem?.product?.images?.[0]?.url;
                                    const productName = primaryItem?.orderItem?.product?.name || "Product Item";
                                    const totalItemQty = claim.items?.reduce((acc, curr) => acc + curr.quantity, 0) || 1;

                                    return (
                                        <tr key={claim.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-b-0 transition-colors">
                                            {/* Claim & Order */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => setSelectedReturnForInspect(claim)}
                                                                className="font-mono font-bold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer text-xs"
                                                                title="Inspect return details"
                                                            >
                                                                #{claim.id.slice(-8).toUpperCase()}
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopy(claim.id, "Claim ID")}
                                                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                                                title="Copy Claim ID"
                                                            >
                                                                {copiedId === claim.id ? (
                                                                    <Check size={11} className="text-emerald-600" />
                                                                ) : (
                                                                    <Copy size={11} />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                                                            <span>Ord: #{claim.orderId.slice(-8).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold shrink-0">
                                                        {(claim.order?.customer?.name || "C")[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 truncate max-w-[130px]">
                                                            {claim.order?.customer?.name || "Customer"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                                            {claim.order?.customer?.email || "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Store */}
                                            <td className="px-4 py-3 text-slate-700">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Building2 size={13} className="text-slate-400 shrink-0" />
                                                    <span className="font-medium truncate max-w-[120px]">
                                                        {claim.order?.shop?.profile?.name || claim.order?.shop?.slug || "Platform Store"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Returned Item */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {itemImage ? (
                                                        <img
                                                            src={itemImage}
                                                            alt={productName}
                                                            className="size-7 rounded object-cover border border-slate-200 shrink-0 bg-slate-50"
                                                        />
                                                    ) : (
                                                        <div className="size-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                            <Package size={13} />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 max-w-[150px]">
                                                        <p className="font-medium text-slate-800 truncate text-[11px]" title={productName}>
                                                            {productName}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            Qty: {totalItemQty} {claim.items && claim.items.length > 1 ? `(+${claim.items.length - 1} more)` : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Resolution & Amount */}
                                            <td className="px-4 py-3">
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-slate-900 tabular-nums">
                                                        ${Number(claim.order?.totalAmount || 0).toFixed(2)} USD
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                                            isRefund
                                                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                                : "bg-sky-50 text-sky-800 border border-sky-200"
                                                        }`}
                                                    >
                                                        {claim.resolution}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.badgeClass}`}
                                                >
                                                    <span className={`size-1.5 rounded-full ${cfg.dotClass}`} />
                                                    {cfg.label}
                                                </span>
                                            </td>

                                            {/* Filed Date */}
                                            <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                                                {new Date(claim.createdAt).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Direct Quick Action & Dropdown */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                    {/* Quick Inspect */}
                                                    <button
                                                        onClick={() => setSelectedReturnForInspect(claim)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                                                        title="Inspect full return claim and evidence"
                                                    >
                                                        <Eye size={12} className="text-slate-500" />
                                                        <span className="hidden sm:inline">View</span>
                                                    </button>

                                                    {/* Direct Complete Refund Button */}
                                                    {isRefund &&
                                                        ["APPROVED", "ITEM_RECEIVED", "REQUESTED", "UNDER_REVIEW", "REFUND_PENDING"].includes(claim.status) && (
                                                            <button
                                                                onClick={() => setSelectedReturnForRefund(claim)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors cursor-pointer"
                                                                title="Approve and execute financial refund settlement"
                                                            >
                                                                <DollarSign size={12} />
                                                                <span>Refund</span>
                                                            </button>
                                                        )}

                                                    {/* Direct Quick Approve for Claims needing review */}
                                                    {["REQUESTED", "UNDER_REVIEW"].includes(claim.status) && (
                                                        <button
                                                            onClick={() => handleQuickStatusUpdate(claim.id, "APPROVED")}
                                                            disabled={updateStatusMutation.isPending}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md shadow-2xs transition-colors cursor-pointer"
                                                            title="Approve return claim"
                                                        >
                                                            <CheckCircle2 size={12} className="text-blue-600" />
                                                            <span>Approve</span>
                                                        </button>
                                                    )}

                                                    {/* More actions dropdown */}
                                                    <button
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const openUpwards = window.innerHeight - rect.bottom < 240;
                                                            setDropdownState({
                                                                returnId: claim.id,
                                                                claim,
                                                                top: openUpwards ? rect.top - 8 : rect.bottom + 4,
                                                                right: window.innerWidth - rect.right,
                                                                openUpwards,
                                                            });
                                                        }}
                                                        className="inline-flex items-center justify-center size-7 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                                                        title="More options"
                                                    >
                                                        <ChevronDown size={13} className="text-slate-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Toolbar */}
                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                        <div>
                            Showing{" "}
                            <span className="font-semibold text-slate-900">
                                {Math.min((page - 1) * limit + 1, data.pagination.total)}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-slate-900">
                                {Math.min(page * limit, data.pagination.total)}
                            </span>{" "}
                            of <span className="font-semibold text-slate-900">{data.pagination.total}</span> claims
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={13} />
                                <span>Previous</span>
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, data.pagination.totalPages) }).map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`size-7 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                                page === pageNum
                                                    ? "bg-orange-600 text-white shadow-2xs"
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {data.pagination.totalPages > 5 && (
                                    <span className="text-slate-400 px-1 text-xs">...</span>
                                )}
                            </div>

                            <button
                                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                                disabled={page >= data.pagination.totalPages}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Viewport-fixed Actions Dropdown Menu */}
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
                        className="z-50 w-56 rounded-md bg-white border border-slate-200 shadow-lg py-1 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
                    >
                        {/* 1. Inspect Claim & Evidence */}
                        <button
                            onClick={() => {
                                setSelectedReturnForInspect(dropdownState.claim);
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 transition-colors cursor-pointer text-slate-800 font-medium"
                        >
                            <Eye size={13} className="text-slate-500" />
                            <span>Inspect Claim & Evidence</span>
                        </button>

                        {/* 2. Approve Return Claim */}
                        {["REQUESTED", "UNDER_REVIEW"].includes(dropdownState.claim.status) && (
                            <button
                                onClick={() => handleQuickStatusUpdate(dropdownState.claim.id, "APPROVED")}
                                disabled={updateStatusMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50 transition-colors cursor-pointer text-blue-700 font-semibold"
                            >
                                <CheckCircle2 size={13} className="text-blue-600" />
                                <span>Approve Return Claim</span>
                            </button>
                        )}

                        {/* 3. Mark Item Received */}
                        {["APPROVED", "ITEM_SHIPPED", "REQUESTED", "UNDER_REVIEW"].includes(dropdownState.claim.status) && (
                            <button
                                onClick={() => handleQuickStatusUpdate(dropdownState.claim.id, "ITEM_RECEIVED")}
                                disabled={updateStatusMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-amber-50 transition-colors cursor-pointer text-amber-700 font-semibold"
                            >
                                <PackageCheck size={13} className="text-amber-600" />
                                <span>Mark Item Received</span>
                            </button>
                        )}

                        {/* 4. Complete / Release Refund */}
                        {dropdownState.claim.resolution === "REFUND" &&
                            ["APPROVED", "ITEM_RECEIVED", "REQUESTED", "UNDER_REVIEW", "REFUND_PENDING"].includes(
                                dropdownState.claim.status
                            ) && (
                                <button
                                    onClick={() => {
                                        setSelectedReturnForRefund(dropdownState.claim);
                                        setDropdownState(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-emerald-50 transition-colors cursor-pointer text-emerald-700 font-bold"
                                >
                                    <DollarSign size={13} className="text-emerald-600" />
                                    <span>Complete & Release Refund</span>
                                </button>
                            )}

                        {/* 5. Reject Claim */}
                        {!["REFUNDED", "REJECTED", "CLOSED"].includes(dropdownState.claim.status) && (
                            <button
                                onClick={() => {
                                    setSelectedReturnForReject(dropdownState.claim);
                                    setDropdownState(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-rose-50 transition-colors cursor-pointer text-rose-700 font-semibold"
                            >
                                <XCircle size={13} className="text-rose-600" />
                                <span>Reject Return Claim</span>
                            </button>
                        )}

                        <div className="my-1 border-t border-slate-100" />

                        {/* 6. Copy IDs */}
                        <button
                            onClick={() => {
                                handleCopy(dropdownState.claim.id, "Claim ID");
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 transition-colors cursor-pointer text-slate-600"
                        >
                            <Copy size={13} className="text-slate-400" />
                            <span>Copy Claim ID</span>
                        </button>

                        <button
                            onClick={() => {
                                handleCopy(dropdownState.claim.orderId, "Order ID");
                                setDropdownState(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 transition-colors cursor-pointer text-slate-600"
                        >
                            <Copy size={13} className="text-slate-400" />
                            <span>Copy Order ID</span>
                        </button>
                    </div>
                </>
            )}

            {/* CONFIRM REFUND FINANCIAL AUTHORIZATION MODAL */}
            {selectedReturnForRefund && (
                <ModalPortal onClose={() => setSelectedReturnForRefund(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedReturnForRefund(null);
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                                    <DollarSign className="size-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Authorize Customer Refund
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Super Admin Ledger & Platform Settlement
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedReturnForRefund(null)}
                                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="rounded-md bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Return Claim:</span>
                                    <strong className="font-mono text-slate-800">
                                        #{selectedReturnForRefund.id.slice(-8).toUpperCase()}
                                    </strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Order ID:</span>
                                    <strong className="font-mono text-slate-800">
                                        #{selectedReturnForRefund.orderId.slice(-8).toUpperCase()}
                                    </strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Customer:</span>
                                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                                        <User size={12} className="text-slate-400" />
                                        {selectedReturnForRefund.order?.customer?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Store:</span>
                                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                                        <Building2 size={12} className="text-slate-400" />
                                        {selectedReturnForRefund.order?.shop?.profile?.name || selectedReturnForRefund.order?.shop?.slug}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                    <span className="font-bold text-slate-700">Settlement Amount:</span>
                                    <span className="text-sm font-black text-emerald-600">
                                        ${Number(selectedReturnForRefund.order?.totalAmount || 0).toFixed(2)} USD
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-md bg-amber-50/70 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-relaxed">
                                Authorizing this refund initiates payment back to customer, reverses the merchant wallet ledger credit, updates claim & order status to <strong>REFUNDED</strong>, and records an unalterable security audit entry.
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={refundMutation.isPending}
                                    onClick={() => setSelectedReturnForRefund(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={refundMutation.isPending}
                                    onClick={handleConfirmRefund}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {refundMutation.isPending ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            <span>Processing Refund...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Confirm & Release Refund</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* REJECT CLAIM MODAL */}
            {selectedReturnForReject && (
                <ModalPortal onClose={() => setSelectedReturnForReject(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedReturnForReject(null);
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                                    <XCircle className="size-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Reject Return Claim
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Claim #{selectedReturnForReject.id.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedReturnForReject(null)}
                                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <label className="font-semibold text-slate-700">
                                    Rejection Reason / Explanation Note:
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    placeholder="Explain why this return claim cannot be accepted (e.g., policy window expired, item damaged by customer, evidence inconclusive)..."
                                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={updateStatusMutation.isPending}
                                    onClick={() => setSelectedReturnForReject(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={updateStatusMutation.isPending}
                                    onClick={handleConfirmReject}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {updateStatusMutation.isPending ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            <span>Rejecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="size-3.5" />
                                            <span>Confirm Rejection</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* INSPECT CLAIM & EVIDENCE MODAL */}
            {selectedReturnForInspect && (
                <ModalPortal onClose={() => setSelectedReturnForInspect(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedReturnForInspect(null);
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Return Claim #{selectedReturnForInspect.id.slice(-8).toUpperCase()}
                                        </h3>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                statusBadgeConfig(selectedReturnForInspect.status).badgeClass
                                            }`}
                                        >
                                            <span
                                                className={`size-1.5 rounded-full ${
                                                    statusBadgeConfig(selectedReturnForInspect.status).dotClass
                                                }`}
                                            />
                                            {statusBadgeConfig(selectedReturnForInspect.status).label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Order #{selectedReturnForInspect.orderId.slice(-8).toUpperCase()} • Filed on{" "}
                                        {new Date(selectedReturnForInspect.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedReturnForInspect(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 overflow-y-auto ds-scroll space-y-4 text-xs">
                                {/* Order & Tenant Info */}
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Customer:</span>
                                        <p className="font-semibold text-slate-900 mt-0.5">
                                            {selectedReturnForInspect.order?.customer?.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-mono">
                                            {selectedReturnForInspect.order?.customer?.email}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block font-medium">Merchant Store:</span>
                                        <p className="font-semibold text-slate-900 mt-0.5">
                                            {selectedReturnForInspect.order?.shop?.profile?.name || selectedReturnForInspect.order?.shop?.slug}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-mono">
                                            Total: ${Number(selectedReturnForInspect.order?.totalAmount || 0).toFixed(2)} USD
                                        </p>
                                    </div>
                                </div>

                                {/* Reason & Notes */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                        <span className="font-bold text-slate-800">Return Reason:</span>
                                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                            {selectedReturnForInspect.reason.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    {selectedReturnForInspect.customerNote && (
                                        <div className="p-3 bg-amber-50/50 rounded-md border border-amber-200/60">
                                            <span className="text-[11px] font-bold text-amber-900 block mb-1">
                                                Customer Explanation:
                                            </span>
                                            <p className="text-slate-700 leading-relaxed">
                                                {selectedReturnForInspect.customerNote}
                                            </p>
                                        </div>
                                    )}

                                    {selectedReturnForInspect.adminNote && (
                                        <div className="p-3 bg-blue-50/50 rounded-md border border-blue-200/60">
                                            <span className="text-[11px] font-bold text-blue-900 block mb-1">
                                                Administrator Audit Note:
                                            </span>
                                            <p className="text-slate-700 leading-relaxed">
                                                {selectedReturnForInspect.adminNote}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Returned Items */}
                                <div className="space-y-1.5">
                                    <span className="font-bold text-slate-800 block">Items in Claim:</span>
                                    <div className="border border-slate-200 rounded-md divide-y divide-slate-100 overflow-hidden">
                                        {selectedReturnForInspect.items?.map((item, idx) => {
                                            const img = item.orderItem?.product?.images?.[0]?.url;
                                            return (
                                                <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        {img ? (
                                                            <img
                                                                src={img}
                                                                alt={item.orderItem?.product?.name}
                                                                className="size-9 rounded object-cover border border-slate-200 bg-slate-50"
                                                            />
                                                        ) : (
                                                            <div className="size-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                                <Package size={16} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-slate-800">
                                                                {item.orderItem?.product?.name || "Order Item"}
                                                            </p>
                                                            {item.orderItem?.variant && (
                                                                <p className="text-[10px] text-slate-400">
                                                                    Variant: {item.orderItem.variant.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-slate-900 text-xs">
                                                            Qty: {item.quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Evidence Photos Gallery */}
                                <div className="space-y-1.5">
                                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-slate-500" />
                                        Photographic Evidence ({selectedReturnForInspect.evidenceUrls?.length || 0})
                                    </span>
                                    {selectedReturnForInspect.evidenceUrls?.length ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                                            {selectedReturnForInspect.evidenceUrls.map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setExpandedImage(url)}
                                                    className="group relative aspect-square rounded-md overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Evidence ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                        <Eye size={16} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-center text-slate-400 text-[11px]">
                                            No photographic evidence attached to this claim.
                                        </div>
                                    )}
                                </div>

                                {/* Status History Timeline */}
                                {selectedReturnForInspect.statusHistory && selectedReturnForInspect.statusHistory.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <FileText size={14} className="text-slate-500" />
                                            Audit History Timeline
                                        </span>
                                        <div className="space-y-2 pt-1">
                                            {selectedReturnForInspect.statusHistory.map((hist, i) => (
                                                <div key={hist.id || i} className="flex items-start gap-2 text-[11px]">
                                                    <div className="size-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">
                                                                {hist.status.replace(/_/g, " ")}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(hist.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        {hist.note && (
                                                            <p className="text-slate-500 mt-0.5">{hist.note}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer Direct Actions */}
                            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(selectedReturnForInspect.id, "Claim ID")}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors cursor-pointer"
                                    >
                                        <Copy size={12} />
                                        <span>Copy Claim ID</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {["REQUESTED", "UNDER_REVIEW"].includes(selectedReturnForInspect.status) && (
                                        <button
                                            onClick={() => handleQuickStatusUpdate(selectedReturnForInspect.id, "APPROVED")}
                                            disabled={updateStatusMutation.isPending}
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                                        >
                                            Approve Claim
                                        </button>
                                    )}

                                    {["APPROVED", "ITEM_SHIPPED", "REQUESTED", "UNDER_REVIEW"].includes(selectedReturnForInspect.status) && (
                                        <button
                                            onClick={() => handleQuickStatusUpdate(selectedReturnForInspect.id, "ITEM_RECEIVED")}
                                            disabled={updateStatusMutation.isPending}
                                            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors cursor-pointer"
                                        >
                                            Mark Received
                                        </button>
                                    )}

                                    {selectedReturnForInspect.resolution === "REFUND" &&
                                        ["APPROVED", "ITEM_RECEIVED", "REQUESTED", "UNDER_REVIEW", "REFUND_PENDING"].includes(
                                            selectedReturnForInspect.status
                                        ) && (
                                            <button
                                                onClick={() => setSelectedReturnForRefund(selectedReturnForInspect)}
                                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors cursor-pointer"
                                            >
                                                Authorize Refund
                                            </button>
                                        )}

                                    {!["REFUNDED", "REJECTED", "CLOSED"].includes(selectedReturnForInspect.status) && (
                                        <button
                                            onClick={() => setSelectedReturnForReject(selectedReturnForInspect)}
                                            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                                        >
                                            Reject Claim
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setSelectedReturnForInspect(null)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* LIGHTBOX MODAL FOR EVIDENCE IMAGE */}
            {expandedImage && (
                <ModalPortal onClose={() => setExpandedImage(null)}>
                    <div
                        className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setExpandedImage(null)}
                    >
                        <div className="relative max-w-3xl max-h-[90vh]">
                            <img
                                src={expandedImage}
                                alt="Expanded evidence view"
                                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border border-slate-800"
                            />
                            <button
                                onClick={() => setExpandedImage(null)}
                                className="absolute -top-3 -right-3 size-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer shadow-md"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};
