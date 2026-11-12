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
    Store,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    RefreshCw,
    Check,
    X,
    RotateCcw,
    Lock,
    Eye,
    ShieldAlert,
    Star,
    MoreVertical,
    Ban,
    Layers,
    ExternalLink,
    MailCheck,
} from "lucide-react";
import {
    useAdminShops,
    useApproveShop,
    useRejectShop,
    useSuspendShop,
    useReopenShop,
    useSendVerificationReminder,
    useBulkSendVerificationReminder,
    useAddShopRiskFlag,
} from "@/features/admin/admin.hooks";
import { toast } from "@/components/ui/toast";
import { ModalPortal } from "@/components/ui/ds-components";
import type { AdminShop, VerificationStatus, RiskSeverity } from "@/features/admin/admin.api";

const QUEUE_OPTIONS = [
    { value: "pending_queue", label: "Pending Approval Queue", icon: Clock, countKey: "pendingCount", color: "text-amber-600" },
    { value: "all", label: "All Registered Stores", icon: Store, countKey: "total", color: "text-slate-700" },
    { value: "flagged", label: "High Risk & Flagged", icon: ShieldAlert, countKey: "highRiskCount", color: "text-rose-600" },
    { value: "suspended", label: "Suspended & Terminated", icon: Lock, countKey: "suspendedCount", color: "text-slate-600" },
];

const SHOP_STATUS_OPTIONS = [
    { value: "", label: "All Statuses", dot: "bg-slate-400" },
    { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
    { value: "PENDING", label: "Pending Approval", dot: "bg-amber-500" },
    { value: "PAUSED", label: "Paused", dot: "bg-blue-500" },
    { value: "SUSPENDED", label: "Suspended", dot: "bg-rose-500" },
    { value: "CLOSED", label: "Closed", dot: "bg-slate-400" },
    { value: "REJECTED", label: "Rejected", dot: "bg-red-500" },
];

const VERIFICATION_OPTIONS = [
    { value: "", label: "All Verifications", dot: "bg-slate-400" },
    { value: "VERIFIED", label: "Verified Business", dot: "bg-emerald-500" },
    { value: "IN_REVIEW", label: "In Review", dot: "bg-blue-500" },
    { value: "PENDING", label: "Pending Verification", dot: "bg-amber-500" },
    { value: "REJECTED", label: "Rejected", dot: "bg-rose-500" },
    { value: "UNVERIFIED", label: "Unverified", dot: "bg-slate-400" },
];

const RISK_OPTIONS = [
    { value: "", label: "All Risk Levels", dot: "bg-slate-400" },
    { value: "CRITICAL", label: "Critical Risk", dot: "bg-rose-600" },
    { value: "HIGH", label: "High Risk", dot: "bg-orange-500" },
    { value: "MEDIUM", label: "Medium Risk", dot: "bg-amber-500" },
    { value: "LOW", label: "Low Risk", dot: "bg-emerald-500" },
];

const LIMIT_OPTIONS = [10, 20, 50, 100];

const PRESET_RISK_FLAGS = [
    { flag: "MISMATCHED_TAX_ID", label: "Mismatched Tax ID / Legal Entity", severity: "HIGH" },
    { flag: "UNVERIFIED_OWNER_KYC", label: "Unverified Owner KYC / Identity", severity: "HIGH" },
    { flag: "SUSPICIOUS_HIGH_CHARGEBACKS", label: "Suspicious Chargebacks / Disputes", severity: "CRITICAL" },
    { flag: "UNVERIFIABLE_ADDRESS", label: "Address Verification Failure", severity: "MEDIUM" },
    { flag: "PROHIBITED_GOODS_SUSPICION", label: "Suspected Prohibited Goods / Policy", severity: "CRITICAL" },
    { flag: "INCOMPLETE_COMPLIANCE_DOCS", label: "Missing Required Compliance Documents", severity: "MEDIUM" },
    { flag: "MANUAL_COMPLIANCE_HOLD", label: "Manual Hold by Super Admin", severity: "LOW" },
];

export const ShopStatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; dot: string; label: string }> = {
        ACTIVE: { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "Active" },
        PENDING: { bg: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500 animate-pulse", label: "Pending Review" },
        PAUSED: { bg: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500", label: "Paused" },
        SUSPENDED: { bg: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-500", label: "Suspended" },
        CLOSED: { bg: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400", label: "Closed" },
        REJECTED: { bg: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500", label: "Rejected" },
    };
    const c = config[status] ?? { bg: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400", label: status };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${c.bg}`}>
            <span className={`size-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

export const VerificationBadge = ({ status }: { status?: VerificationStatus | string }) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
        VERIFIED: { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2, label: "Verified" },
        IN_REVIEW: { bg: "bg-blue-50 text-blue-800 border-blue-200", icon: Clock, label: "In Review" },
        PENDING: { bg: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock, label: "Pending" },
        REJECTED: { bg: "bg-rose-50 text-rose-800 border-rose-200", icon: XCircle, label: "Rejected" },
        UNVERIFIED: { bg: "bg-slate-50 text-slate-600 border-slate-200", icon: AlertTriangle, label: "Unverified" },
    };
    const c = config[status || "UNVERIFIED"] ?? config.UNVERIFIED;
    const Icon = c.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${c.bg}`}>
            <Icon size={11} className="shrink-0" />
            <span>{c.label}</span>
        </span>
    );
};

export const HealthScorePill = ({ score }: { score?: number }) => {
    const val = score ?? 70;
    let color = "text-rose-700 bg-rose-50 border-rose-200";
    let label = "High Risk";
    if (val >= 90) {
        color = "text-emerald-700 bg-emerald-50 border-emerald-200";
        label = "Excellent";
    } else if (val >= 75) {
        color = "text-blue-700 bg-blue-50 border-blue-200";
        label = "Healthy";
    } else if (val >= 50) {
        color = "text-amber-700 bg-amber-50 border-amber-200";
        label = "Fair";
    }

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium tabular-nums ${color}`}>
            <span className="size-1.5 rounded-full bg-current" />
            <span className="font-semibold">{val}</span>
            <span className="opacity-75 font-normal">({label})</span>
        </div>
    );
};

export const AdminShopsPage = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<"pending_queue" | "all" | "flagged" | "suspended">("pending_queue");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("");
    const [verificationStatus, setVerificationStatus] = useState("");
    const [riskLevel, setRiskLevel] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Interactive filter dropdown state
    const [openFilterDropdown, setOpenFilterDropdown] = useState<"queue" | "status" | "verification" | "risk" | "limit" | null>(null);

    // 3-dot floating action dropdown state
    const [dropdownState, setDropdownState] = useState<{
        shopId: string;
        shop: AdminShop;
        top: number;
        right: number;
        openUpwards: boolean;
    } | null>(null);

    // Workflow modals state
    const [approveModalShop, setApproveModalShop] = useState<AdminShop | null>(null);
    const [approvalNote, setApprovalNote] = useState("");

    const [rejectModalShop, setRejectModalShop] = useState<AdminShop | null>(null);
    const [rejectionReason, setRejectionReason] = useState("Incomplete or unverifiable legal documentation");
    const [rejectionNotes, setRejectionNotes] = useState("");

    const [suspendModalShop, setSuspendModalShop] = useState<AdminShop | null>(null);
    const [suspensionReason, setSuspensionReason] = useState("Policy / terms of service violation");
    const [suspensionNotes, setSuspensionNotes] = useState("");

    const [reopenModalShop, setReopenModalShop] = useState<AdminShop | null>(null);
    const [reopenReason, setReopenReason] = useState("Merchant resolved all verification requirements");
    const [targetReopenStatus, setTargetReopenStatus] = useState<"ACTIVE" | "PENDING">("ACTIVE");

    // Quick risk flag modal from table
    const [riskModalShop, setRiskModalShop] = useState<AdminShop | null>(null);
    const [riskFlagValue, setRiskFlagValue] = useState(PRESET_RISK_FLAGS[0].flag);
    const [riskSeverityValue, setRiskSeverityValue] = useState<RiskSeverity>("HIGH");
    const [riskDescription, setRiskDescription] = useState("");

    const filters = {
        tab,
        search,
        status: status || undefined,
        verificationStatus: verificationStatus || undefined,
        riskLevel: riskLevel || undefined,
        page,
        limit,
    };

    const { data, isLoading, isError, refetch } = useAdminShops(filters);

    const approveMutation = useApproveShop();
    const rejectMutation = useRejectShop();
    const suspendMutation = useSuspendShop();
    const reopenMutation = useReopenShop();
    const addRiskFlagMutation = useAddShopRiskFlag();
    const sendVerificationReminderMutation = useSendVerificationReminder();
    const bulkSendVerificationReminderMutation = useBulkSendVerificationReminder();

    const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    const handleSendSingleVerification = async (shopId: string, _shopName: string, email: string) => {
        try {
            setIsSendingReminder(true);
            const res = await sendVerificationReminderMutation.mutateAsync(shopId);
            toast.add({
                title: "Verification Email Sent",
                description: res.message || `Verification link sent to ${email}`,
                type: "success",
            });
            refetch();
        } catch (err: any) {
            toast.add({
                title: "Failed to Send Verification",
                description: err?.response?.data?.message || err?.message || "Failed to send email",
                type: "error",
            });
        } finally {
            setIsSendingReminder(false);
        }
    };

    const handleBulkSendVerification = async () => {
        if (selectedShopIds.length === 0) return;
        try {
            setIsSendingReminder(true);
            const res = await bulkSendVerificationReminderMutation.mutateAsync(selectedShopIds);
            toast.add({
                title: "Bulk Verification Sent",
                description: res.message || `Dispatched verification reminders to selected stores`,
                type: "success",
            });
            setSelectedShopIds([]);
            refetch();
        } catch (err: any) {
            toast.add({
                title: "Bulk Send Failed",
                description: err?.response?.data?.message || err?.message || "Failed to send emails",
                type: "error",
            });
        } finally {
            setIsSendingReminder(false);
        }
    };

    const handleToggleSelectAll = () => {
        if (!data?.shops) return;
        if (selectedShopIds.length === data.shops.length) {
            setSelectedShopIds([]);
        } else {
            setSelectedShopIds(data.shops.map((s) => s.id));
        }
    };

    const handleToggleSelectShop = (shopId: string) => {
        setSelectedShopIds((prev) =>
            prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
        );
    };

    useEffect(() => {
        const handleScrollOrResize = () => {
            setDropdownState(null);
            setOpenFilterDropdown(null);
        };
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };

    const handleResetFilters = () => {
        setSearch("");
        setSearchInput("");
        setStatus("");
        setVerificationStatus("");
        setRiskLevel("");
        setTab("pending_queue");
        setPage(1);
    };

    const handleTabChange = (newTab: "pending_queue" | "all" | "flagged" | "suspended") => {
        setTab(newTab);
        setPage(1);
        if (newTab === "suspended") {
            setStatus("SUSPENDED");
        } else if (status === "SUSPENDED") {
            setStatus("");
        }
    };

    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, shop: AdminShop) => {
        e.stopPropagation();
        if (dropdownState?.shopId === shop.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 280;

        setDropdownState({
            shopId: shop.id,
            shop,
            top: openUpwards ? rect.top - 4 : rect.bottom + 4,
            right: window.innerWidth - rect.right,
            openUpwards,
        });
    };

    const handleApprove = async () => {
        if (!approveModalShop) return;
        try {
            await approveMutation.mutateAsync({
                id: approveModalShop.id,
                notes: approvalNote.trim() || undefined,
            });
            toast.add({
                title: "Shop Approved",
                description: `"${approveModalShop.profile?.name || approveModalShop.slug}" is now active and approved to trade.`,
                type: "success",
            });
            setApproveModalShop(null);
            setApprovalNote("");
        } catch (err: any) {
            toast.add({
                title: "Approval Failed",
                description: err?.response?.data?.message ?? "An error occurred",
                type: "error",
            });
        }
    };

    const handleReject = async () => {
        if (!rejectModalShop) return;
        try {
            await rejectMutation.mutateAsync({
                id: rejectModalShop.id,
                reason: rejectionReason,
                notes: rejectionNotes.trim() || undefined,
            });
            toast.add({
                title: "Application Rejected",
                description: `Shop application has been marked as rejected.`,
                type: "success",
            });
            setRejectModalShop(null);
            setRejectionNotes("");
        } catch (err: any) {
            toast.add({
                title: "Rejection Failed",
                description: err?.response?.data?.message ?? "An error occurred",
                type: "error",
            });
        }
    };

    const handleSuspend = async () => {
        if (!suspendModalShop) return;
        try {
            await suspendMutation.mutateAsync({
                id: suspendModalShop.id,
                reason: suspensionReason,
                notes: suspensionNotes.trim() || undefined,
            });
            toast.add({
                title: "Shop Suspended",
                description: `Shop has been suspended from customer trading.`,
                type: "success",
            });
            setSuspendModalShop(null);
            setSuspensionNotes("");
        } catch (err: any) {
            toast.add({
                title: "Suspension Failed",
                description: err?.response?.data?.message ?? "An error occurred",
                type: "error",
            });
        }
    };

    const handleReopen = async () => {
        if (!reopenModalShop) return;
        try {
            await reopenMutation.mutateAsync({
                id: reopenModalShop.id,
                reason: reopenReason,
                targetStatus: targetReopenStatus,
            });
            toast.add({
                title: "Shop Reopened",
                description: `Shop reopened to status ${targetReopenStatus}.`,
                type: "success",
            });
            setReopenModalShop(null);
        } catch (err: any) {
            toast.add({
                title: "Reopen Failed",
                description: err?.response?.data?.message ?? "An error occurred",
                type: "error",
            });
        }
    };

    const handleAddRiskFlag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!riskModalShop) return;
        try {
            await addRiskFlagMutation.mutateAsync({
                shopId: riskModalShop.id,
                data: {
                    flag: riskFlagValue,
                    severity: riskSeverityValue,
                    description: riskDescription.trim() || undefined,
                },
            });
            toast.add({
                title: "Risk Flag Attached",
                description: `Flag added to ${riskModalShop.profile?.name || riskModalShop.slug}.`,
                type: "success",
            });
            setRiskModalShop(null);
            setRiskDescription("");
        } catch (err: any) {
            toast.add({
                title: "Failed to add risk flag",
                description: err?.response?.data?.message ?? "An error occurred",
                type: "error",
            });
        }
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
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-xs select-none">
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

    const stats = data?.stats;
    const currentQueueItem = QUEUE_OPTIONS.find((q) => q.value === tab) || QUEUE_OPTIONS[0];
    const currentVerificationItem = VERIFICATION_OPTIONS.find((v) => v.value === verificationStatus) || VERIFICATION_OPTIONS[0];
    const currentStatusItem = SHOP_STATUS_OPTIONS.find((s) => s.value === status) || SHOP_STATUS_OPTIONS[0];
    const currentRiskItem = RISK_OPTIONS.find((r) => r.value === riskLevel) || RISK_OPTIONS[0];
    const isAnyFilterActive = Boolean(search || status || verificationStatus || riskLevel || tab !== "pending_queue");

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                        Tenant & Store Directory
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Merchant onboarding reviews, business verification, risk controls, and storefront governance.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
                        title="Refresh list"
                    >
                        <RefreshCw size={13} className={isLoading ? "animate-spin text-orange-500" : "text-slate-500"} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards / Quick Queue Switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Pending Review */}
                <button
                    onClick={() => handleTabChange("pending_queue")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "pending_queue"
                            ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-amber-800 font-medium mb-1">
                        <span>Pending Review</span>
                        <Clock size={14} className="text-amber-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.pendingCount.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Requires action
                    </p>
                </button>

                {/* 2. In Review */}
                <button
                    onClick={() => {
                        handleTabChange("all");
                        setVerificationStatus("IN_REVIEW");
                    }}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "all" && verificationStatus === "IN_REVIEW"
                            ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-blue-800 font-medium mb-1">
                        <span>In Review</span>
                        <FileText size={14} className="text-blue-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.inReviewCount.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Docs verification</p>
                </button>

                {/* 3. Active Stores */}
                <button
                    onClick={() => {
                        handleTabChange("all");
                        setStatus("ACTIVE");
                        setVerificationStatus("");
                    }}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "all" && status === "ACTIVE"
                            ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
                        <span>Active Stores</span>
                        <ShieldCheck size={14} className="text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.activeCount.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium">Live & trading</p>
                </button>

                {/* 4. High Risk Flags */}
                <button
                    onClick={() => handleTabChange("flagged")}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "flagged"
                            ? "bg-rose-50/40 border-rose-300 ring-1 ring-rose-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
                        <span>High Risk Flags</span>
                        <ShieldAlert size={14} className="text-rose-600" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-rose-700 tabular-nums">
                        {stats ? stats.highRiskCount.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">Compliance holds</p>
                </button>

                {/* 5. Suspended / Closed */}
                <button
                    onClick={() => handleTabChange("suspended")}
                    className={`col-span-2 sm:col-span-1 text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        tab === "suspended"
                            ? "bg-slate-100 border-slate-300 ring-1 ring-slate-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>Suspended</span>
                        <Lock size={14} className="text-slate-500" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {stats ? stats.suspendedCount.toLocaleString() : "—"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Frozen accounts</p>
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs flex flex-col lg:flex-row gap-2.5">
                {/* Search Input */}
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search store name, slug, owner name, email, EIN / tax ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-2xs transition-colors shrink-0 cursor-pointer"
                    >
                        Search
                    </button>
                </form>

                {/* Filter Dropdown Popovers */}
                <div className="flex flex-wrap items-center gap-1.5 relative">
                    {/* Queue Switcher Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "queue" ? null : "queue");
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                tab !== "all"
                                    ? "bg-orange-50 text-orange-800 border-orange-200"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <Layers size={13} className={tab !== "all" ? "text-orange-500" : "text-slate-400"} />
                            <span>{currentQueueItem.label}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "queue" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute left-0 lg:right-0 lg:left-auto top-full mt-1 z-30 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                                    {QUEUE_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                handleTabChange(item.value as any);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors cursor-pointer ${
                                                tab === item.value
                                                    ? "bg-orange-50 text-orange-900 font-semibold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <item.icon size={13} className={item.color} />
                                                <span>{item.label}</span>
                                            </div>
                                            {tab === item.value && <Check size={13} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Verification Status Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "verification" ? null : "verification");
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                verificationStatus
                                    ? "bg-orange-50 text-orange-800 border-orange-200"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <ShieldCheck size={13} className={verificationStatus ? "text-orange-500" : "text-slate-400"} />
                            <span className="truncate max-w-[120px]">{currentVerificationItem.label}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "verification" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                                    {VERIFICATION_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setVerificationStatus(item.value);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors cursor-pointer ${
                                                verificationStatus === item.value
                                                    ? "bg-orange-50 text-orange-900 font-semibold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`size-1.5 rounded-full ${item.dot}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {verificationStatus === item.value && <Check size={13} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Shop Status Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "status" ? null : "status");
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                status
                                    ? "bg-orange-50 text-orange-800 border-orange-200"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <Store size={13} className={status ? "text-orange-500" : "text-slate-400"} />
                            <span className="truncate max-w-[110px]">{currentStatusItem.label}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "status" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                                    {SHOP_STATUS_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setStatus(item.value);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors cursor-pointer ${
                                                status === item.value
                                                    ? "bg-orange-50 text-orange-900 font-semibold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`size-1.5 rounded-full ${item.dot}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {status === item.value && <Check size={13} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Risk Level Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "risk" ? null : "risk");
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                riskLevel
                                    ? "bg-orange-50 text-orange-800 border-orange-200"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <AlertTriangle size={13} className={riskLevel ? "text-orange-500" : "text-slate-400"} />
                            <span className="truncate max-w-[100px]">{currentRiskItem.label}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "risk" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                                    {RISK_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setRiskLevel(item.value);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors cursor-pointer ${
                                                riskLevel === item.value
                                                    ? "bg-orange-50 text-orange-900 font-semibold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`size-1.5 rounded-full ${item.dot}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {riskLevel === item.value && <Check size={13} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Limit Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "limit" ? null : "limit");
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <span>{limit} / page</span>
                            <ChevronDown size={12} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "limit" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1 z-30 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                                    {LIMIT_OPTIONS.map((lim) => (
                                        <button
                                            key={lim}
                                            onClick={() => {
                                                setLimit(lim);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-3 py-1.5 text-xs flex items-center justify-between font-medium transition-colors cursor-pointer ${
                                                limit === lim
                                                    ? "bg-orange-50 text-orange-900 font-semibold"
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

                    {/* Reset Filters */}
                    {isAnyFilterActive && (
                        <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                            title="Reset all filters"
                        >
                            <X size={12} />
                            <span>Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Selection Action Bar */}
            {selectedShopIds.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-950">
                            {selectedShopIds.length} {selectedShopIds.length === 1 ? "store" : "stores"} selected
                        </span>
                        <span className="text-slate-400 hidden sm:inline">•</span>
                        <span className="text-amber-800 text-[11px]">
                            Dispatches attractive NextGM merchant verification emails to selected store owners.
                        </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            disabled={isSendingReminder}
                            onClick={handleBulkSendVerification}
                            className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-md font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 transition-all"
                        >
                            {isSendingReminder ? <Loader2 size={13} className="animate-spin" /> : <MailCheck size={13} />}
                            Send Verification Emails ({selectedShopIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedShopIds([])}
                            className="px-2.5 py-1.5 border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 rounded-md font-medium text-xs cursor-pointer transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Merchant Data Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-500">
                        <Loader2 className="animate-spin text-orange-500" size={24} />
                        <p className="text-xs font-medium text-slate-400">Loading tenant stores...</p>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-600 text-xs">
                        <AlertTriangle className="mx-auto size-8 mb-2 opacity-60" />
                        <p className="font-semibold text-sm text-slate-800">Failed to load shop catalog</p>
                        <p className="text-slate-400 mt-1">Please check your network connection or permissions.</p>
                    </div>
                ) : !data || data.shops.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Store className="mx-auto size-10 opacity-30 mb-2" />
                        <p className="font-semibold text-slate-800 text-sm">No shops found matching criteria</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                            {tab === "pending_queue"
                                ? "All outstanding merchant applications have been reviewed."
                                : "Try clearing filters to view other tenant stores."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] text-slate-500 font-medium">
                                <tr>
                                    <th className="w-9 px-3 py-2.5 text-center">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(data.shops.length > 0 && selectedShopIds.length === data.shops.length)}
                                            onChange={handleToggleSelectAll}
                                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                            title="Select all"
                                        />
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">Store & Merchant</th>
                                    <th className="px-4 py-2.5 font-medium">Owner & Verification</th>
                                    <th className="px-3 py-2.5 font-medium text-center">Status</th>
                                    <th className="px-3 py-2.5 font-medium text-center">Verification</th>
                                    <th className="px-3 py-2.5 font-medium text-center">Health</th>
                                    <th className="px-3 py-2.5 font-medium text-center">Risk & Docs</th>
                                    <th className="px-4 py-2.5 font-medium">Balance</th>
                                    <th className="px-3 py-2.5 font-medium">Activity</th>
                                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {data.shops.map((shop) => {
                                    const openFlags = shop.riskFlags || [];
                                    const docsCount = shop.legalInfo?._count?.documents ?? 0;
                                    const isSelected = selectedShopIds.includes(shop.id);

                                    return (
                                        <tr key={shop.id} className={`hover:bg-slate-50/70 transition-colors group ${isSelected ? "bg-amber-50/40" : ""}`}>
                                            {/* Selection Checkbox */}
                                            <td className="w-9 px-3 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectShop(shop.id)}
                                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                />
                                            </td>

                                            {/* Store Identity */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {shop.profile?.logo ? (
                                                        <img
                                                            src={shop.profile.logo}
                                                            alt=""
                                                            className="size-9 rounded-md object-cover border border-slate-200 shadow-2xs shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="size-9 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-semibold flex items-center justify-center shrink-0">
                                                            <Store size={16} />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => navigate(`/superadmin/shops/${shop.id}`)}
                                                                className="font-semibold text-slate-900 hover:text-orange-600 transition-colors text-left truncate cursor-pointer"
                                                            >
                                                                {shop.profile?.name || shop.slug}
                                                            </button>
                                                            <a
                                                                href={`/${shop.slug}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                                                title="View storefront"
                                                            >
                                                                <ExternalLink size={11} />
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                                            <span className="font-mono text-slate-500">/{shop.slug}</span>
                                                            {shop.legalInfo?.legalBusinessName && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-slate-600 truncate max-w-[140px]">
                                                                        {shop.legalInfo.legalBusinessName}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {shop.legalInfo?.taxId && (
                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                EIN: {shop.legalInfo.taxId}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Owner & Verification */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div>
                                                    <p className="font-medium text-slate-900">{shop.owner.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <p className="text-[11px] text-slate-400">{shop.owner.email}</p>
                                                        {shop.owner.isEmailVerified ? (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                                                <CheckCircle2 size={9} /> Verified
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                                                <AlertTriangle size={9} /> Unverified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex items-center gap-1">
                                                    <span className="text-[10px] text-slate-400 font-medium">KYC:</span>
                                                    <VerificationBadge status={shop.legalInfo?.ownerKycStatus} />
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-3 py-3 text-center whitespace-nowrap">
                                                <ShopStatusBadge status={shop.status} />
                                                {shop.status === "REJECTED" && shop.rejectionReason && (
                                                    <p className="text-[10px] text-red-600 font-medium mt-1 max-w-[130px] truncate mx-auto" title={shop.rejectionReason}>
                                                        {shop.rejectionReason}
                                                    </p>
                                                )}
                                                {shop.status === "SUSPENDED" && shop.suspensionReason && (
                                                    <p className="text-[10px] text-rose-600 font-medium mt-1 max-w-[130px] truncate mx-auto" title={shop.suspensionReason}>
                                                        {shop.suspensionReason}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Business Verification */}
                                            <td className="px-3 py-3 text-center whitespace-nowrap">
                                                <VerificationBadge status={shop.legalInfo?.businessVerificationStatus} />
                                                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                                    Tax: {shop.legalInfo?.taxIdStatus || "UNVERIFIED"}
                                                </div>
                                            </td>

                                            {/* Health Score */}
                                            <td className="px-3 py-3 text-center whitespace-nowrap">
                                                <HealthScorePill score={shop.healthScore} />
                                            </td>

                                            {/* Risk & Docs */}
                                            <td className="px-3 py-3 text-center whitespace-nowrap">
                                                <div className="flex flex-col items-center gap-1">
                                                    {openFlags.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                            <AlertTriangle size={10} />
                                                            {openFlags.length} Flag{openFlags.length > 1 ? "s" : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                                            Clean
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                                        <FileText size={11} className="text-slate-400" />
                                                        {docsCount} doc{docsCount === 1 ? "" : "s"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Balance */}
                                            <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                                                <span className="font-semibold text-slate-900">
                                                    ${Number(shop.wallet?.balance ?? 0).toFixed(2)}
                                                </span>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                    {shop.wallet?.payoutsEnabled ? "Payouts enabled" : "Payouts disabled"}
                                                </p>
                                            </td>

                                            {/* Activity counts */}
                                            <td className="px-3 py-3 whitespace-nowrap text-[11px] tabular-nums">
                                                <p className="font-medium text-slate-700">{shop._count.products} products</p>
                                                <p className="text-slate-400 mt-0.5">{shop._count.orders} orders</p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => navigate(`/superadmin/shops/${shop.id}`)}
                                                        className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-medium transition-colors cursor-pointer"
                                                    >
                                                        Review
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleOpenDropdown(e, shop)}
                                                        className={`size-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                                                            dropdownState?.shopId === shop.id
                                                                ? "bg-slate-100 text-slate-900"
                                                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                        }`}
                                                        title="More options"
                                                    >
                                                        <MoreVertical size={14} />
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
            </div>

            {/* Pagination Bar */}
            {data && data.total > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        Showing <span className="font-semibold text-slate-900">{((page - 1) * limit) + 1}</span> to{" "}
                        <span className="font-semibold text-slate-900">{Math.min(page * limit, data.total)}</span> of{" "}
                        <span className="font-semibold text-slate-900">{data.total.toLocaleString()}</span> stores
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer"
                        >
                            <ChevronsLeft size={13} />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer"
                        >
                            <ChevronLeft size={13} />
                        </button>

                        <div className="flex items-center gap-0.5 mx-1">
                            {renderPaginationNumbers()}
                        </div>

                        <button
                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            disabled={page >= data.totalPages}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer"
                        >
                            <ChevronRight size={13} />
                        </button>
                        <button
                            onClick={() => setPage(data.totalPages)}
                            disabled={page >= data.totalPages}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer"
                        >
                            <ChevronsRight size={13} />
                        </button>
                    </div>
                </div>
            )}

            {/* Fixed Floating 3-Dot Dropdown Menu */}
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
                        className="z-50 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-left text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                    >
                        {/* Primary Navigation */}
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    const sId = dropdownState.shop.id;
                                    setDropdownState(null);
                                    navigate(`/superadmin/shops/${sId}`);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <Eye size={14} className="text-slate-400" />
                                <span>Inspect Store Profile</span>
                            </button>
                            <button
                                onClick={() => {
                                    const sId = dropdownState.shop.id;
                                    setDropdownState(null);
                                    navigate(`/superadmin/shops/${sId}?tab=reviews`);
                                }}
                                className="w-full px-3 py-1.5 text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <Star size={14} className="text-amber-500 fill-amber-500" />
                                <span>Customer Reviews</span>
                            </button>
                        </div>

                        {/* Approval / Workflow Quick Actions */}
                        <div className="py-1">
                            {(dropdownState.shop.status === "PENDING" || dropdownState.shop.status === "REJECTED") && (
                                <button
                                    onClick={() => {
                                        const s = dropdownState.shop;
                                        setDropdownState(null);
                                        setApproveModalShop(s);
                                        setApprovalNote("");
                                    }}
                                    className="w-full px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    <span>Approve Application</span>
                                </button>
                            )}

                            {dropdownState.shop.status === "PENDING" && (
                                <button
                                    onClick={() => {
                                        const s = dropdownState.shop;
                                        setDropdownState(null);
                                        setRejectModalShop(s);
                                        setRejectionReason("Incomplete or unverifiable legal documentation");
                                        setRejectionNotes("");
                                    }}
                                    className="w-full px-3 py-1.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <XCircle size={14} className="text-rose-600" />
                                    <span>Reject Application</span>
                                </button>
                            )}

                            {(dropdownState.shop.status === "ACTIVE" || dropdownState.shop.status === "PAUSED") && (
                                <button
                                    onClick={() => {
                                        const s = dropdownState.shop;
                                        setDropdownState(null);
                                        setSuspendModalShop(s);
                                        setSuspensionReason("Policy / terms of service violation");
                                        setSuspensionNotes("");
                                    }}
                                    className="w-full px-3 py-1.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <Ban size={14} className="text-rose-600" />
                                    <span>Suspend Store</span>
                                </button>
                            )}

                            {(dropdownState.shop.status === "SUSPENDED" || dropdownState.shop.status === "CLOSED" || dropdownState.shop.status === "REJECTED") && (
                                <button
                                    onClick={() => {
                                        const s = dropdownState.shop;
                                        setDropdownState(null);
                                        setReopenModalShop(s);
                                        setReopenReason("Compliance requirements satisfied");
                                        setTargetReopenStatus("ACTIVE");
                                    }}
                                    className="w-full px-3 py-1.5 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <RotateCcw size={14} className="text-indigo-600" />
                                    <span>Reopen Store</span>
                                </button>
                            )}

                            {!dropdownState.shop.owner.isEmailVerified && (
                                <button
                                    onClick={() => {
                                        const s = dropdownState.shop;
                                        setDropdownState(null);
                                        handleSendSingleVerification(s.id, s.profile?.name || s.slug, s.owner.email);
                                    }}
                                    className="w-full px-3 py-1.5 text-amber-800 hover:bg-amber-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                >
                                    <MailCheck size={14} className="text-amber-600" />
                                    <span>Send Verification Email</span>
                                </button>
                            )}
                        </div>

                        {/* Risk Flagging */}
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    const s = dropdownState.shop;
                                    setDropdownState(null);
                                    setRiskModalShop(s);
                                    setRiskFlagValue(PRESET_RISK_FLAGS[0].flag);
                                    setRiskSeverityValue("HIGH");
                                    setRiskDescription("");
                                }}
                                className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                            >
                                <ShieldAlert size={14} className="text-rose-500" />
                                <span>Flag Compliance Risk</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modal: Quick Approve Shop */}
            {approveModalShop && (
                <ModalPortal onClose={() => setApproveModalShop(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setApproveModalShop(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Approve Shop Application</h3>
                                        <p className="text-[11px] text-slate-500">
                                            {approveModalShop.profile?.name || approveModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setApproveModalShop(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-3 bg-emerald-50/70 text-emerald-900 rounded-md border border-emerald-200 text-xs space-y-1">
                                <p className="font-semibold text-emerald-800">Upon approval:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-emerald-700 text-[11px]">
                                    <li>Store status changes to <strong>ACTIVE</strong> immediately.</li>
                                    <li>Catalog products become publicly visible.</li>
                                    <li>Merchant receives automated live notification.</li>
                                </ul>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-700">
                                    Approval Notes (Optional)
                                </label>
                                <textarea
                                    value={approvalNote}
                                    onChange={(e) => setApprovalNote(e.target.value)}
                                    placeholder="Enter verification notes or audit reference..."
                                    rows={2}
                                    className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setApproveModalShop(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {approveMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Confirm Approval
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Modal: Quick Reject Shop */}
            {rejectModalShop && (
                <ModalPortal onClose={() => setRejectModalShop(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setRejectModalShop(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                                        <XCircle size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Reject Shop Application</h3>
                                        <p className="text-[11px] text-slate-500">
                                            {rejectModalShop.profile?.name || rejectModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setRejectModalShop(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Primary Rejection Reason
                                    </label>
                                    <select
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="Incomplete or unverifiable legal documentation">
                                            Incomplete or unverifiable legal documentation
                                        </option>
                                        <option value="Mismatched Tax ID / Business entity registration">
                                            Mismatched Tax ID / Business entity registration
                                        </option>
                                        <option value="Owner identity / KYC could not be verified">
                                            Owner identity / KYC could not be verified
                                        </option>
                                        <option value="Prohibited business category or policy violation">
                                            Prohibited business category or policy violation
                                        </option>
                                        <option value="Duplicate or fraudulent merchant profile">
                                            Duplicate or fraudulent merchant profile
                                        </option>
                                        <option value="Physical address verification failure">
                                            Physical address verification failure
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Merchant Feedback & Instructions
                                    </label>
                                    <textarea
                                        value={rejectionNotes}
                                        onChange={(e) => setRejectionNotes(e.target.value)}
                                        placeholder="Clear steps explaining what the merchant must correct..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setRejectModalShop(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {rejectMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Modal: Suspend Shop */}
            {suspendModalShop && (
                <ModalPortal onClose={() => setSuspendModalShop(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setSuspendModalShop(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                                        <Ban size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Suspend Merchant Trading</h3>
                                        <p className="text-[11px] text-slate-500">
                                            {suspendModalShop.profile?.name || suspendModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSuspendModalShop(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Suspension Reason
                                    </label>
                                    <select
                                        value={suspensionReason}
                                        onChange={(e) => setSuspensionReason(e.target.value)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="Policy / terms of service violation">
                                            Policy / terms of service violation
                                        </option>
                                        <option value="Suspected fraudulent activity or elevated chargebacks">
                                            Suspected fraudulent activity or elevated chargebacks
                                        </option>
                                        <option value="Copyright / trademark infringement complaint">
                                            Copyright / trademark infringement complaint
                                        </option>
                                        <option value="Failed secondary compliance audit">
                                            Failed secondary compliance audit
                                        </option>
                                        <option value="Unresponsive merchant or severe fulfillment issues">
                                            Unresponsive merchant or severe fulfillment issues
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Internal Admin Notes
                                    </label>
                                    <textarea
                                        value={suspensionNotes}
                                        onChange={(e) => setSuspensionNotes(e.target.value)}
                                        placeholder="Record investigation notes, incident IDs, or context..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setSuspendModalShop(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSuspend}
                                    disabled={suspendMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {suspendMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Suspend Merchant
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Modal: Reopen Shop */}
            {reopenModalShop && (
                <ModalPortal onClose={() => setReopenModalShop(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setReopenModalShop(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                                        <RotateCcw size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Restore Shop Access</h3>
                                        <p className="text-[11px] text-slate-500">
                                            {reopenModalShop.profile?.name || reopenModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setReopenModalShop(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Target Status
                                    </label>
                                    <select
                                        value={targetReopenStatus}
                                        onChange={(e) => setTargetReopenStatus(e.target.value as any)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="ACTIVE">ACTIVE (Immediate trading & public storefront)</option>
                                        <option value="PENDING">PENDING (Place back in onboarding review queue)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Reopening Justification
                                    </label>
                                    <textarea
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setReopenModalShop(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReopen}
                                    disabled={reopenMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {reopenMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Confirm Reopen
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Modal: Quick Attach Risk Flag */}
            {riskModalShop && (
                <ModalPortal onClose={() => setRiskModalShop(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setRiskModalShop(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Attach Compliance Risk Flag</h3>
                                        <p className="text-[11px] text-slate-500">
                                            {riskModalShop.profile?.name || riskModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setRiskModalShop(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleAddRiskFlag} className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Risk Flag Category
                                    </label>
                                    <select
                                        value={riskFlagValue}
                                        onChange={(e) => {
                                            setRiskFlagValue(e.target.value);
                                            const found = PRESET_RISK_FLAGS.find((f) => f.flag === e.target.value);
                                            if (found) setRiskSeverityValue(found.severity as any);
                                        }}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        {PRESET_RISK_FLAGS.map((f) => (
                                            <option key={f.flag} value={f.flag}>
                                                {f.label} ({f.severity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Severity Level
                                    </label>
                                    <select
                                        value={riskSeverityValue}
                                        onChange={(e) => setRiskSeverityValue(e.target.value as any)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="CRITICAL">CRITICAL (-40 pts health deduction)</option>
                                        <option value="HIGH">HIGH (-25 pts health deduction)</option>
                                        <option value="MEDIUM">MEDIUM (-15 pts health deduction)</option>
                                        <option value="LOW">LOW (-5 pts health deduction)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Investigation Context
                                    </label>
                                    <textarea
                                        value={riskDescription}
                                        onChange={(e) => setRiskDescription(e.target.value)}
                                        placeholder="Record why this risk flag is being applied..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setRiskModalShop(null)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addRiskFlagMutation.isPending}
                                        className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                    >
                                        {addRiskFlagMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                        Attach Flag
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};
