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
    User,
    Building2,
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
} from "lucide-react";
import {
    useAdminShops,
    useApproveShop,
    useRejectShop,
    useSuspendShop,
    useReopenShop,
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
    const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
        ACTIVE: { bg: "bg-emerald-50 text-emerald-800 border-emerald-300", text: "text-emerald-800", dot: "bg-emerald-500", label: "Active" },
        PENDING: { bg: "bg-amber-50 text-amber-800 border-amber-300", text: "text-amber-800", dot: "bg-amber-500 animate-pulse", label: "Pending Approval" },
        PAUSED: { bg: "bg-blue-50 text-blue-800 border-blue-300", text: "text-blue-800", dot: "bg-blue-500", label: "Paused" },
        SUSPENDED: { bg: "bg-rose-50 text-rose-800 border-rose-300", text: "text-rose-800", dot: "bg-rose-500", label: "Suspended" },
        CLOSED: { bg: "bg-slate-100 text-slate-700 border-slate-300", text: "text-slate-700", dot: "bg-slate-500", label: "Closed" },
        REJECTED: { bg: "bg-red-50 text-red-800 border-red-300", text: "text-red-800", dot: "bg-red-500", label: "Rejected" },
    };
    const c = config[status] ?? { bg: "bg-slate-100 text-slate-700 border-slate-200", text: "text-slate-700", dot: "bg-slate-400", label: status };

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${c.bg}`}>
            <span className={`size-2 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

export const VerificationBadge = ({ status }: { status?: VerificationStatus | string }) => {
    const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
        VERIFIED: { bg: "bg-emerald-50 text-emerald-800 border-emerald-300", text: "text-emerald-800", icon: CheckCircle2, label: "Verified" },
        IN_REVIEW: { bg: "bg-blue-50 text-blue-800 border-blue-300", text: "text-blue-800", icon: Clock, label: "In Review" },
        PENDING: { bg: "bg-amber-50 text-amber-800 border-amber-300", text: "text-amber-800", icon: Clock, label: "Pending" },
        REJECTED: { bg: "bg-rose-50 text-rose-800 border-rose-300", text: "text-rose-800", icon: XCircle, label: "Rejected" },
        UNVERIFIED: { bg: "bg-slate-100 text-slate-600 border-slate-300", text: "text-slate-600", icon: AlertTriangle, label: "Unverified" },
    };
    const c = config[status || "UNVERIFIED"] ?? config.UNVERIFIED;
    const Icon = c.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.bg}`}>
            <Icon size={13} className="shrink-0" />
            <span>{c.label}</span>
        </span>
    );
};

export const HealthScorePill = ({ score }: { score?: number }) => {
    const val = score ?? 70;
    let color = "text-rose-800 bg-rose-50 border-rose-300";
    let label = "High Risk";
    if (val >= 90) {
        color = "text-emerald-800 bg-emerald-50 border-emerald-300";
        label = "Excellent";
    } else if (val >= 75) {
        color = "text-blue-800 bg-blue-50 border-blue-300";
        label = "Healthy";
    } else if (val >= 50) {
        color = "text-amber-800 bg-amber-50 border-amber-300";
        label = "Fair";
    }

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-2xs ${color}`}>
            <span className="size-2 rounded-full bg-current" />
            <span className="font-mono">{val}</span>
            <span className="font-medium opacity-80">({label})</span>
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

    // 3-dot floating action dropdown state (guaranteed ZERO clipping by table)
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

    // Close fixed dropdown and filter popovers on window scroll or resize
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

    // Calculate fixed dropdown coordinates to guarantee ZERO table clipping
    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, shop: AdminShop) => {
        e.stopPropagation();
        if (dropdownState?.shopId === shop.id) {
            setDropdownState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 300;

        setDropdownState({
            shopId: shop.id,
            shop,
            top: openUpwards ? rect.top - 6 : rect.bottom + 6,
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

    // Pagination helper: Smart numbers with ellipsis matching AdminUsersPage
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
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-sm select-none">
                        …
                    </span>
                );
            }
            const isCurrent = p === page;
            return (
                <button
                    key={`page-${p}`}
                    onClick={() => setPage(Number(p))}
                    className={`min-w-9 h-9 px-3 text-sm font-bold rounded-xl transition-all ${
                        isCurrent
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                            : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
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
        <div className="space-y-6">
            {/* Page Header (Rich Contrast & Spacious Hierarchy) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl shadow-md shadow-orange-100 shrink-0">
                        <Building2 size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Tenant & Shop Administration
                        </h1>
                        <p className="text-sm font-medium text-slate-600 mt-1">
                            Merchant approval workflows, legal documentation audits, risk controls, and store reviews
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 rounded-xl shadow-xs transition-all active:scale-95"
                        title="Refresh list"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin text-orange-500" : "text-slate-500"} />
                        <span>Refresh Data</span>
                    </button>
                </div>
            </div>

            {/* Interactive KPI Cards (Acts as Primary Queue Switcher — NO Extra Horizontal Tab Strip!) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Pending Review */}
                <button
                    onClick={() => handleTabChange("pending_queue")}
                    className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        tab === "pending_queue"
                            ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-300/70 shadow-sm"
                            : "bg-white border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-amber-800 font-bold mb-1.5">
                        <span>Pending Review</span>
                        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {stats ? stats.pendingCount : "..."}
                    </div>
                    <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1.5 font-semibold">
                        <span className="size-2 rounded-full bg-amber-500 animate-ping inline-block" />
                        Requires action
                    </p>
                    {tab === "pending_queue" && (
                        <div className="absolute top-2 right-2 size-2 rounded-full bg-amber-500" />
                    )}
                </button>

                {/* 2. In Review */}
                <button
                    onClick={() => {
                        handleTabChange("all");
                        setVerificationStatus("IN_REVIEW");
                    }}
                    className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        tab === "all" && verificationStatus === "IN_REVIEW"
                            ? "bg-blue-50/90 border-blue-400 ring-2 ring-blue-300/70 shadow-sm"
                            : "bg-white border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-blue-800 font-bold mb-1.5">
                        <span>In Review</span>
                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                            <FileText size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {stats ? stats.inReviewCount : "..."}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">Docs inspection</p>
                    {tab === "all" && verificationStatus === "IN_REVIEW" && (
                        <div className="absolute top-2 right-2 size-2 rounded-full bg-blue-500" />
                    )}
                </button>

                {/* 3. Active Stores */}
                <button
                    onClick={() => {
                        handleTabChange("all");
                        setStatus("ACTIVE");
                        setVerificationStatus("");
                    }}
                    className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        tab === "all" && status === "ACTIVE"
                            ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300/70 shadow-sm"
                            : "bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-800 font-bold mb-1.5">
                        <span>Active Stores</span>
                        <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                            <ShieldCheck size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {stats ? stats.activeCount : "..."}
                    </div>
                    <p className="text-xs text-emerald-700 mt-1.5 font-semibold">Live & trading</p>
                    {tab === "all" && status === "ACTIVE" && (
                        <div className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500" />
                    )}
                </button>

                {/* 4. High Risk Flags */}
                <button
                    onClick={() => handleTabChange("flagged")}
                    className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        tab === "flagged"
                            ? "bg-rose-50/90 border-rose-400 ring-2 ring-rose-300/70 shadow-sm"
                            : "bg-white border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/30"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-rose-800 font-bold mb-1.5">
                        <span>High Risk Flags</span>
                        <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                            <ShieldAlert size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-rose-700">
                        {stats ? stats.highRiskCount : "..."}
                    </div>
                    <p className="text-xs text-rose-700 mt-1.5 font-medium">Compliance holds</p>
                    {tab === "flagged" && (
                        <div className="absolute top-2 right-2 size-2 rounded-full bg-rose-500" />
                    )}
                </button>

                {/* 5. Suspended / Closed */}
                <button
                    onClick={() => handleTabChange("suspended")}
                    className={`col-span-2 sm:col-span-1 relative text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        tab === "suspended"
                            ? "bg-slate-100 border-slate-400 ring-2 ring-slate-300/70 shadow-sm"
                            : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-800 font-bold mb-1.5">
                        <span>Suspended / Closed</span>
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                            <Lock size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {stats ? stats.suspendedCount : "..."}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">Disabled shops</p>
                    {tab === "suspended" && (
                        <div className="absolute top-2 right-2 size-2 rounded-full bg-slate-500" />
                    )}
                </button>
            </div>

            {/* Unified Search & Dropdown Filter Bar (Eliminates Horizontal Tab Clutter) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col lg:flex-row gap-3.5">
                {/* Search Input */}
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by store name, slug, owner name, owner email, EIN / tax ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 text-sm font-medium bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-100 transition-all shrink-0 cursor-pointer active:scale-95"
                    >
                        Search
                    </button>
                </form>

                {/* Filter Dropdown Popovers */}
                <div className="flex flex-wrap items-center gap-2 relative">
                    {/* Queue Switcher Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterDropdown(openFilterDropdown === "queue" ? null : "queue");
                            }}
                            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                tab !== "all"
                                    ? "bg-orange-50 text-orange-800 border-orange-300"
                                    : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200"
                            }`}
                        >
                            <Layers size={14} className={tab !== "all" ? "text-orange-500" : "text-slate-400"} />
                            <span>{currentQueueItem.label}</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "queue" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute left-0 lg:right-0 lg:left-auto top-full mt-1.5 z-30 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {QUEUE_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                handleTabChange(item.value as any);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-4 py-2.5 text-xs flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                                                tab === item.value
                                                    ? "bg-orange-50 text-orange-800 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <item.icon size={14} className={item.color} />
                                                <span>{item.label}</span>
                                            </div>
                                            {tab === item.value && <Check size={14} className="text-orange-500" />}
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
                            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                verificationStatus
                                    ? "bg-orange-50 text-orange-800 border-orange-300"
                                    : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200"
                            }`}
                        >
                            <ShieldCheck size={14} className={verificationStatus ? "text-orange-500" : "text-slate-400"} />
                            <span className="truncate max-w-[130px]">{currentVerificationItem.label}</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "verification" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {VERIFICATION_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setVerificationStatus(item.value);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-4 py-2.5 text-xs flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                                                verificationStatus === item.value
                                                    ? "bg-orange-50 text-orange-800 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`size-2 rounded-full ${item.dot}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {verificationStatus === item.value && <Check size={14} className="text-orange-500" />}
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
                            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                status
                                    ? "bg-orange-50 text-orange-800 border-orange-300"
                                    : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200"
                            }`}
                        >
                            <Store size={14} className={status ? "text-orange-500" : "text-slate-400"} />
                            <span className="truncate max-w-[120px]">{currentStatusItem.label}</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "status" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {SHOP_STATUS_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setStatus(item.value);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-4 py-2.5 text-xs flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                                                status === item.value
                                                    ? "bg-orange-50 text-orange-800 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`size-2 rounded-full ${item.dot}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {status === item.value && <Check size={14} className="text-orange-500" />}
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
                            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                riskLevel
                                    ? "bg-orange-50 text-orange-800 border-orange-300"
                                    : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200"
                            }`}
                        >
                            <AlertTriangle size={14} className={riskLevel ? "text-orange-500" : "text-slate-400"} />
                            <span className="truncate max-w-[110px]">{currentRiskItem.label}</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "risk" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {RISK_OPTIONS.map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setRiskLevel(item.value);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-4 py-2.5 text-xs flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                                                riskLevel === item.value
                                                    ? "bg-orange-50 text-orange-800 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`size-2 rounded-full ${item.dot}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {riskLevel === item.value && <Check size={14} className="text-orange-500" />}
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
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 transition-all cursor-pointer"
                        >
                            <span>{limit} / page</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {openFilterDropdown === "limit" && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {LIMIT_OPTIONS.map((lim) => (
                                        <button
                                            key={lim}
                                            onClick={() => {
                                                setLimit(lim);
                                                setPage(1);
                                                setOpenFilterDropdown(null);
                                            }}
                                            className={`w-full px-4 py-2.5 text-xs flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                                                limit === lim
                                                    ? "bg-orange-50 text-orange-800 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span>{lim} per page</span>
                                            {limit === lim && <Check size={14} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Reset Filters Pill */}
                    {isAnyFilterActive && (
                        <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
                            title="Reset all filters and query"
                        >
                            <X size={13} />
                            <span>Reset Filters</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Merchant Data Table (Clear Text, High Contrast, Comfortable Paddings) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-72 gap-3 text-slate-500">
                        <Loader2 className="animate-spin text-orange-500" size={36} />
                        <p className="text-sm font-semibold">Loading registered stores and compliance status...</p>
                    </div>
                ) : isError ? (
                    <div className="p-16 text-center text-rose-600 text-sm">
                        <AlertTriangle className="mx-auto size-10 mb-2 opacity-60" />
                        <p className="font-bold text-base">Failed to load shop catalog</p>
                        <p className="text-xs text-slate-500 mt-1">Please refresh the page or check server connection.</p>
                    </div>
                ) : !data || data.shops.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">
                        <Store className="mx-auto size-14 opacity-30 mb-3" />
                        <p className="font-bold text-slate-800 text-lg">No shops found matching criteria</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            {tab === "pending_queue"
                                ? "Great news! All outstanding merchant applications have been reviewed."
                                : "Try clearing filters or search query to see other merchants."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/90 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Store Identity</th>
                                    <th className="px-5 py-4">Owner & KYC</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                    <th className="px-4 py-4 text-center">Verification</th>
                                    <th className="px-4 py-4 text-center">Health</th>
                                    <th className="px-4 py-4 text-center">Risk & Docs</th>
                                    <th className="px-5 py-4">Balance</th>
                                    <th className="px-5 py-4">Activity</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {data.shops.map((shop) => {
                                    const openFlags = shop.riskFlags || [];
                                    const docsCount = shop.legalInfo?._count?.documents ?? 0;

                                    return (
                                        <tr key={shop.id} className="hover:bg-slate-50/70 transition-colors group">
                                            {/* Shop & Legal Business */}
                                            <td className="px-6 py-4.5">
                                                <div className="flex items-center gap-3.5">
                                                    {shop.profile?.logo ? (
                                                        <img
                                                            src={shop.profile.logo}
                                                            alt=""
                                                            className="size-11 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                                                        />
                                                    ) : (
                                                        <div className="size-11 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 font-black flex items-center justify-center shrink-0">
                                                            <Store size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <button
                                                            onClick={() => navigate(`/superadmin/shops/${shop.id}`)}
                                                            className="font-bold text-base text-slate-900 hover:text-orange-600 transition-colors text-left block"
                                                        >
                                                            {shop.profile?.name || shop.slug}
                                                        </button>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span className="font-mono text-slate-600 font-medium">/{shop.slug}</span>
                                                            {shop.legalInfo?.legalBusinessName && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-slate-700 font-semibold truncate max-w-[170px]">
                                                                        {shop.legalInfo.legalBusinessName}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {shop.legalInfo?.taxId && (
                                                            <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                                                                EIN: {shop.legalInfo.taxId}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Owner & KYC */}
                                            <td className="px-5 py-4.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-8 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-700 text-xs font-bold shrink-0">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{shop.owner.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{shop.owner.email}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">KYC:</span>
                                                    <VerificationBadge status={shop.legalInfo?.ownerKycStatus} />
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-4.5 text-center whitespace-nowrap">
                                                <ShopStatusBadge status={shop.status} />
                                                {shop.status === "REJECTED" && shop.rejectionReason && (
                                                    <p className="text-xs text-red-600 font-semibold mt-1 max-w-[140px] truncate mx-auto" title={shop.rejectionReason}>
                                                        {shop.rejectionReason}
                                                    </p>
                                                )}
                                                {shop.status === "SUSPENDED" && shop.suspensionReason && (
                                                    <p className="text-xs text-rose-600 font-semibold mt-1 max-w-[140px] truncate mx-auto" title={shop.suspensionReason}>
                                                        {shop.suspensionReason}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Business Verification */}
                                            <td className="px-4 py-4.5 text-center whitespace-nowrap">
                                                <VerificationBadge status={shop.legalInfo?.businessVerificationStatus} />
                                                <div className="text-xs text-slate-500 mt-1 font-mono font-medium">
                                                    Tax ID: {shop.legalInfo?.taxIdStatus || "UNVERIFIED"}
                                                </div>
                                            </td>

                                            {/* Health Score */}
                                            <td className="px-4 py-4.5 text-center whitespace-nowrap">
                                                <HealthScorePill score={shop.healthScore} />
                                            </td>

                                            {/* Risk & Docs */}
                                            <td className="px-4 py-4.5 text-center whitespace-nowrap">
                                                <div className="flex flex-col items-center gap-1">
                                                    {openFlags.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                                            <AlertTriangle size={12} />
                                                            {openFlags.length} Flag{openFlags.length > 1 ? "s" : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            0 flags (Clean)
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                                        <FileText size={12} className="text-slate-400" />
                                                        {docsCount} document{docsCount === 1 ? "" : "s"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Balance */}
                                            <td className="px-5 py-4.5 whitespace-nowrap font-extrabold text-slate-900 text-sm">
                                                ${Number(shop.wallet?.balance ?? 0).toFixed(2)}
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                    {shop.wallet?.payoutsEnabled ? "✓ Payouts Ready" : "Payouts Disabled"}
                                                </p>
                                            </td>

                                            {/* Activity counts */}
                                            <td className="px-5 py-4.5 whitespace-nowrap text-xs">
                                                <p className="font-bold text-slate-800">{shop._count.products} products</p>
                                                <p className="text-slate-500 font-medium">{shop._count.orders} orders</p>
                                            </td>

                                            {/* Actions 3-Dot Dropdown Trigger */}
                                            <td className="px-6 py-4.5 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => handleOpenDropdown(e, shop)}
                                                    className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
                                                        dropdownState?.shopId === shop.id
                                                            ? "bg-orange-50 text-orange-600 border-orange-300 shadow-xs"
                                                            : "text-slate-400 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200"
                                                    }`}
                                                    title="Open actions menu"
                                                >
                                                    <MoreVertical size={18} />
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

            {/* Pagination Bar Matching Users & Access */}
            {data && data.total > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
                    <div>
                        Showing <span className="font-extrabold text-slate-900">{((page - 1) * limit) + 1}</span> to{" "}
                        <span className="font-extrabold text-slate-900">{Math.min(page * limit, data.total)}</span> of{" "}
                        <span className="font-extrabold text-slate-900">{data.total.toLocaleString()}</span> shops
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 text-slate-700 transition-all font-bold cursor-pointer"
                        >
                            <ChevronsLeft size={14} />
                            First
                        </button>

                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 text-slate-700 transition-all font-bold cursor-pointer"
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>

                        <div className="flex items-center gap-1 mx-1.5">
                            {renderPaginationNumbers()}
                        </div>

                        <button
                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            disabled={page >= data.totalPages}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 text-slate-700 transition-all font-bold cursor-pointer"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>

                        <button
                            onClick={() => setPage(data.totalPages)}
                            disabled={page >= data.totalPages}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 text-slate-700 transition-all font-bold cursor-pointer"
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
                        className="z-50 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 text-left text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150"
                    >
                        {/* Primary Inspection */}
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    const sId = dropdownState.shop.id;
                                    setDropdownState(null);
                                    navigate(`/superadmin/shops/${sId}`);
                                }}
                                className="w-full px-4 py-2.5 text-slate-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 font-semibold transition-colors cursor-pointer"
                            >
                                <Eye size={16} className="text-slate-400" />
                                <span>Command Center & Review</span>
                            </button>
                            <button
                                onClick={() => {
                                    const sId = dropdownState.shop.id;
                                    setDropdownState(null);
                                    navigate(`/superadmin/shops/${sId}?tab=reviews`);
                                }}
                                className="w-full px-4 py-2.5 text-slate-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 font-semibold transition-colors cursor-pointer"
                            >
                                <Star size={16} className="text-amber-500 fill-amber-500" />
                                <span>Customer Reviews & Ratings</span>
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
                                    className="w-full px-4 py-2.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-3 font-bold transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span>Quick Approve Application</span>
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
                                    className="w-full px-4 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-3 font-bold transition-colors cursor-pointer"
                                >
                                    <XCircle size={16} className="text-rose-500" />
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
                                    className="w-full px-4 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-3 font-bold transition-colors cursor-pointer"
                                >
                                    <Ban size={16} className="text-rose-500" />
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
                                    className="w-full px-4 py-2.5 text-indigo-700 hover:bg-indigo-50 flex items-center gap-3 font-bold transition-colors cursor-pointer"
                                >
                                    <RotateCcw size={16} className="text-indigo-500" />
                                    <span>Reopen / Restore Store</span>
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
                                className="w-full px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-semibold transition-colors cursor-pointer"
                            >
                                <ShieldAlert size={16} className="text-rose-500" />
                                <span>Flag Compliance Risk</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modal: Quick Approve Shop */}
            {approveModalShop && (
                <ModalPortal onClose={() => setApproveModalShop(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setApproveModalShop(null); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                                        <CheckCircle2 size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Approve Shop Application</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Activate merchant trading for {approveModalShop.profile?.name || approveModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setApproveModalShop(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs">
                                <p className="font-bold">Approval Consequences:</p>
                                <ul className="list-disc list-inside space-y-1 text-emerald-800">
                                    <li>Shop status will switch to <strong>ACTIVE</strong> immediately.</li>
                                    <li>All approved catalog products will become visible on the public marketplace.</li>
                                    <li>Owner will be notified that store trading is enabled.</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Approval Note (Optional)
                                </label>
                                <textarea
                                    value={approvalNote}
                                    onChange={(e) => setApprovalNote(e.target.value)}
                                    placeholder="Verification confirmation details..."
                                    rows={2}
                                    className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setApproveModalShop(null)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {approveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
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
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setRejectModalShop(null); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                                        <XCircle size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Reject Shop Application</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Decline registration for {rejectModalShop.profile?.name || rejectModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setRejectModalShop(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Primary Rejection Reason
                                    </label>
                                    <select
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
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

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Detailed Feedback for Merchant
                                    </label>
                                    <textarea
                                        value={rejectionNotes}
                                        onChange={(e) => setRejectionNotes(e.target.value)}
                                        placeholder="Provide clear steps for how merchant can correct submission..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setRejectModalShop(null)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {rejectMutation.isPending && <Loader2 size={14} className="animate-spin" />}
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
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setSuspendModalShop(null); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                                        <Ban size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Suspend Merchant Trading</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Disable storefront for {suspendModalShop.profile?.name || suspendModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSuspendModalShop(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Suspension Reason
                                    </label>
                                    <select
                                        value={suspensionReason}
                                        onChange={(e) => setSuspensionReason(e.target.value)}
                                        className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
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

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Internal Admin Notes & Context
                                    </label>
                                    <textarea
                                        value={suspensionNotes}
                                        onChange={(e) => setSuspensionNotes(e.target.value)}
                                        placeholder="Details regarding incident or investigation..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setSuspendModalShop(null)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSuspend}
                                    disabled={suspendMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {suspendMutation.isPending && <Loader2 size={14} className="animate-spin" />}
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
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setReopenModalShop(null); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                                        <RotateCcw size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Reopen Shop / Restore Status</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Restore access for {reopenModalShop.profile?.name || reopenModalShop.slug}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setReopenModalShop(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Target Status
                                    </label>
                                    <select
                                        value={targetReopenStatus}
                                        onChange={(e) => setTargetReopenStatus(e.target.value as any)}
                                        className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                                    >
                                        <option value="ACTIVE">ACTIVE (Storefront immediately visible & live)</option>
                                        <option value="PENDING">PENDING (Place back in onboarding review queue)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Reopening Justification
                                    </label>
                                    <textarea
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setReopenModalShop(null)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReopen}
                                    disabled={reopenMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {reopenMutation.isPending && <Loader2 size={14} className="animate-spin" />}
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
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setRiskModalShop(null); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                                        <ShieldAlert size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Attach Compliance Risk Flag</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Flag {riskModalShop.profile?.name || riskModalShop.slug} for internal investigation
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setRiskModalShop(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddRiskFlag} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Risk Flag Category
                                    </label>
                                    <select
                                        value={riskFlagValue}
                                        onChange={(e) => {
                                            setRiskFlagValue(e.target.value);
                                            const found = PRESET_RISK_FLAGS.find((f) => f.flag === e.target.value);
                                            if (found) setRiskSeverityValue(found.severity as any);
                                        }}
                                        className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                                    >
                                        {PRESET_RISK_FLAGS.map((f) => (
                                            <option key={f.flag} value={f.flag}>
                                                {f.label} ({f.severity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Risk Severity Level
                                    </label>
                                    <select
                                        value={riskSeverityValue}
                                        onChange={(e) => setRiskSeverityValue(e.target.value as any)}
                                        className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                                    >
                                        <option value="CRITICAL">CRITICAL (Deducts 40 pts from Health Score)</option>
                                        <option value="HIGH">HIGH (Deducts 25 pts from Health Score)</option>
                                        <option value="MEDIUM">MEDIUM (Deducts 15 pts from Health Score)</option>
                                        <option value="LOW">LOW (Deducts 5 pts from Health Score)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Investigation Context / Notes
                                    </label>
                                    <textarea
                                        value={riskDescription}
                                        onChange={(e) => setRiskDescription(e.target.value)}
                                        placeholder="Explain why this merchant was flagged..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setRiskModalShop(null)}
                                        className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addRiskFlagMutation.isPending}
                                        className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                    >
                                        {addRiskFlagMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                        Attach Risk Flag
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
