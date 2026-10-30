import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Store,
    User,
    Building2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    ExternalLink,
    Plus,
    Trash2,
    RotateCcw,
    Lock,
    Check,
    X,
    MessageSquare,
    ShieldAlert,
    Eye,
    EyeOff,
    MapPin,
    Hash,
    Star,
    Search,
    ChevronDown,
    ListChecks,
    Phone,
    DollarSign,
    Package,
    ShoppingBag,
    Users,
    ZoomIn,
    Ban,
} from "lucide-react";
import {
    useAdminShop,
    useApproveShop,
    useRejectShop,
    useSuspendShop,
    useCloseShop,
    useReopenShop,
    useUpdateShopVerification,
    useAddShopDocument,
    useUpdateShopDocumentStatus,
    useDeleteShopDocument,
    useAddShopAdminNote,
    useAddShopRiskFlag,
    useResolveShopRiskFlag,
    useAdminReviews,
    useToggleReviewVisibility,
    useAdminDeleteReview,
} from "@/features/admin/admin.hooks";
import { toast } from "@/components/ui/toast";
import { ModalPortal } from "@/components/ui/ds-components";
import { ShopStatusBadge, VerificationBadge, HealthScorePill } from "./AdminShopsPage";
import type { LegalDocumentType, VerificationStatus, RiskSeverity } from "@/features/admin/admin.api";

const PRESET_RISK_FLAGS: { flag: string; label: string; severity: RiskSeverity }[] = [
    { flag: "MISMATCHED_TAX_ID", label: "Mismatched Tax ID / Legal Entity", severity: "HIGH" },
    { flag: "UNVERIFIED_OWNER_KYC", label: "Unverified Owner KYC / Identity", severity: "HIGH" },
    { flag: "SUSPICIOUS_HIGH_CHARGEBACKS", label: "Suspicious Chargebacks / Disputes", severity: "CRITICAL" },
    { flag: "UNVERIFIABLE_ADDRESS", label: "Address Verification Failure", severity: "MEDIUM" },
    { flag: "PROHIBITED_GOODS_SUSPICION", label: "Suspected Prohibited Goods / Policy", severity: "CRITICAL" },
    { flag: "INCOMPLETE_COMPLIANCE_DOCS", label: "Missing Required Compliance Documents", severity: "MEDIUM" },
    { flag: "MANUAL_COMPLIANCE_HOLD", label: "Manual Hold by Super Admin", severity: "LOW" },
];

export const AdminShopDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialTab = searchParams.get("tab") as any;
    const [activeTab, setActiveTab] = useState<
        "overview" | "verification" | "kyc" | "documents" | "risk" | "notes" | "reviews"
    >(
        initialTab && ["overview", "verification", "kyc", "documents", "risk", "notes", "reviews"].includes(initialTab)
            ? initialTab
            : "overview"
    );

    // Mobile Section Selector Dropdown
    const [openMobileNav, setOpenMobileNav] = useState(false);

    // Dialog state
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalNote, setApprovalNote] = useState("");

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("Incomplete or unverifiable legal documentation");
    const [rejectionNotes, setRejectionNotes] = useState("");

    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState("Policy / terms of service violation");
    const [suspensionNotes, setSuspensionNotes] = useState("");

    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closureReason, setClosureReason] = useState("Merchant requested closure or terms violation");
    const [closureNotes, setClosureNotes] = useState("");

    const [showReopenModal, setShowReopenModal] = useState(false);
    const [reopenReason, setReopenReason] = useState("All compliance & verification requirements fulfilled");
    const [targetReopenStatus, setTargetReopenStatus] = useState<"ACTIVE" | "PENDING">("ACTIVE");

    // Document modals
    const [showAddDocModal, setShowAddDocModal] = useState(false);
    const [newDocType, setNewDocType] = useState<LegalDocumentType>("CERTIFICATE_OF_INCORPORATION");
    const [newDocName, setNewDocName] = useState("");
    const [newDocUrl, setNewDocUrl] = useState("");

    const [docReviewModal, setDocReviewModal] = useState<{ id: string; name: string } | null>(null);
    const [docReviewStatus, setDocReviewStatus] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
    const [docRejectionReason, setDocRejectionReason] = useState("");

    // Risk flag modals
    const [showAddRiskModal, setShowAddRiskModal] = useState(false);
    const [newRiskFlag, setNewRiskFlag] = useState(PRESET_RISK_FLAGS[0].flag);
    const [newRiskSeverity, setNewRiskSeverity] = useState<RiskSeverity>("HIGH");
    const [newRiskDescription, setNewRiskDescription] = useState("");

    const [resolveFlagModal, setResolveFlagModal] = useState<{ id: string; flag: string } | null>(null);
    const [resolveNotes, setResolveNotes] = useState("");

    // Admin note form
    const [newAdminNote, setNewAdminNote] = useState("");

    // Field-level verification modals (Tax ID, Address, KYC)
    const [fieldVerifyModal, setFieldVerifyModal] = useState<{
        field: "taxId" | "address" | "kyc" | "business";
        title: string;
        currentStatus: string;
    } | null>(null);
    const [fieldTargetStatus, setFieldTargetStatus] = useState<VerificationStatus>("VERIFIED");
    const [fieldNotes, setFieldNotes] = useState("");

    // Image Zoom modal
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

    // Reviews state
    const [reviewSearch, setReviewSearch] = useState("");
    const [reviewSearchInput, setReviewSearchInput] = useState("");
    const [reviewRatingFilter, setReviewRatingFilter] = useState<number | undefined>(undefined);
    const [reviewVisibilityFilter, setReviewVisibilityFilter] = useState<boolean | undefined>(undefined);
    const [reviewPage, setReviewPage] = useState(1);

    const { data: shop, isLoading, isError, refetch } = useAdminShop(id!);

    const approveMutation = useApproveShop();
    const rejectMutation = useRejectShop();
    const suspendMutation = useSuspendShop();
    const closeMutation = useCloseShop();
    const reopenMutation = useReopenShop();
    const updateVerificationMutation = useUpdateShopVerification();
    const addDocMutation = useAddShopDocument();
    const updateDocMutation = useUpdateShopDocumentStatus();
    const deleteDocMutation = useDeleteShopDocument();
    const addNoteMutation = useAddShopAdminNote();
    const addRiskMutation = useAddShopRiskFlag();
    const resolveRiskMutation = useResolveShopRiskFlag();

    const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useAdminReviews({
        shopId: id,
        search: reviewSearch || undefined,
        rating: reviewRatingFilter,
        isVisible: reviewVisibilityFilter,
        page: reviewPage,
        limit: 10,
    });

    const toggleReviewVisibilityMutation = useToggleReviewVisibility();
    const deleteReviewMutation = useAdminDeleteReview();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-500">
                <Loader2 className="animate-spin text-orange-500" size={38} />
                <p className="text-sm font-semibold">Loading merchant verification profile & compliance status...</p>
            </div>
        );
    }

    if (isError || !shop) {
        return (
            <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center max-w-lg mx-auto mt-12 space-y-4 shadow-sm">
                <div className="size-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Merchant Store Not Found</h3>
                <p className="text-sm text-slate-500">The requested store profile could not be located or retrieved.</p>
                <button
                    onClick={() => navigate("/superadmin/shops")}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                    Back to Store List
                </button>
            </div>
        );
    }

    const legal = shop.legalInfo;
    const health = shop.healthScoreMeta;
    const checklist = shop.checklist || [];
    const openFlags = (shop.riskFlags || []).filter((f: any) => !f.resolved);

    // Handlers
    const handleApprove = async () => {
        try {
            await approveMutation.mutateAsync({ id: shop.id, notes: approvalNote.trim() || undefined });
            toast.add({ title: "Shop Approved", description: "Merchant is now active and permitted to trade.", type: "success" });
            setShowApproveModal(false);
            setApprovalNote("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Approval Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleReject = async () => {
        try {
            await rejectMutation.mutateAsync({ id: shop.id, reason: rejectionReason, notes: rejectionNotes.trim() || undefined });
            toast.add({ title: "Shop Application Rejected", type: "success" });
            setShowRejectModal(false);
            setRejectionNotes("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Rejection Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleSuspend = async () => {
        try {
            await suspendMutation.mutateAsync({ id: shop.id, reason: suspensionReason, notes: suspensionNotes.trim() || undefined });
            toast.add({ title: "Shop Suspended", description: "Merchant trading has been halted.", type: "success" });
            setShowSuspendModal(false);
            setSuspensionNotes("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Suspension Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleClose = async () => {
        try {
            await closeMutation.mutateAsync({ id: shop.id, reason: closureReason, notes: closureNotes.trim() || undefined });
            toast.add({ title: "Shop Closed Permanently", type: "success" });
            setShowCloseModal(false);
            setClosureNotes("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Closure Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleReopen = async () => {
        try {
            await reopenMutation.mutateAsync({ id: shop.id, reason: reopenReason, targetStatus: targetReopenStatus });
            toast.add({ title: "Shop Reopened", description: `Restored to ${targetReopenStatus} status.`, type: "success" });
            setShowReopenModal(false);
            refetch();
        } catch (err: any) {
            toast.add({ title: "Reopen Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleFieldVerificationSave = async () => {
        if (!fieldVerifyModal) return;
        try {
            const payload: any = {};
            if (fieldVerifyModal.field === "taxId") {
                payload.taxIdStatus = fieldTargetStatus;
                payload.taxIdNotes = fieldNotes.trim();
            } else if (fieldVerifyModal.field === "address") {
                payload.addressVerificationStatus = fieldTargetStatus;
                payload.addressVerificationNotes = fieldNotes.trim();
            } else if (fieldVerifyModal.field === "kyc") {
                payload.ownerKycStatus = fieldTargetStatus;
                payload.ownerKycNotes = fieldNotes.trim();
            } else if (fieldVerifyModal.field === "business") {
                payload.businessVerificationStatus = fieldTargetStatus;
            }

            await updateVerificationMutation.mutateAsync({ id: shop.id, data: payload });
            toast.add({ title: "Verification Updated", type: "success" });
            setFieldVerifyModal(null);
            setFieldNotes("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Update Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDocName.trim() || !newDocUrl.trim()) return;
        try {
            await addDocMutation.mutateAsync({
                shopId: shop.id,
                data: {
                    type: newDocType,
                    name: newDocName.trim(),
                    fileUrl: newDocUrl.trim(),
                },
            });
            toast.add({ title: "Document Uploaded", description: "Saved to legal vault.", type: "success" });
            setShowAddDocModal(false);
            setNewDocName("");
            setNewDocUrl("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Upload Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleReviewDocument = async () => {
        if (!docReviewModal) return;
        try {
            await updateDocMutation.mutateAsync({
                documentId: docReviewModal.id,
                status: docReviewStatus,
                rejectionReason: docReviewStatus === "REJECTED" ? docRejectionReason.trim() : undefined,
            });
            toast.add({ title: "Document Status Saved", type: "success" });
            setDocReviewModal(null);
            setDocRejectionReason("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Review Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm("Are you sure you want to remove this document from the vault?")) return;
        try {
            await deleteDocMutation.mutateAsync({ documentId: docId });
            toast.add({ title: "Document Removed", type: "success" });
            refetch();
        } catch (err: any) {
            toast.add({ title: "Delete Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleAddRiskFlag = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addRiskMutation.mutateAsync({
                shopId: shop.id,
                data: {
                    flag: newRiskFlag,
                    severity: newRiskSeverity,
                    description: newRiskDescription.trim() || undefined,
                },
            });
            toast.add({ title: "Risk Flag Attached", type: "success" });
            setShowAddRiskModal(false);
            setNewRiskDescription("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Failed to add risk flag", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleResolveRiskFlag = async () => {
        if (!resolveFlagModal) return;
        try {
            await resolveRiskMutation.mutateAsync({
                flagId: resolveFlagModal.id,
                notes: resolveNotes.trim() || undefined,
            });
            toast.add({ title: "Risk Flag Resolved", type: "success" });
            setResolveFlagModal(null);
            setResolveNotes("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Resolution Failed", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleAddAdminNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminNote.trim()) return;
        try {
            await addNoteMutation.mutateAsync({
                shopId: shop.id,
                content: newAdminNote.trim(),
            });
            toast.add({ title: "Note Saved", description: "Internal compliance note added to log.", type: "success" });
            setNewAdminNote("");
            refetch();
        } catch (err: any) {
            toast.add({ title: "Failed to save note", description: err?.response?.data?.message ?? "Error occurred", type: "error" });
        }
    };

    const handleToggleReviewVisibility = async (reviewId: string, currentVisible: boolean) => {
        try {
            await toggleReviewVisibilityMutation.mutateAsync({ id: reviewId, isVisible: !currentVisible });
            toast.add({
                title: !currentVisible ? "Review is now visible" : "Review hidden from storefront",
                type: "success",
            });
            refetchReviews();
        } catch (err: any) {
            toast.add({
                title: "Failed to update review visibility",
                description: err?.response?.data?.message || "Error occurred",
                type: "error",
            });
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm("Are you sure you want to permanently delete this customer review? This action cannot be undone.")) return;
        try {
            await deleteReviewMutation.mutateAsync(reviewId);
            toast.add({ title: "Review Deleted", type: "success" });
            refetchReviews();
        } catch (err: any) {
            toast.add({
                title: "Failed to delete review",
                description: err?.response?.data?.message || "Error occurred",
                type: "error",
            });
        }
    };

    // Navigation sections configuration
    const NAV_SECTIONS = [
        { id: "overview", label: "Overview & Checklist", icon: ListChecks, badge: `${checklist.filter((i: any) => i.status === "COMPLETED").length}/8 Ready`, badgeColor: "bg-emerald-100 text-emerald-800" },
        { id: "verification", label: "Business & Tax ID", icon: Building2, badge: legal?.businessVerificationStatus || "UNVERIFIED", badgeColor: legal?.businessVerificationStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800" },
        { id: "kyc", label: "Owner Identity (KYC)", icon: User, badge: legal?.ownerKycStatus || "UNVERIFIED", badgeColor: legal?.ownerKycStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800" },
        { id: "documents", label: "Legal Documents Vault", icon: FileText, badge: `${legal?.documents?.length ?? 0} Docs`, badgeColor: "bg-slate-100 text-slate-800" },
        { id: "risk", label: "Risk Flags & Holds", icon: ShieldAlert, badge: openFlags.length > 0 ? `${openFlags.length} Flags` : "Clean", badgeColor: openFlags.length > 0 ? "bg-rose-100 text-rose-800 font-bold" : "bg-emerald-100 text-emerald-800" },
        { id: "notes", label: "Audit Notes & Timeline", icon: MessageSquare, badge: `${shop.adminNotesList?.length ?? 0} Notes`, badgeColor: "bg-slate-100 text-slate-800" },
        { id: "reviews", label: "Customer Reviews", icon: Star, badge: reviewsData ? `${reviewsData.total} Reviews` : "Reviews", badgeColor: "bg-amber-100 text-amber-800" },
    ];

    const currentSection = NAV_SECTIONS.find((s) => s.id === activeTab) || NAV_SECTIONS[0];

    return (
        <div className="space-y-6 pb-16">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                    onClick={() => navigate("/superadmin/shops")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/90 px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer w-fit"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Stores Catalog</span>
                </button>
                <div className="text-xs font-mono font-medium text-slate-500">
                    Store ID: <span className="font-bold text-slate-700">{shop.id}</span>
                </div>
            </div>

            {/* Alert Banners (if Rejected, Suspended, or Closed) */}
            {shop.status === "REJECTED" && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 flex items-start gap-4">
                    <XCircle size={24} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-950 space-y-1">
                        <p className="font-extrabold text-sm text-rose-900">Application Has Been Rejected</p>
                        <p className="font-semibold text-rose-800">
                            <strong>Reason:</strong> {shop.rejectionReason || "Incomplete compliance requirements"}
                        </p>
                        {shop.rejectionNotes && (
                            <p className="text-rose-700">
                                <strong>Feedback provided:</strong> {shop.rejectionNotes}
                            </p>
                        )}
                        {shop.rejectedAt && (
                            <p className="text-rose-600 text-[11px] pt-1 font-mono">
                                Action recorded on {new Date(shop.rejectedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {shop.status === "SUSPENDED" && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 flex items-start gap-4">
                    <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-950 space-y-1">
                        <p className="font-extrabold text-sm text-rose-900">Store Suspended From Customer Trading</p>
                        <p className="font-semibold text-rose-800">
                            <strong>Reason:</strong> {shop.suspensionReason || "Terms of service or compliance violation"}
                        </p>
                        {shop.suspensionNotes && (
                            <p className="text-rose-700">
                                <strong>Context:</strong> {shop.suspensionNotes}
                            </p>
                        )}
                        {shop.suspendedAt && (
                            <p className="text-rose-600 text-[11px] pt-1 font-mono">
                                Suspended on {new Date(shop.suspendedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {shop.status === "CLOSED" && (
                <div className="bg-slate-100 border-2 border-slate-300 rounded-3xl p-5 flex items-start gap-4">
                    <Lock size={24} className="text-slate-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-800 space-y-1">
                        <p className="font-extrabold text-sm text-slate-900">Store Permanently Closed</p>
                        <p className="font-medium text-slate-700">
                            <strong>Closure Reason:</strong> {shop.closureReason || "Voluntary or administrative closure"}
                        </p>
                    </div>
                </div>
            )}

            {/* Merchant Command Center Top Bar */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Identity */}
                    <div className="flex items-start gap-4">
                        {shop.profile?.logo ? (
                            <img
                                src={shop.profile.logo}
                                alt=""
                                className="size-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            />
                        ) : (
                            <div className="size-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black shadow-xs">
                                <Store size={32} />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {shop.profile?.name || shop.slug}
                                </h1>
                                <ShopStatusBadge status={shop.status} />
                                <VerificationBadge status={legal?.businessVerificationStatus} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap font-medium">
                                <span className="font-mono text-slate-700 font-semibold">/{shop.slug}</span>
                                <span>•</span>
                                <span>Created {new Date(shop.createdAt).toLocaleDateString()}</span>
                                {legal?.legalBusinessName && (
                                    <>
                                        <span>•</span>
                                        <span className="font-bold text-slate-700">{legal.legalBusinessName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Workflow Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {shop.status === "PENDING" && (
                            <>
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <CheckCircle2 size={16} />
                                    <span>Approve Application</span>
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                >
                                    <XCircle size={16} />
                                    <span>Reject Application</span>
                                </button>
                            </>
                        )}

                        {shop.status === "ACTIVE" && (
                            <button
                                onClick={() => setShowSuspendModal(true)}
                                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                                <Ban size={16} />
                                <span>Suspend Store</span>
                            </button>
                        )}

                        {(shop.status === "SUSPENDED" || shop.status === "CLOSED" || shop.status === "REJECTED") && (
                            <button
                                onClick={() => setShowReopenModal(true)}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                            >
                                <RotateCcw size={16} />
                                <span>Reopen / Restore</span>
                            </button>
                        )}

                        <button
                            onClick={() => setShowAddRiskModal(true)}
                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                            <ShieldAlert size={16} />
                            <span>Flag Risk</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TWO-COLUMN COMMAND CENTER LAYOUT (Solves the "too many horizontal tabs" issue!) */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* ─────────────────────────────────────────────────────────────
                    LEFT SIDEBAR: Store Summary & Vertical Navigation Rail
                ───────────────────────────────────────────────────────────── */}
                <div className="w-full lg:w-80 shrink-0 space-y-5">
                    {/* Mobile Section Dropdown (Phone Comfort) */}
                    <div className="lg:hidden bg-white rounded-2xl border border-slate-200 p-3 relative">
                        <button
                            type="button"
                            onClick={() => setOpenMobileNav(!openMobileNav)}
                            className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        >
                            <div className="flex items-center gap-2">
                                <currentSection.icon size={16} className="text-orange-500" />
                                <span>Section: {currentSection.label}</span>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {openMobileNav && (
                            <div className="mt-2 space-y-1">
                                {NAV_SECTIONS.map((sec) => (
                                    <button
                                        key={sec.id}
                                        onClick={() => {
                                            setActiveTab(sec.id as any);
                                            setOpenMobileNav(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            activeTab === sec.id
                                                ? "bg-orange-50 text-orange-800 border border-orange-200"
                                                : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <sec.icon size={15} />
                                            <span>{sec.label}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sec.badgeColor}`}>
                                            {sec.badge}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Vertical Navigation Menu */}
                    <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/90 shadow-sm p-3.5 space-y-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-2">
                            Store Sections & Audits
                        </p>
                        {NAV_SECTIONS.map((sec) => {
                            const isActive = activeTab === sec.id;
                            const Icon = sec.icon;
                            return (
                                <button
                                    key={sec.id}
                                    onClick={() => setActiveTab(sec.id as any)}
                                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                        isActive
                                            ? "bg-gradient-to-r from-orange-50 to-amber-50/60 text-orange-950 border border-orange-200/80 shadow-2xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={17} className={isActive ? "text-orange-600" : "text-slate-400"} />
                                        <span>{sec.label}</span>
                                    </div>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${sec.badgeColor}`}>
                                        {sec.badge}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Left Column: Compact Health & Risk Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                Health Score Matrix
                            </h3>
                            <HealthScorePill score={health?.score} />
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Visual Gauge */}
                            <div className="relative size-20 shrink-0 flex items-center justify-center">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-slate-100"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className={
                                            (health?.score ?? 70) >= 90
                                                ? "text-emerald-500"
                                                : (health?.score ?? 70) >= 75
                                                ? "text-blue-500"
                                                : (health?.score ?? 70) >= 50
                                                ? "text-amber-500"
                                                : "text-rose-500"
                                        }
                                        strokeDasharray={`${health?.score ?? 70}, 100`}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-slate-900">{health?.score ?? 70}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">/ 100</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900">{health?.tierLabel}</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Computed from tax validation, KYC verification, open risk flags, and document compliance.
                                </p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Active Risk Flags</span>
                            <span className={`font-bold ${openFlags.length > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                                {openFlags.length > 0 ? `${openFlags.length} Flag(s) Active` : "0 (Clean Record)"}
                            </span>
                        </div>
                    </div>

                    {/* Left Column: Beneficial Owner Identity Snippet */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                Beneficial Owner
                            </h3>
                            <VerificationBadge status={legal?.ownerKycStatus} />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <div className="size-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                                {shop.owner.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">{shop.owner.name}</p>
                                <p className="text-slate-500 font-medium">{shop.owner.email}</p>
                            </div>
                        </div>
                        {shop.profile?.phone && (
                            <div className="flex items-center gap-2 text-slate-600 font-medium pt-1">
                                <Phone size={13} className="text-slate-400" />
                                <span>{shop.profile.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    RIGHT COLUMN: Dynamic Focused Content Canvas
                ───────────────────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-6 w-full">
                    {/* SECTION 1: Overview & Onboarding Checklist */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Checklist Card */}
                            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <ListChecks className="text-orange-500" size={20} />
                                            Shop Onboarding & Verification Checklist
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {checklist.filter((i: any) => i.status === "COMPLETED").length} of 8 requirements satisfied
                                        </p>
                                    </div>
                                    <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-orange-50 text-orange-800 border border-orange-200 w-fit">
                                        {Math.round((checklist.filter((i: any) => i.status === "COMPLETED").length / 8) * 100)}% Ready
                                    </span>
                                </div>

                                {/* Checklist Grid (Spacious, Clear Text, No Tiny Unreadable Fonts) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                                    {checklist.map((item: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                                                item.status === "COMPLETED"
                                                    ? "bg-emerald-50/50 border-emerald-200"
                                                    : item.status === "FAILED"
                                                    ? "bg-rose-50/50 border-rose-200"
                                                    : "bg-slate-50/70 border-slate-200"
                                            }`}
                                        >
                                            <div
                                                className={`size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                                    item.status === "COMPLETED"
                                                        ? "bg-emerald-600 text-white"
                                                        : item.status === "FAILED"
                                                        ? "bg-rose-600 text-white"
                                                        : "bg-slate-200 text-slate-600"
                                                }`}
                                            >
                                                {item.status === "COMPLETED" ? (
                                                    <Check size={14} />
                                                ) : item.status === "FAILED" ? (
                                                    <X size={14} />
                                                ) : (
                                                    <Clock size={14} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                                                    <span
                                                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                                            item.status === "COMPLETED"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : item.status === "FAILED"
                                                                ? "bg-rose-100 text-rose-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Store Activity Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 space-y-1">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">Wallet Balance</span>
                                        <DollarSign size={16} />
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">
                                        ${Number(shop.wallet?.balance ?? 0).toFixed(2)}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500">
                                        {shop.wallet?.payoutsEnabled ? "✓ Payouts enabled" : "Payouts not linked"}
                                    </p>
                                </div>

                                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 space-y-1">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">Catalog Products</span>
                                        <Package size={16} />
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{shop._count.products}</p>
                                    <p className="text-xs font-medium text-slate-500">Listed for purchase</p>
                                </div>

                                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 space-y-1">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                                        <ShoppingBag size={16} />
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{shop._count.orders}</p>
                                    <p className="text-xs font-medium text-slate-500">Customer transactions</p>
                                </div>

                                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 space-y-1">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">Staff / Team</span>
                                        <Users size={16} />
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{shop._count.employees ?? 0}</p>
                                    <p className="text-xs font-medium text-slate-500">Store team members</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: Business & Tax Registration */}
                    {activeTab === "verification" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Tax ID Card */}
                            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                                            <Hash size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Tax ID / EIN Verification</h3>
                                            <p className="text-xs text-slate-500">Business taxation authority identifier</p>
                                        </div>
                                    </div>
                                    <VerificationBadge status={legal?.taxIdStatus} />
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Tax ID / EIN:</span>
                                        <span className="font-mono text-sm font-bold text-slate-900">{legal?.taxId || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Legal Business Name:</span>
                                        <span className="font-bold text-slate-800">{legal?.legalBusinessName || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Entity Classification:</span>
                                        <span className="font-bold font-mono text-slate-700">{legal?.entityType || "Unspecified"}</span>
                                    </div>
                                    {legal?.taxIdNotes && (
                                        <div className="text-slate-600 pt-2 border-t border-slate-200">
                                            <strong>Audit Note:</strong> {legal.taxIdNotes}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        setFieldVerifyModal({ field: "taxId", title: "Tax ID / EIN Verification", currentStatus: legal?.taxIdStatus || "UNVERIFIED" });
                                        setFieldTargetStatus("VERIFIED");
                                        setFieldNotes(legal?.taxIdNotes || "");
                                    }}
                                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 shadow-sm shadow-orange-100"
                                >
                                    Update Tax ID Standing
                                </button>
                            </div>

                            {/* Business Address Card */}
                            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Physical Business Address</h3>
                                            <p className="text-xs text-slate-500">Official registered operating location</p>
                                        </div>
                                    </div>
                                    <VerificationBadge status={legal?.addressVerificationStatus} />
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Registered Address:</span>
                                        <span className="font-bold text-slate-800">{legal?.registeredAddress || shop.profile?.address || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">City / Location:</span>
                                        <span className="font-bold text-slate-800">{shop.profile?.city || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Country:</span>
                                        <span className="font-bold text-slate-800">{shop.profile?.country || "Not Provided"}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setFieldVerifyModal({ field: "address", title: "Business Address Verification", currentStatus: legal?.addressVerificationStatus || "UNVERIFIED" });
                                        setFieldTargetStatus("VERIFIED");
                                        setFieldNotes(legal?.addressVerificationNotes || "");
                                    }}
                                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
                                >
                                    Update Address Standing
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: Owner Identity & KYC */}
                    {activeTab === "kyc" && (
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <User className="text-orange-500" size={20} />
                                        Owner Identity & Beneficial KYC Audit
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Government-issued photo identification and AML clearance
                                    </p>
                                </div>
                                <VerificationBadge status={legal?.ownerKycStatus} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Beneficial Owner Name:</span>
                                        <span className="font-bold text-slate-900 text-sm">{shop.owner.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Account Email:</span>
                                        <span className="font-medium text-slate-700">{shop.owner.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Identity Document Type:</span>
                                        <span className="font-bold font-mono text-slate-800">{legal?.ownerIdType || "Not Specified"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Document Number:</span>
                                        <span className="font-bold font-mono text-slate-800">{legal?.ownerIdNumber || "Not Provided"}</span>
                                    </div>
                                    {legal?.ownerKycNotes && (
                                        <div className="pt-2 border-t border-slate-200 text-slate-600">
                                            <strong>KYC Notes:</strong> {legal.ownerKycNotes}
                                        </div>
                                    )}
                                </div>

                                {/* ID Card Previews */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Government ID Proof Uploads
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="border border-slate-200 rounded-2xl p-3 text-center bg-slate-50/50">
                                            <p className="text-xs font-semibold text-slate-700 mb-2">Front Side</p>
                                            {legal?.ownerIdCardFront ? (
                                                <button
                                                    onClick={() => setZoomImageUrl(legal.ownerIdCardFront!)}
                                                    className="relative group rounded-xl overflow-hidden border border-slate-200 block w-full"
                                                >
                                                    <img src={legal.ownerIdCardFront || undefined} alt="ID Front" className="w-full h-28 object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                        <ZoomIn size={20} />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                                                    No Upload
                                                </div>
                                            )}
                                        </div>

                                        <div className="border border-slate-200 rounded-2xl p-3 text-center bg-slate-50/50">
                                            <p className="text-xs font-semibold text-slate-700 mb-2">Back Side</p>
                                            {legal?.ownerIdCardBack ? (
                                                <button
                                                    onClick={() => setZoomImageUrl(legal.ownerIdCardBack!)}
                                                    className="relative group rounded-xl overflow-hidden border border-slate-200 block w-full"
                                                >
                                                    <img src={legal.ownerIdCardBack || undefined} alt="ID Back" className="w-full h-28 object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                        <ZoomIn size={20} />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                                                    No Upload
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setFieldVerifyModal({ field: "kyc", title: "Owner Identity & KYC", currentStatus: legal?.ownerKycStatus || "UNVERIFIED" });
                                    setFieldTargetStatus("VERIFIED");
                                    setFieldNotes(legal?.ownerKycNotes || "");
                                }}
                                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-orange-100"
                            >
                                Update Owner KYC Verification Status
                            </button>
                        </div>
                    )}

                    {/* SECTION 4: Legal Documents Vault */}
                    {activeTab === "documents" && (
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <FileText className="text-orange-500" size={20} />
                                        Legal Documents Vault
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Articles of incorporation, municipal permits, and compliance declarations
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddDocModal(true)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-100 cursor-pointer active:scale-95"
                                >
                                    <Plus size={14} />
                                    <span>Upload Document</span>
                                </button>
                            </div>

                            {(legal?.documents?.length ?? 0) === 0 ? (
                                <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-2">
                                    <FileText className="mx-auto size-12 opacity-30 text-orange-500" />
                                    <p className="font-bold text-slate-700 text-sm">No legal documents in vault</p>
                                    <p className="text-xs text-slate-400">Merchant has not yet uploaded compliance documents.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                                    {legal?.documents?.map((doc: any) => (
                                        <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase">
                                                            {doc.type.replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <VerificationBadge status={doc.status} />
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold inline-flex items-center gap-1"
                                                    title="Open file"
                                                >
                                                    <ExternalLink size={13} />
                                                    <span>View</span>
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setDocReviewModal({ id: doc.id, name: doc.name });
                                                        setDocReviewStatus("VERIFIED");
                                                        setDocRejectionReason("");
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                                                    title="Remove document"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION 5: Risk Flags & Holds */}
                    {activeTab === "risk" && (
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <ShieldAlert className="text-rose-600" size={20} />
                                        Compliance Risk Flags & Holds
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Active compliance audits, chargeback disputes, or administrative holds
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddRiskModal(true)}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <Plus size={14} />
                                    <span>Attach Risk Flag</span>
                                </button>
                            </div>

                            {openFlags.length === 0 ? (
                                <div className="p-14 text-center border border-dashed border-emerald-200 bg-emerald-50/30 rounded-2xl space-y-2">
                                    <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
                                    <p className="font-bold text-slate-900 text-sm">Clean Compliance Standing</p>
                                    <p className="text-xs text-slate-500">There are no active risk flags or compliance holds attached to this merchant.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {openFlags.map((flag: any) => (
                                        <div key={flag.id} className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-rose-900 text-sm">{flag.flag}</span>
                                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-200 text-rose-800 uppercase">
                                                        {flag.severity}
                                                    </span>
                                                </div>
                                                {flag.description && (
                                                    <p className="text-xs text-rose-800 mt-1">{flag.description}</p>
                                                )}
                                                <p className="text-[11px] text-rose-600 font-mono mt-1">
                                                    Reported on {new Date(flag.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setResolveFlagModal({ id: flag.id, flag: flag.flag });
                                                    setResolveNotes("");
                                                }}
                                                className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                                            >
                                                Mark Resolved
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION 6: Admin Audit Notes & Timeline */}
                    {activeTab === "notes" && (
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <MessageSquare className="text-orange-500" size={20} />
                                    Internal Compliance Notes & Timeline
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Confidential administrative notes visible strictly to Super Admins
                                </p>
                            </div>

                            {/* Post Note Form */}
                            <form onSubmit={handleAddAdminNote} className="space-y-3">
                                <textarea
                                    value={newAdminNote}
                                    onChange={(e) => setNewAdminNote(e.target.value)}
                                    placeholder="Add an internal observation, verification note, or investigation detail..."
                                    rows={3}
                                    className="w-full text-xs font-medium p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-slate-50/50"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={addNoteMutation.isPending || !newAdminNote.trim()}
                                        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-100 disabled:opacity-50 cursor-pointer"
                                    >
                                        {addNoteMutation.isPending ? "Saving..." : "Post Internal Note"}
                                    </button>
                                </div>
                            </form>

                            {/* Timeline Thread */}
                            {(shop.adminNotesList?.length ?? 0) === 0 ? (
                                <p className="text-xs text-slate-400 py-8 text-center border-t border-slate-100">
                                    No compliance notes logged yet.
                                </p>
                            ) : (
                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                    {shop.adminNotesList?.map((note: any) => (
                                        <div key={note.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-900">{note.adminName || "Super Admin"}</span>
                                                <span className="text-slate-400 text-[11px] font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION 7: Customer Reviews & Ratings */}
                    {activeTab === "reviews" && (
                        <div className="space-y-6">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Overall Rating Card */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-slate-900">Overall Rating</h3>
                                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                                Verified Reviews
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 my-2">
                                            <span className="text-4xl font-black text-slate-900">
                                                {reviewsData?.stats?.avgRating ? reviewsData.stats.avgRating.toFixed(1) : "0.0"}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            size={18}
                                                            className={
                                                                s <= Math.round(reviewsData?.stats?.avgRating || 0)
                                                                    ? "text-amber-400 fill-amber-400"
                                                                    : "text-slate-200 fill-slate-200"
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                                    From {reviewsData?.total ?? 0} total review{reviewsData?.total === 1 ? "" : "s"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>Status</span>
                                        <span className="font-bold text-emerald-700">
                                            {reviewsData?.stats?.visibleCount ?? 0} Visible / {reviewsData?.stats?.hiddenCount ?? 0} Hidden
                                        </span>
                                    </div>
                                </div>

                                {/* Rating Breakdown Bars */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-2">
                                    <h3 className="text-sm font-bold text-slate-900 mb-3">Rating Breakdown</h3>
                                    {[5, 4, 3, 2, 1].map((r) => {
                                        const count = (reviewsData?.reviews || []).filter((item) => item.rating === r).length;
                                        const total = reviewsData?.reviews?.length || 0;
                                        const pct = total > 0 ? (count / total) * 100 : 0;
                                        return (
                                            <div key={r} className="flex items-center gap-2 text-xs">
                                                <span className="w-8 font-bold text-slate-700 flex items-center gap-0.5">
                                                    {r} <Star size={11} className="text-amber-400 fill-amber-400" />
                                                </span>
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-6 text-right text-slate-400 font-mono text-[11px]">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Moderation Notice & Link */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2">Review Moderation Policy</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Super admins can hide fraudulent, defamatory, or abusive reviews. Hidden reviews are immediately removed from customer product pages.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => navigate(`/superadmin/reviews?search=${encodeURIComponent(shop.profile?.name || shop.slug)}`)}
                                            className="w-full py-2.5 px-3 bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <ExternalLink size={13} />
                                            <span>Open in Reviews Hub</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Filter & Search Bar */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setReviewSearch(reviewSearchInput.trim());
                                        setReviewPage(1);
                                    }}
                                    className="flex gap-2 w-full md:w-80"
                                >
                                    <div className="relative flex-1">
                                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search comment or customer..."
                                            value={reviewSearchInput}
                                            onChange={(e) => setReviewSearchInput(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                        Search
                                    </button>
                                </form>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                                        <button
                                            onClick={() => { setReviewRatingFilter(undefined); setReviewPage(1); }}
                                            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                                reviewRatingFilter === undefined ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
                                            }`}
                                        >
                                            All
                                        </button>
                                        {[5, 4, 3, 2, 1].map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => { setReviewRatingFilter(st); setReviewPage(1); }}
                                                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-0.5 transition-all cursor-pointer ${
                                                    reviewRatingFilter === st ? "bg-amber-400 text-white shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
                                                }`}
                                            >
                                                <span>{st}</span>
                                                <Star size={10} className="fill-current" />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                                        <button
                                            onClick={() => { setReviewVisibilityFilter(undefined); setReviewPage(1); }}
                                            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                                reviewVisibilityFilter === undefined ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => { setReviewVisibilityFilter(true); setReviewPage(1); }}
                                            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                                reviewVisibilityFilter === true ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
                                            }`}
                                        >
                                            Visible
                                        </button>
                                        <button
                                            onClick={() => { setReviewVisibilityFilter(false); setReviewPage(1); }}
                                            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                                reviewVisibilityFilter === false ? "bg-rose-600 text-white shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
                                            }`}
                                        >
                                            Hidden
                                        </button>
                                    </div>

                                    {(reviewSearch || reviewRatingFilter !== undefined || reviewVisibilityFilter !== undefined) && (
                                        <button
                                            onClick={() => {
                                                setReviewSearch("");
                                                setReviewSearchInput("");
                                                setReviewRatingFilter(undefined);
                                                setReviewVisibilityFilter(undefined);
                                                setReviewPage(1);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                                            title="Clear filters"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                                {reviewsLoading ? (
                                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                                        <Loader2 className="animate-spin text-amber-500" size={28} />
                                        <p className="text-xs">Loading customer reviews...</p>
                                    </div>
                                ) : !reviewsData || reviewsData.reviews.length === 0 ? (
                                    <div className="p-16 text-center text-slate-400 space-y-2">
                                        <Star className="mx-auto size-12 opacity-30 text-amber-500 fill-amber-500" />
                                        <p className="font-bold text-slate-700 text-sm">No reviews found</p>
                                        <p className="text-xs text-slate-400">
                                            {reviewSearch || reviewRatingFilter !== undefined || reviewVisibilityFilter !== undefined
                                                ? "Try adjusting search or star rating filters."
                                                : "This merchant does not have any product reviews yet."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {reviewsData.reviews.map((review) => (
                                            <div key={review.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                                            {(review.user?.name || "Customer").slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-900 text-xs">{review.user?.name || "Customer"}</p>
                                                                <span className="text-xs text-slate-400">{review.user?.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className="flex items-center gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star
                                                                            key={s}
                                                                            size={13}
                                                                            className={
                                                                                s <= review.rating
                                                                                    ? "text-amber-400 fill-amber-400"
                                                                                    : "text-slate-200 fill-slate-200"
                                                                            }
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-800">{review.rating}.0</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-xs text-slate-400">
                                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                                review.isVisible
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                                            }`}
                                                        >
                                                            <span className={`size-1.5 rounded-full ${review.isVisible ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                            {review.isVisible ? "Visible" : "Hidden"}
                                                        </span>

                                                        <button
                                                            onClick={() => handleToggleReviewVisibility(review.id, review.isVisible)}
                                                            disabled={toggleReviewVisibilityMutation.isPending}
                                                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                                                review.isVisible
                                                                    ? "bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                            }`}
                                                        >
                                                            {review.isVisible ? (
                                                                <>
                                                                    <EyeOff size={13} />
                                                                    <span>Hide</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye size={13} />
                                                                    <span>Show</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            disabled={deleteReviewMutation.isPending}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                                                            title="Delete review"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {review.product && (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs">
                                                        <Store size={13} className="text-slate-400" />
                                                        <span className="font-semibold text-slate-800 truncate max-w-xs">{review.product.name}</span>
                                                    </div>
                                                )}

                                                {review.comment && (
                                                    <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 font-medium">
                                                        "{review.comment}"
                                                    </p>
                                                )}

                                                {review.reply && (
                                                    <div className="ml-4 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                                                <Store size={12} className="text-amber-600" />
                                                                Store Owner Response
                                                            </span>
                                                            <span className="text-amber-700 font-mono">{new Date(review.reply.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-xs text-amber-800 leading-relaxed">{review.reply.comment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: Approve Shop Application */}
            {showApproveModal && (
                <ModalPortal onClose={() => setShowApproveModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowApproveModal(false); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                                        <CheckCircle2 size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Clear & Approve Shop</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Enable live trading for {shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs">
                                <p className="font-bold">Live Trading Activation</p>
                                <p>
                                    This merchant will immediately be marked as <strong>ACTIVE</strong> and business standing as <strong>VERIFIED</strong>. Customer storefront will go live.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Approval / Audit Note (Optional)
                                </label>
                                <textarea
                                    value={approvalNote}
                                    onChange={(e) => setApprovalNote(e.target.value)}
                                    placeholder="Verification confirmation details..."
                                    rows={3}
                                    className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowApproveModal(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {approveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Approve & Go Live
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Reject Shop Application */}
            {showRejectModal && (
                <ModalPortal onClose={() => setShowRejectModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowRejectModal(false); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                                        <XCircle size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Reject Shop Application</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Decline merchant onboarding</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
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
                                        <option value="Incomplete or unverifiable legal documentation">Incomplete or unverifiable legal documentation</option>
                                        <option value="Invalid or mismatched Tax ID / EIN">Invalid or mismatched Tax ID / EIN</option>
                                        <option value="Unverifiable business operating address">Unverifiable business operating address</option>
                                        <option value="Failed beneficial owner KYC / identity check">Failed beneficial owner KYC / identity check</option>
                                        <option value="Prohibited merchandise or policy violation">Prohibited merchandise or policy violation</option>
                                        <option value="Suspected fraudulent entity">Suspected fraudulent entity</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Merchant Feedback Note
                                    </label>
                                    <textarea
                                        value={rejectionNotes}
                                        onChange={(e) => setRejectionNotes(e.target.value)}
                                        placeholder="Explain what documentation or amendments the applicant needs to provide..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {rejectMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Field Level Verification */}
            {fieldVerifyModal && (
                <ModalPortal onClose={() => setFieldVerifyModal(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setFieldVerifyModal(null); }}>
                        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <h3 className="text-base font-bold text-slate-900">{fieldVerifyModal.title}</h3>
                                <button onClick={() => setFieldVerifyModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">New Standing</label>
                                    <select
                                        value={fieldTargetStatus}
                                        onChange={(e) => setFieldTargetStatus(e.target.value as any)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                                    >
                                        <option value="VERIFIED">VERIFIED (Passed compliance audit)</option>
                                        <option value="IN_REVIEW">IN_REVIEW (Secondary inspection)</option>
                                        <option value="PENDING">PENDING (Awaiting merchant documentation)</option>
                                        <option value="REJECTED">REJECTED (Failed verification)</option>
                                        <option value="UNVERIFIED">UNVERIFIED (Reset status)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Audit Notes / Context</label>
                                    <textarea
                                        value={fieldNotes}
                                        onChange={(e) => setFieldNotes(e.target.value)}
                                        placeholder="Explanation of determination..."
                                        rows={3}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setFieldVerifyModal(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFieldVerificationSave}
                                    disabled={updateVerificationMutation.isPending}
                                    className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {updateVerificationMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Save Status
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Document Review */}
            {docReviewModal && (
                <ModalPortal onClose={() => setDocReviewModal(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setDocReviewModal(null); }}>
                        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Review Legal Document</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-xs">{docReviewModal.name}</p>
                                </div>
                                <button onClick={() => setDocReviewModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Determination</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDocReviewStatus("VERIFIED")}
                                            className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                                                docReviewStatus === "VERIFIED"
                                                    ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-200"
                                                    : "border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            ✓ Approve & Verify
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDocReviewStatus("REJECTED")}
                                            className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                                                docReviewStatus === "REJECTED"
                                                    ? "bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200"
                                                    : "border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            ✗ Reject Document
                                        </button>
                                    </div>
                                </div>

                                {docReviewStatus === "REJECTED" && (
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Rejection Reason</label>
                                        <textarea
                                            value={docRejectionReason}
                                            onChange={(e) => setDocRejectionReason(e.target.value)}
                                            placeholder="e.g., Expired certificate or blurry scan..."
                                            rows={2}
                                            className="w-full p-2.5 border border-slate-200 rounded-xl"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setDocReviewModal(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReviewDocument}
                                    disabled={updateDocMutation.isPending}
                                    className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    Save Review
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Upload Document */}
            {showAddDocModal && (
                <ModalPortal onClose={() => setShowAddDocModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowAddDocModal(false); }}>
                        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <h3 className="text-base font-bold text-slate-900">Upload Legal Document</h3>
                                <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddDocument} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Document Classification</label>
                                    <select
                                        value={newDocType}
                                        onChange={(e) => setNewDocType(e.target.value as any)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold bg-white"
                                    >
                                        <option value="CERTIFICATE_OF_INCORPORATION">Certificate of Incorporation</option>
                                        <option value="BUSINESS_LICENSE">Business License / Permit</option>
                                        <option value="TAX_REGISTRATION">Tax Registration Certificate</option>
                                        <option value="OWNER_ID_FRONT">Beneficial Owner ID (Front)</option>
                                        <option value="OWNER_ID_BACK">Beneficial Owner ID (Back)</option>
                                        <option value="UTILITY_BILL">Proof of Address / Utility Bill</option>
                                        <option value="BANK_STATEMENT">Bank Statement / Verification</option>
                                        <option value="OTHER">Other Compliance Document</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Document Title</label>
                                    <input
                                        type="text"
                                        value={newDocName}
                                        onChange={(e) => setNewDocName(e.target.value)}
                                        placeholder="e.g. State Certificate of Good Standing 2026"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">File URL / Storage Link</label>
                                    <input
                                        type="text"
                                        value={newDocUrl}
                                        onChange={(e) => setNewDocUrl(e.target.value)}
                                        placeholder="https://storage.googleapis.com/... or /uploads/..."
                                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddDocModal(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addDocMutation.isPending || !newDocName.trim() || !newDocUrl.trim()}
                                        className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                                    >
                                        Save Document
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Suspend Shop */}
            {showSuspendModal && (
                <ModalPortal onClose={() => setShowSuspendModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowSuspendModal(false); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                                        <Ban size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Suspend Store</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Temporarily restrict trading for {shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSuspendModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
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
                                        <option value="Policy / terms of service violation">Policy / terms of service violation</option>
                                        <option value="Excessive dispute / chargeback rate">Excessive dispute / chargeback rate</option>
                                        <option value="Suspected fraud or unauthorized account access">Suspected fraud or unauthorized account access</option>
                                        <option value="Customer complaint escalation">Customer complaint escalation</option>
                                        <option value="Failed secondary KYC audit">Failed secondary KYC audit</option>
                                        <option value="Other compliance concerns">Other compliance concerns</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Administrative Notes (Internal & Merchant Notification)
                                    </label>
                                    <textarea
                                        value={suspensionNotes}
                                        onChange={(e) => setSuspensionNotes(e.target.value)}
                                        placeholder="Explain grounds for suspension and required remedial steps..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowSuspendModal(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSuspend}
                                    disabled={suspendMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {suspendMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Suspend Store
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Close Shop Permanently */}
            {showCloseModal && (
                <ModalPortal onClose={() => setShowCloseModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowCloseModal(false); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
                                        <Lock size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Close Store Permanently</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Cease all store activity and access</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Closure Reason
                                    </label>
                                    <select
                                        value={closureReason}
                                        onChange={(e) => setClosureReason(e.target.value)}
                                        className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                                    >
                                        <option value="Merchant voluntary termination">Merchant voluntary termination</option>
                                        <option value="Critical terms of service breach">Critical terms of service breach</option>
                                        <option value="Abandoned store / inactive operator">Abandoned store / inactive operator</option>
                                        <option value="Confirmed fraudulent syndicate">Confirmed fraudulent syndicate</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Closure Notes
                                    </label>
                                    <textarea
                                        value={closureNotes}
                                        onChange={(e) => setClosureNotes(e.target.value)}
                                        placeholder="Final audit summary or settlement notes..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowCloseModal(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={closeMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {closeMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Terminate Store
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Reopen / Restore Shop */}
            {showReopenModal && (
                <ModalPortal onClose={() => setShowReopenModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowReopenModal(false); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                                        <RotateCcw size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Reopen Store</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Restore suspended or closed store</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Target Status
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setTargetReopenStatus("ACTIVE")}
                                            className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                                                targetReopenStatus === "ACTIVE"
                                                    ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-200"
                                                    : "border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            Active (Live Trading)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTargetReopenStatus("PENDING")}
                                            className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                                                targetReopenStatus === "PENDING"
                                                    ? "bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-200"
                                                    : "border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            Pending (Require Review)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Reopen Determination Reason
                                    </label>
                                    <textarea
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        placeholder="Explain why this merchant is reinstated..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowReopenModal(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReopen}
                                    disabled={reopenMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {reopenMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Restore Store
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Add Risk Flag */}
            {showAddRiskModal && (
                <ModalPortal onClose={() => setShowAddRiskModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowAddRiskModal(false); }}>
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                                        <ShieldAlert size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Attach Risk Flag</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Apply compliance hold or inspection flag</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddRiskModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddRiskFlag} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Predefined Flag
                                    </label>
                                    <select
                                        value={newRiskFlag}
                                        onChange={(e) => {
                                            setNewRiskFlag(e.target.value);
                                            const found = PRESET_RISK_FLAGS.find((f) => f.flag === e.target.value);
                                            if (found) setNewRiskSeverity(found.severity);
                                        }}
                                        className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                                    >
                                        {PRESET_RISK_FLAGS.map((f) => (
                                            <option key={f.flag} value={f.flag}>
                                                [{f.severity}] {f.flag}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Severity Level
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskSeverity[]).map((sev) => (
                                            <button
                                                key={sev}
                                                type="button"
                                                onClick={() => setNewRiskSeverity(sev)}
                                                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                                    newRiskSeverity === sev
                                                        ? sev === "CRITICAL"
                                                            ? "bg-rose-600 text-white border-rose-600"
                                                            : sev === "HIGH"
                                                            ? "bg-rose-100 text-rose-800 border-rose-300"
                                                            : sev === "MEDIUM"
                                                            ? "bg-amber-100 text-amber-800 border-amber-300"
                                                            : "bg-slate-100 text-slate-800 border-slate-300"
                                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                {sev}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Description & Evidence Details
                                    </label>
                                    <textarea
                                        value={newRiskDescription}
                                        onChange={(e) => setNewRiskDescription(e.target.value)}
                                        placeholder="Specific audit notes or reasons for attaching this risk flag..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddRiskModal(false)}
                                        className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addRiskMutation.isPending}
                                        className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                    >
                                        {addRiskMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                        Attach Flag
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Resolve Risk Flag */}
            {resolveFlagModal && (
                <ModalPortal onClose={() => setResolveFlagModal(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setResolveFlagModal(null); }}>
                        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                                        <CheckCircle2 size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Clear & Resolve Flag</h3>
                                        <p className="text-xs text-slate-500 truncate max-w-xs">{resolveFlagModal.flag}</p>
                                    </div>
                                </div>
                                <button onClick={() => setResolveFlagModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <p className="text-slate-600">
                                    This will remove the risk penalty from the merchant's health score.
                                </p>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Resolution Summary Note</label>
                                    <textarea
                                        value={resolveNotes}
                                        onChange={(e) => setResolveNotes(e.target.value)}
                                        placeholder="Explain how the issue was remediated or verified..."
                                        rows={3}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setResolveFlagModal(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolveRiskFlag}
                                    disabled={resolveRiskMutation.isPending}
                                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {resolveRiskMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Mark Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Image Zoom */}
            {zoomImageUrl && (
                <ModalPortal onClose={() => setZoomImageUrl(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer overflow-y-auto"
                        onClick={(e) => { if (e.target === e.currentTarget) setZoomImageUrl(null); }}
                    >
                        <div className="relative max-w-3xl max-h-[90vh] my-auto">
                            <img src={zoomImageUrl} alt="Enlarged Document" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
                            <button
                                onClick={() => setZoomImageUrl(null)}
                                className="absolute -top-3 -right-3 size-8 bg-white text-slate-900 rounded-full flex items-center justify-center font-bold shadow-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};
