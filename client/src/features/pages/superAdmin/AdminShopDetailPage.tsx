import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Store,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    FileText,
    ExternalLink,
    Plus,
    Trash2,
    RotateCcw,
    Lock,
    X,
    Star,
    Search,
    ZoomIn,
    Ban,
    ShieldAlert,
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

    const handleTabChange = (tab: "overview" | "verification" | "kyc" | "documents" | "risk" | "notes" | "reviews") => {
        setActiveTab(tab);
        navigate(`?tab=${tab}`, { replace: true });
    };

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
            <div className="flex flex-col items-center justify-center h-80 gap-2 text-slate-500">
                <Loader2 className="animate-spin text-orange-500" size={28} />
                <p className="text-xs font-medium text-slate-400">Loading store profile & verification data...</p>
            </div>
        );
    }

    if (isError || !shop) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center max-w-md mx-auto mt-10 space-y-3 shadow-xs">
                <div className="size-10 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertTriangle size={20} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Merchant Store Not Found</h3>
                <p className="text-xs text-slate-500">The requested store profile could not be located or retrieved.</p>
                <button
                    onClick={() => navigate("/superadmin/shops")}
                    className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 cursor-pointer"
                >
                    Back to Store Directory
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

    const NAV_SECTIONS: {
        id: "overview" | "verification" | "kyc" | "documents" | "risk" | "notes" | "reviews";
        label: string;
        badge: string;
        badgeColor: string;
    }[] = [
        { id: "overview", label: "Overview & Checklist", badge: `${checklist.filter((i: any) => i.status === "COMPLETED").length}/8 Ready`, badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200" },
        { id: "verification", label: "Business & Tax ID", badge: legal?.businessVerificationStatus || "UNVERIFIED", badgeColor: legal?.businessVerificationStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200" },
        { id: "kyc", label: "Owner Identity (KYC)", badge: legal?.ownerKycStatus || "UNVERIFIED", badgeColor: legal?.ownerKycStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200" },
        { id: "documents", label: "Legal Documents Vault", badge: `${legal?.documents?.length ?? 0} Docs`, badgeColor: "bg-slate-50 text-slate-700 border-slate-200" },
        { id: "risk", label: "Risk Flags & Holds", badge: openFlags.length > 0 ? `${openFlags.length} Flags` : "Clean", badgeColor: openFlags.length > 0 ? "bg-rose-50 text-rose-800 border-rose-200 font-semibold" : "bg-emerald-50 text-emerald-800 border-emerald-200" },
        { id: "notes", label: "Audit Notes & Log", badge: `${shop.adminNotesList?.length ?? 0} Notes`, badgeColor: "bg-slate-50 text-slate-700 border-slate-200" },
        { id: "reviews", label: "Customer Reviews", badge: reviewsData ? `${reviewsData.total} Reviews` : "Reviews", badgeColor: "bg-slate-50 text-slate-700 border-slate-200" },
    ];

    return (
        <div className="space-y-5 pb-16">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                    onClick={() => navigate("/superadmin/shops")}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer w-fit"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Stores</span>
                </button>
                <div className="text-[11px] font-mono text-slate-400">
                    Store ID: <span className="font-semibold text-slate-700">{shop.id}</span>
                </div>
            </div>

            {/* Alert Banners (if Rejected, Suspended, or Closed) */}
            {shop.status === "REJECTED" && (
                <div className="bg-rose-50/80 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
                    <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-950 space-y-0.5">
                        <p className="font-semibold text-rose-900">Application Rejected</p>
                        <p className="text-rose-800">
                            <strong>Reason:</strong> {shop.rejectionReason || "Incomplete compliance requirements"}
                        </p>
                        {shop.rejectionNotes && (
                            <p className="text-rose-700">
                                <strong>Feedback:</strong> {shop.rejectionNotes}
                            </p>
                        )}
                        {shop.rejectedAt && (
                            <p className="text-rose-500 text-[10px] pt-0.5 font-mono">
                                Recorded on {new Date(shop.rejectedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {shop.status === "SUSPENDED" && (
                <div className="bg-rose-50/80 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-950 space-y-0.5">
                        <p className="font-semibold text-rose-900">Store Suspended From Customer Trading</p>
                        <p className="text-rose-800">
                            <strong>Reason:</strong> {shop.suspensionReason || "Terms of service or compliance violation"}
                        </p>
                        {shop.suspensionNotes && (
                            <p className="text-rose-700">
                                <strong>Context:</strong> {shop.suspensionNotes}
                            </p>
                        )}
                        {shop.suspendedAt && (
                            <p className="text-rose-500 text-[10px] pt-0.5 font-mono">
                                Suspended on {new Date(shop.suspendedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {shop.status === "CLOSED" && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
                    <Lock size={18} className="text-slate-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-800 space-y-0.5">
                        <p className="font-semibold text-slate-900">Store Closed</p>
                        <p className="text-slate-600">
                            <strong>Reason:</strong> {shop.closureReason || "Voluntary or administrative closure"}
                        </p>
                    </div>
                </div>
            )}

            {/* Merchant Top Header Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Identity */}
                    <div className="flex items-start gap-3.5">
                        {shop.profile?.logo ? (
                            <img
                                src={shop.profile.logo}
                                alt=""
                                className="size-13 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                        ) : (
                            <div className="size-13 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold shrink-0">
                                <Store size={22} />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                    {shop.profile?.name || shop.slug}
                                </h1>
                                <ShopStatusBadge status={shop.status} />
                                <VerificationBadge status={legal?.businessVerificationStatus} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                                <span className="font-mono text-slate-600 font-medium">/{shop.slug}</span>
                                <a
                                    href={`/${shop.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-0.5 text-[11px]"
                                >
                                    <ExternalLink size={11} />
                                    <span>Storefront</span>
                                </a>
                                <span>•</span>
                                <span className="text-[11px]">Created {new Date(shop.createdAt).toLocaleDateString()}</span>
                                {legal?.legalBusinessName && (
                                    <>
                                        <span>•</span>
                                        <span className="font-medium text-slate-700 text-[11px]">{legal.legalBusinessName}</span>
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
                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Approve</span>
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="h-8 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <XCircle size={14} />
                                    <span>Reject</span>
                                </button>
                            </>
                        )}

                        {shop.status === "ACTIVE" && (
                            <>
                                <button
                                    onClick={() => setShowSuspendModal(true)}
                                    className="h-8 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Ban size={14} />
                                    <span>Suspend</span>
                                </button>
                                <button
                                    onClick={() => setShowCloseModal(true)}
                                    className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Lock size={13} className="text-slate-500" />
                                    <span>Close</span>
                                </button>
                            </>
                        )}

                        {(shop.status === "SUSPENDED" || shop.status === "CLOSED" || shop.status === "REJECTED") && (
                            <button
                                onClick={() => setShowReopenModal(true)}
                                className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                                <RotateCcw size={14} />
                                <span>Reopen</span>
                            </button>
                        )}

                        <button
                            onClick={() => setShowAddRiskModal(true)}
                            className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <ShieldAlert size={14} className="text-rose-500" />
                            <span>Flag Risk</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal Navigation Tabs: Sections & Audits */}
            <div className="border-b border-slate-200 bg-white rounded-lg px-3 pt-1 shadow-2xs">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {NAV_SECTIONS.map((sec) => {
                        const isActive = activeTab === sec.id;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => handleTabChange(sec.id)}
                                className={`px-4 py-2.5 border-b-2 -mb-px text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
                                    isActive
                                        ? "border-orange-500 text-slate-900 font-semibold"
                                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium"
                                }`}
                            >
                                <span>{sec.label}</span>
                                {sec.badge && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${sec.badgeColor}`}>
                                        {sec.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content Canvas (Full Width) */}
            <div className="space-y-5">
                {/* SECTION 1: Overview & Onboarding Checklist */}
                {activeTab === "overview" && (
                    <div className="space-y-5">
                        {/* Row 1: Health Score & Beneficial Owner Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Health Score Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-slate-900">Health Score</h3>
                                    <HealthScorePill score={health?.score} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="relative size-14 shrink-0 flex items-center justify-center">
                                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                className="text-slate-100"
                                                strokeWidth="3.5"
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
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="text-sm font-bold text-slate-900 tabular-nums">{health?.score ?? 70}</span>
                                            <span className="text-[8px] text-slate-400 font-semibold uppercase">/100</span>
                                        </div>
                                    </div>

                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs font-semibold text-slate-900">{health?.tierLabel}</p>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            Computed from tax validation, KYC audit, open risk flags, and legal documents.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-500 text-[11px]">Active Risk Flags:</span>
                                    <span className={`font-semibold text-xs tabular-nums ${openFlags.length > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                                        {openFlags.length > 0 ? `${openFlags.length} active` : "0 (Clean)"}
                                    </span>
                                </div>
                            </div>

                            {/* Beneficial Owner Identity Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-slate-900">Beneficial Owner</h3>
                                    <VerificationBadge status={legal?.ownerKycStatus} />
                                </div>

                                <div className="flex items-center gap-3 pt-0.5">
                                    <div className="size-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                        {shop.owner.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-xs truncate">{shop.owner.name}</p>
                                        <p className="text-slate-500 text-[11px] truncate">{shop.owner.email}</p>
                                        {shop.profile?.phone && (
                                            <p className="text-slate-400 text-[11px] truncate mt-0.5">{shop.profile.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>Identity Document:</span>
                                    <span className="font-mono text-slate-700 font-medium">{legal?.ownerIdType || "Not Specified"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Store Activity Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-3.5 space-y-1">
                                <span className="text-[11px] font-medium text-slate-500">Wallet Balance</span>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                                    ${Number(shop.wallet?.balance ?? 0).toFixed(2)}
                                </p>
                                <p className="text-[10px] font-medium text-slate-400">
                                    {shop.wallet?.payoutsEnabled ? "Payouts enabled" : "Payouts not linked"}
                                </p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-3.5 space-y-1">
                                <span className="text-[11px] font-medium text-slate-500">Products</span>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">{shop._count.products}</p>
                                <p className="text-[10px] font-medium text-slate-400">Catalog items</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-3.5 space-y-1">
                                <span className="text-[11px] font-medium text-slate-500">Total Orders</span>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">{shop._count.orders}</p>
                                <p className="text-[10px] font-medium text-slate-400">Purchases completed</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-3.5 space-y-1">
                                <span className="text-[11px] font-medium text-slate-500">Staff Members</span>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">{shop._count.employees ?? 0}</p>
                                <p className="text-[10px] font-medium text-slate-400">Store team members</p>
                            </div>
                        </div>

                        {/* Row 3: Shop Onboarding & Verification Checklist */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xs font-semibold text-slate-900">
                                        Shop Onboarding & Verification Checklist
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {checklist.filter((i: any) => i.status === "COMPLETED").length} of 8 requirements satisfied
                                    </p>
                                </div>
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-orange-50 text-orange-800 border border-orange-200/80 w-fit tabular-nums">
                                    {Math.round((checklist.filter((i: any) => i.status === "COMPLETED").length / 8) * 100)}% Ready
                                </span>
                            </div>

                            {/* Checklist Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {checklist.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-md border flex items-start gap-3 transition-colors ${
                                            item.status === "COMPLETED"
                                                ? "bg-white border-emerald-200 hover:border-emerald-300"
                                                : item.status === "FAILED"
                                                ? "bg-white border-rose-200 hover:border-rose-300"
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div
                                            className={`size-2 rounded-full shrink-0 mt-1.5 ${
                                                item.status === "COMPLETED"
                                                    ? "bg-emerald-500"
                                                    : item.status === "FAILED"
                                                    ? "bg-rose-500"
                                                    : "bg-slate-300"
                                            }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1.5">
                                                <p className="font-semibold text-slate-900 text-xs truncate">{item.name}</p>
                                                <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0 ${
                                                        item.status === "COMPLETED"
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                            : item.status === "FAILED"
                                                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                                                            : "bg-slate-100 text-slate-600 border border-slate-200"
                                                    }`}
                                                >
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* SECTION 2: Business & Tax Registration */}
                    {activeTab === "verification" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tax ID Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-4">
                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-900">Tax ID / EIN Verification</h3>
                                        <p className="text-[11px] text-slate-400">Business taxation authority identifier</p>
                                    </div>
                                    <VerificationBadge status={legal?.taxIdStatus} />
                                </div>

                                <div className="p-3 bg-slate-50/70 rounded-md border border-slate-100 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Tax ID / EIN:</span>
                                        <span className="font-mono text-xs font-semibold text-slate-900">{legal?.taxId || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Legal Name:</span>
                                        <span className="font-semibold text-slate-800">{legal?.legalBusinessName || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Classification:</span>
                                        <span className="font-mono text-slate-700">{legal?.entityType || "Unspecified"}</span>
                                    </div>
                                    {legal?.taxIdNotes && (
                                        <div className="text-slate-600 pt-2 border-t border-slate-200 text-[11px]">
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
                                    className="w-full h-8.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                                >
                                    Update Tax ID Standing
                                </button>
                            </div>

                            {/* Business Address Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-4">
                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-900">Physical Business Address</h3>
                                        <p className="text-[11px] text-slate-400">Official registered operating location</p>
                                    </div>
                                    <VerificationBadge status={legal?.addressVerificationStatus} />
                                </div>

                                <div className="p-3 bg-slate-50/70 rounded-md border border-slate-100 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Registered Address:</span>
                                        <span className="font-semibold text-slate-800">{legal?.registeredAddress || shop.profile?.address || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">City:</span>
                                        <span className="font-semibold text-slate-800">{shop.profile?.city || "Not Provided"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Country:</span>
                                        <span className="font-semibold text-slate-800">{shop.profile?.country || "Not Provided"}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setFieldVerifyModal({ field: "address", title: "Business Address Verification", currentStatus: legal?.addressVerificationStatus || "UNVERIFIED" });
                                        setFieldTargetStatus("VERIFIED");
                                        setFieldNotes(legal?.addressVerificationNotes || "");
                                    }}
                                    className="w-full h-8.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                                >
                                    Update Address Standing
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: Owner Identity & KYC */}
                    {activeTab === "kyc" && (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xs font-semibold text-slate-900">
                                        Owner Identity & Beneficial KYC Audit
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Government-issued photo identification and AML clearance
                                    </p>
                                </div>
                                <VerificationBadge status={legal?.ownerKycStatus} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="p-4 bg-slate-50/70 rounded-md border border-slate-100 space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Beneficial Owner:</span>
                                        <span className="font-semibold text-slate-900 text-xs">{shop.owner.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Email:</span>
                                        <span className="text-slate-700">{shop.owner.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Document Type:</span>
                                        <span className="font-mono text-slate-800">{legal?.ownerIdType || "Not Specified"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Document ID:</span>
                                        <span className="font-mono font-semibold text-slate-800">{legal?.ownerIdNumber || "Not Provided"}</span>
                                    </div>
                                    {legal?.ownerKycNotes && (
                                        <div className="pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
                                            <strong>KYC Notes:</strong> {legal.ownerKycNotes}
                                        </div>
                                    )}
                                </div>

                                {/* ID Card Previews */}
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold text-slate-700">
                                        Government ID Proof Uploads
                                    </p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="border border-slate-200 rounded-md p-2 text-center bg-slate-50/50">
                                            <p className="text-[11px] font-medium text-slate-600 mb-1.5">Front Side</p>
                                            {legal?.ownerIdCardFront ? (
                                                <button
                                                    onClick={() => setZoomImageUrl(legal.ownerIdCardFront!)}
                                                    className="relative group rounded-md overflow-hidden border border-slate-200 block w-full cursor-pointer"
                                                >
                                                    <img src={legal.ownerIdCardFront || undefined} alt="ID Front" className="w-full h-24 object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                        <ZoomIn size={16} />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="h-24 border border-dashed border-slate-200 rounded-md flex items-center justify-center text-slate-400 text-xs">
                                                    No Upload
                                                </div>
                                            )}
                                        </div>

                                        <div className="border border-slate-200 rounded-md p-2 text-center bg-slate-50/50">
                                            <p className="text-[11px] font-medium text-slate-600 mb-1.5">Back Side</p>
                                            {legal?.ownerIdCardBack ? (
                                                <button
                                                    onClick={() => setZoomImageUrl(legal.ownerIdCardBack!)}
                                                    className="relative group rounded-md overflow-hidden border border-slate-200 block w-full cursor-pointer"
                                                >
                                                    <img src={legal.ownerIdCardBack || undefined} alt="ID Back" className="w-full h-24 object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                        <ZoomIn size={16} />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="h-24 border border-dashed border-slate-200 rounded-md flex items-center justify-center text-slate-400 text-xs">
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
                                className="w-full h-8.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                                Update Owner KYC Verification Status
                            </button>
                        </div>
                    )}

                    {/* SECTION 4: Legal Documents Vault */}
                    {activeTab === "documents" && (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xs font-semibold text-slate-900">
                                        Legal Documents Vault
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Articles of incorporation, permits, tax certificates, and declarations
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddDocModal(true)}
                                    className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                    <Plus size={13} />
                                    <span>Upload Document</span>
                                </button>
                            </div>

                            {(legal?.documents?.length ?? 0) === 0 ? (
                                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg space-y-1">
                                    <FileText className="mx-auto size-8 opacity-30 text-slate-400" />
                                    <p className="font-semibold text-slate-700 text-xs">No documents in vault</p>
                                    <p className="text-[11px] text-slate-400">Merchant has not uploaded compliance documentation yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                                    {legal?.documents?.map((doc: any) => (
                                        <div key={doc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-8 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
                                                    <FileText size={15} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-900 text-xs">{doc.name}</p>
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium uppercase">
                                                            {doc.type.replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                                                <VerificationBadge status={doc.status} />
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="h-7 px-2 border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                                                    title="Open file"
                                                >
                                                    <ExternalLink size={12} />
                                                    <span>View</span>
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setDocReviewModal({ id: doc.id, name: doc.name });
                                                        setDocReviewStatus("VERIFIED");
                                                        setDocRejectionReason("");
                                                    }}
                                                    className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="size-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                                    title="Remove document"
                                                >
                                                    <Trash2 size={13} />
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
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xs font-semibold text-slate-900">
                                        Compliance Risk Flags & Administrative Holds
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Active compliance audits, elevated dispute risks, or administrative holds
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddRiskModal(true)}
                                    className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                    <Plus size={13} />
                                    <span>Attach Risk Flag</span>
                                </button>
                            </div>

                            {openFlags.length === 0 ? (
                                <div className="p-10 text-center border border-dashed border-emerald-200 bg-emerald-50/20 rounded-lg space-y-1">
                                    <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
                                    <p className="font-semibold text-slate-900 text-xs">Clean Compliance Standing</p>
                                    <p className="text-[11px] text-slate-500">There are no active risk flags or administrative holds on this merchant.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {openFlags.map((flag: any) => (
                                        <div key={flag.id} className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-rose-900 text-xs">{flag.flag}</span>
                                                    <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-rose-200/80 text-rose-800 uppercase">
                                                        {flag.severity}
                                                    </span>
                                                </div>
                                                {flag.description && (
                                                    <p className="text-xs text-rose-800 mt-0.5 leading-normal">{flag.description}</p>
                                                )}
                                                <p className="text-[10px] text-rose-500 font-mono mt-1">
                                                    Reported on {new Date(flag.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setResolveFlagModal({ id: flag.id, flag: flag.flag });
                                                    setResolveNotes("");
                                                }}
                                                className="h-7 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
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
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
                            <div className="pb-3 border-b border-slate-100">
                                <h2 className="text-xs font-semibold text-slate-900">
                                    Internal Compliance Notes & Log
                                </h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Confidential administrative notes visible strictly to Super Admins
                                </p>
                            </div>

                            {/* Post Note Form */}
                            <form onSubmit={handleAddAdminNote} className="space-y-2">
                                <textarea
                                    value={newAdminNote}
                                    onChange={(e) => setNewAdminNote(e.target.value)}
                                    placeholder="Add an internal observation, verification finding, or investigation detail..."
                                    rows={3}
                                    className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={addNoteMutation.isPending || !newAdminNote.trim()}
                                        className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                                    >
                                        {addNoteMutation.isPending ? "Saving..." : "Save Internal Note"}
                                    </button>
                                </div>
                            </form>

                            {/* Timeline Thread */}
                            {(shop.adminNotesList?.length ?? 0) === 0 ? (
                                <p className="text-xs text-slate-400 py-6 text-center border-t border-slate-100">
                                    No compliance notes logged yet.
                                </p>
                            ) : (
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    {shop.adminNotesList?.map((note: any) => (
                                        <div key={note.id} className="p-3 bg-slate-50/70 rounded-md border border-slate-100 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-900">{note.adminName || "Super Admin"}</span>
                                                <span className="text-slate-400 text-[10px] font-mono">{new Date(note.createdAt).toLocaleString()}</span>
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
                        <div className="space-y-4">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Overall Rating Card */}
                                <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-semibold text-slate-900">Overall Rating</h3>
                                            <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                Verified
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 my-1">
                                            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                                                {reviewsData?.stats?.avgRating ? reviewsData.stats.avgRating.toFixed(1) : "0.0"}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            size={14}
                                                            className={
                                                                s <= Math.round(reviewsData?.stats?.avgRating || 0)
                                                                    ? "text-amber-400 fill-amber-400"
                                                                    : "text-slate-200 fill-slate-200"
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {reviewsData?.total ?? 0} total review{reviewsData?.total === 1 ? "" : "s"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                        <span>Status</span>
                                        <span className="font-medium text-slate-800">
                                            {reviewsData?.stats?.visibleCount ?? 0} visible · {reviewsData?.stats?.hiddenCount ?? 0} hidden
                                        </span>
                                    </div>
                                </div>

                                {/* Rating Breakdown Bars */}
                                <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-1.5">
                                    <h3 className="text-xs font-semibold text-slate-900 mb-2">Rating Breakdown</h3>
                                    {[5, 4, 3, 2, 1].map((r) => {
                                        const count = (reviewsData?.reviews || []).filter((item) => item.rating === r).length;
                                        const total = reviewsData?.reviews?.length || 0;
                                        const pct = total > 0 ? (count / total) * 100 : 0;
                                        return (
                                            <div key={r} className="flex items-center gap-2 text-xs">
                                                <span className="w-6 font-medium text-slate-600 flex items-center gap-0.5 text-[11px]">
                                                    {r} <Star size={10} className="text-amber-400 fill-amber-400" />
                                                </span>
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-5 text-right text-slate-400 font-mono text-[10px]">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Moderation Policy */}
                                <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-900 mb-1">Moderation Controls</h3>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            Super admins can toggle visibility for abusive or fraudulent reviews without customer disruption.
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => navigate(`/superadmin/reviews?search=${encodeURIComponent(shop.profile?.name || shop.slug)}`)}
                                            className="w-full h-8 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <ExternalLink size={12} />
                                            <span>Open Reviews Hub</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Filter & Search Bar */}
                            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setReviewSearch(reviewSearchInput.trim());
                                        setReviewPage(1);
                                    }}
                                    className="flex gap-2 w-full md:w-72"
                                >
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search comments or customer..."
                                            value={reviewSearchInput}
                                            onChange={(e) => setReviewSearchInput(e.target.value)}
                                            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50/70 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-3 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                        Search
                                    </button>
                                </form>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-md text-xs">
                                        <button
                                            onClick={() => { setReviewRatingFilter(undefined); setReviewPage(1); }}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                                reviewRatingFilter === undefined ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
                                            }`}
                                        >
                                            All
                                        </button>
                                        {[5, 4, 3, 2, 1].map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => { setReviewRatingFilter(st); setReviewPage(1); }}
                                                className={`px-1.5 py-0.5 rounded text-[11px] font-medium flex items-center gap-0.5 transition-colors cursor-pointer ${
                                                    reviewRatingFilter === st ? "bg-amber-400 text-white shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            >
                                                <span>{st}</span>
                                                <Star size={9} className="fill-current" />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-md text-xs">
                                        <button
                                            onClick={() => { setReviewVisibilityFilter(undefined); setReviewPage(1); }}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                                reviewVisibilityFilter === undefined ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => { setReviewVisibilityFilter(true); setReviewPage(1); }}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                                reviewVisibilityFilter === true ? "bg-emerald-600 text-white shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
                                            }`}
                                        >
                                            Visible
                                        </button>
                                        <button
                                            onClick={() => { setReviewVisibilityFilter(false); setReviewPage(1); }}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                                reviewVisibilityFilter === false ? "bg-rose-600 text-white shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
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
                                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                                            title="Clear filters"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                                {reviewsLoading ? (
                                    <div className="flex flex-col items-center justify-center h-36 gap-2 text-slate-400">
                                        <Loader2 className="animate-spin text-orange-500" size={20} />
                                        <p className="text-xs">Loading customer reviews...</p>
                                    </div>
                                ) : !reviewsData || reviewsData.reviews.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 space-y-1">
                                        <FileText className="mx-auto size-8 opacity-30 text-slate-400" />
                                        <p className="font-semibold text-slate-700 text-xs">No reviews found</p>
                                        <p className="text-[11px] text-slate-400">
                                            {reviewSearch || reviewRatingFilter !== undefined || reviewVisibilityFilter !== undefined
                                                ? "Try adjusting search or star rating filters."
                                                : "This merchant does not have any product reviews yet."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {reviewsData.reviews.map((review) => (
                                            <div key={review.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2.5">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-700 text-xs shrink-0">
                                                            {(review.user?.name || "Customer").slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-slate-900 text-xs">{review.user?.name || "Customer"}</p>
                                                                <span className="text-[11px] text-slate-400">{review.user?.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <div className="flex items-center gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star
                                                                            key={s}
                                                                            size={11}
                                                                            className={
                                                                                s <= review.rating
                                                                                    ? "text-amber-400 fill-amber-400"
                                                                                    : "text-slate-200 fill-slate-200"
                                                                            }
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-[11px] font-semibold text-slate-800">{review.rating}.0</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
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
                                                            className="h-6.5 px-2 rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                                                        >
                                                            {review.isVisible ? "Hide" : "Show"}
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            disabled={deleteReviewMutation.isPending}
                                                            className="size-6.5 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                                            title="Delete review"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {review.product && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-md text-[11px]">
                                                        <Store size={12} className="text-slate-400" />
                                                        <span className="font-medium text-slate-700 truncate max-w-xs">{review.product.name}</span>
                                                    </div>
                                                )}

                                                {review.comment && (
                                                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2.5 rounded-md border border-slate-100">
                                                        "{review.comment}"
                                                    </p>
                                                )}

                                                {review.reply && (
                                                    <div className="ml-3 p-2.5 bg-amber-50/60 rounded-md border border-amber-200/70 space-y-0.5">
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="font-semibold text-amber-900 flex items-center gap-1">
                                                                <Store size={11} className="text-amber-600" />
                                                                Merchant Response
                                                            </span>
                                                            <span className="text-amber-700 font-mono">{new Date(review.reply.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-xs text-amber-800 leading-normal">{review.reply.comment}</p>
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

            {/* MODAL: Approve Shop Application */}
            {showApproveModal && (
                <ModalPortal onClose={() => setShowApproveModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowApproveModal(false); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Approve Application</h3>
                                        <p className="text-[11px] text-slate-500">{shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-3 bg-emerald-50/70 text-emerald-900 rounded-md border border-emerald-200 text-xs space-y-1">
                                <p className="font-semibold text-emerald-800">Upon approval:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-emerald-700 text-[11px]">
                                    <li>Status switches to <strong>ACTIVE</strong> immediately.</li>
                                    <li>Store products become publicly tradeable.</li>
                                    <li>Merchant receives automated live store notification.</li>
                                </ul>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-700">
                                    Approval Note (Optional)
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
                                    onClick={() => setShowApproveModal(false)}
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

            {/* MODAL: Reject Shop Application */}
            {showRejectModal && (
                <ModalPortal onClose={() => setShowRejectModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowRejectModal(false); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                                        <XCircle size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Reject Application</h3>
                                        <p className="text-[11px] text-slate-500">{shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Primary Reason
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
                                        Feedback for Merchant
                                    </label>
                                    <textarea
                                        value={rejectionNotes}
                                        onChange={(e) => setRejectionNotes(e.target.value)}
                                        placeholder="Explain what the merchant must fix to reapply..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setShowRejectModal(false)}
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

            {/* MODAL: Suspend Shop */}
            {showSuspendModal && (
                <ModalPortal onClose={() => setShowSuspendModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowSuspendModal(false); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                                        <Ban size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Suspend Store</h3>
                                        <p className="text-[11px] text-slate-500">{shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSuspendModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
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
                                        Internal Notes
                                    </label>
                                    <textarea
                                        value={suspensionNotes}
                                        onChange={(e) => setSuspensionNotes(e.target.value)}
                                        placeholder="Record investigation context or incident reference..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setShowSuspendModal(false)}
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
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowCloseModal(false); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Close Store Permanently</h3>
                                        <p className="text-[11px] text-slate-500">{shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">Closure Reason</label>
                                    <select
                                        value={closureReason}
                                        onChange={(e) => setClosureReason(e.target.value)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="Merchant requested closure or terms violation">Merchant requested closure or terms violation</option>
                                        <option value="Inactivity or abandonment of store">Inactivity or abandonment of store</option>
                                        <option value="Severe regulatory non-compliance">Severe regulatory non-compliance</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">Closure Notes</label>
                                    <textarea
                                        value={closureNotes}
                                        onChange={(e) => setClosureNotes(e.target.value)}
                                        placeholder="Record details regarding closure..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setShowCloseModal(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={closeMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {closeMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Close Store
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Reopen Shop */}
            {showReopenModal && (
                <ModalPortal onClose={() => setShowReopenModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowReopenModal(false); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                                        <RotateCcw size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Reopen Store</h3>
                                        <p className="text-[11px] text-slate-500">{shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
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
                                        Justification
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
                                    onClick={() => setShowReopenModal(false)}
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

            {/* MODAL: Field Level Verification */}
            {fieldVerifyModal && (
                <ModalPortal onClose={() => setFieldVerifyModal(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setFieldVerifyModal(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">{fieldVerifyModal.title}</h3>
                                        <p className="text-[11px] text-slate-500">Current status: {fieldVerifyModal.currentStatus}</p>
                                    </div>
                                </div>
                                <button onClick={() => setFieldVerifyModal(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Target Verification Standing
                                    </label>
                                    <select
                                        value={fieldTargetStatus}
                                        onChange={(e) => setFieldTargetStatus(e.target.value as any)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="VERIFIED">VERIFIED (Approved & cleared)</option>
                                        <option value="IN_REVIEW">IN_REVIEW (Secondary review needed)</option>
                                        <option value="PENDING">PENDING (Waiting for merchant docs)</option>
                                        <option value="REJECTED">REJECTED (Invalid or mismatched)</option>
                                        <option value="UNVERIFIED">UNVERIFIED (Reset status)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Audit Notes & Observations
                                    </label>
                                    <textarea
                                        value={fieldNotes}
                                        onChange={(e) => setFieldNotes(e.target.value)}
                                        placeholder="Record verification verification findings or government registry reference..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setFieldVerifyModal(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFieldVerificationSave}
                                    disabled={updateVerificationMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {updateVerificationMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Save Verification
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Review Document */}
            {docReviewModal && (
                <ModalPortal onClose={() => setDocReviewModal(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setDocReviewModal(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Review Legal Document</h3>
                                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{docReviewModal.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setDocReviewModal(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Verification Outcome
                                    </label>
                                    <select
                                        value={docReviewStatus}
                                        onChange={(e) => setDocReviewStatus(e.target.value as any)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="VERIFIED">VERIFIED (Valid legal document)</option>
                                        <option value="REJECTED">REJECTED (Illegible, expired, or invalid)</option>
                                    </select>
                                </div>

                                {docReviewStatus === "REJECTED" && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-slate-700">
                                            Rejection Reason
                                        </label>
                                        <textarea
                                            value={docRejectionReason}
                                            onChange={(e) => setDocRejectionReason(e.target.value)}
                                            placeholder="Explain why this document was rejected..."
                                            rows={3}
                                            className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setDocReviewModal(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReviewDocument}
                                    disabled={updateDocMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {updateDocMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Save Review
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Add Document */}
            {showAddDocModal && (
                <ModalPortal onClose={() => setShowAddDocModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowAddDocModal(false); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                                        <Plus size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Upload to Legal Vault</h3>
                                        <p className="text-[11px] text-slate-500">Attach document to merchant profile</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">Document Classification</label>
                                    <select
                                        value={newDocType}
                                        onChange={(e) => setNewDocType(e.target.value as any)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="CERTIFICATE_OF_INCORPORATION">Certificate of Incorporation</option>
                                        <option value="BUSINESS_LICENSE">Business License / Permit</option>
                                        <option value="TAX_CERTIFICATE">Tax Certificate / W-9</option>
                                        <option value="PROOF_OF_ADDRESS">Proof of Address / Lease</option>
                                        <option value="OWNER_IDENTITY_FRONT">Owner Identity Document</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">Document Label</label>
                                    <input
                                        type="text"
                                        value={newDocName}
                                        onChange={(e) => setNewDocName(e.target.value)}
                                        placeholder="e.g. Articles of Organization 2026.pdf"
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">File Storage URL</label>
                                    <input
                                        type="url"
                                        value={newDocUrl}
                                        onChange={(e) => setNewDocUrl(e.target.value)}
                                        placeholder="https://res.cloudinary.com/... or S3 URL"
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddDocModal(false)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addDocMutation.isPending}
                                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                    >
                                        {addDocMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                        Upload Document
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Add Risk Flag */}
            {showAddRiskModal && (
                <ModalPortal onClose={() => setShowAddRiskModal(false)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowAddRiskModal(false); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Attach Compliance Risk Flag</h3>
                                        <p className="text-[11px] text-slate-500">{shop.profile?.name || shop.slug}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddRiskModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleAddRiskFlag} className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">Risk Flag Category</label>
                                    <select
                                        value={newRiskFlag}
                                        onChange={(e) => {
                                            setNewRiskFlag(e.target.value);
                                            const found = PRESET_RISK_FLAGS.find((f) => f.flag === e.target.value);
                                            if (found) setNewRiskSeverity(found.severity);
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
                                    <label className="block text-xs font-medium text-slate-700">Severity Level</label>
                                    <select
                                        value={newRiskSeverity}
                                        onChange={(e) => setNewRiskSeverity(e.target.value as any)}
                                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                    >
                                        <option value="CRITICAL">CRITICAL (-40 pts health deduction)</option>
                                        <option value="HIGH">HIGH (-25 pts health deduction)</option>
                                        <option value="MEDIUM">MEDIUM (-15 pts health deduction)</option>
                                        <option value="LOW">LOW (-5 pts health deduction)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">Investigation Context</label>
                                    <textarea
                                        value={newRiskDescription}
                                        onChange={(e) => setNewRiskDescription(e.target.value)}
                                        placeholder="Explain reason for flagging..."
                                        rows={3}
                                        className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddRiskModal(false)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addRiskMutation.isPending}
                                        className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                    >
                                        {addRiskMutation.isPending && <Loader2 size={13} className="animate-spin" />}
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
                    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setResolveFlagModal(null); }}>
                        <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Resolve Compliance Flag</h3>
                                        <p className="text-[11px] text-slate-500">{resolveFlagModal.flag}</p>
                                    </div>
                                </div>
                                <button onClick={() => setResolveFlagModal(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-1 text-xs">
                                <label className="block text-xs font-medium text-slate-700">Resolution Findings & Context</label>
                                <textarea
                                    value={resolveNotes}
                                    onChange={(e) => setResolveNotes(e.target.value)}
                                    placeholder="Explain how the merchant satisfied compliance..."
                                    rows={3}
                                    className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setResolveFlagModal(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolveRiskFlag}
                                    disabled={resolveRiskMutation.isPending}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {resolveRiskMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Mark Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* MODAL: Image Zoom Lightbox */}
            {zoomImageUrl && (
                <ModalPortal onClose={() => setZoomImageUrl(null)}>
                    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setZoomImageUrl(null); }}>
                        <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl">
                            <button
                                onClick={() => setZoomImageUrl(null)}
                                className="absolute -top-3 -right-3 size-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 shadow-md cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                            <img src={zoomImageUrl} alt="Zoomed document" className="max-h-[80vh] w-auto object-contain rounded" />
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};
