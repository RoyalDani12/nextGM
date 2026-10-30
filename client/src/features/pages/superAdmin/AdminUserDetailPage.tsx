import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Store,
    Shield,
    ShieldCheck,
    Mail,
    Edit2,
    KeyRound,
    Ban,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    X,
    AlertCircle,
} from "lucide-react";
import {
    useAdminUser,
    useUpdateUserStatus,
    useUpdateUserProfile,
    useResetUserPassword,
    useSendUserEmail,
} from "@/features/admin/admin.hooks";
import { useAuthStore } from "@/store/auth.store";
import { ModalPortal } from "@/components/ui/ds-components";

const StatusBadge = ({ status }: { status: string }) => {
    const badges: Record<string, { bg: string; text: string; dot: string }> = {
        ACTIVE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "Active", dot: "bg-emerald-500" },
        PENDING: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "Pending", dot: "bg-amber-500" },
        SUSPENDED: { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "Suspended", dot: "bg-rose-500" },
        DEACTIVATED: { bg: "bg-slate-100 text-slate-600 border-slate-200", text: "Deactivated", dot: "bg-slate-400" },
        DELETED: { bg: "bg-rose-100 text-rose-800 border-rose-300", text: "Deleted", dot: "bg-rose-600" },
    };
    const style = badges[status] ?? { bg: "bg-slate-100 text-slate-700 border-slate-200", text: status, dot: "bg-slate-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${style.bg}`}>
            <span className={`size-1.5 rounded-full ${style.dot}`} />
            {style.text}
        </span>
    );
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
);

export const AdminUserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const currentAdmin = useAuthStore((s) => s.user);
    const { data: user, isLoading, isError } = useAdminUser(id!);

    const updateStatus = useUpdateUserStatus();

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    if (isLoading)
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
        );

    if (isError || !user)
        return (
            <div className="p-12 text-center text-rose-500 text-sm">
                <AlertCircle className="mx-auto size-8 mb-2 opacity-50" />
                User not found or failed to load.
            </div>
        );

    const isSelf = currentAdmin?.id === user.id;

    const handleStatusChange = (newStatus: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") => {
        if (isSelf && (newStatus === "SUSPENDED" || newStatus === "DEACTIVATED")) {
            alert("Self-protection: You cannot ban, suspend, or deactivate your own account.");
            return;
        }

        const actionLabel = newStatus === "SUSPENDED" ? "BAN / SUSPEND" : newStatus === "DEACTIVATED" ? "DEACTIVATE" : "ACTIVATE";
        if (window.confirm(`Are you sure you want to ${actionLabel} ${user.name}'s account?`)) {
            updateStatus.mutate({ id: user.id, status: newStatus });
        }
    };

    return (
        <div className="space-y-6">
            {/* Self-Protection Alert Banner */}
            {isSelf && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
                    <ShieldCheck className="size-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 space-y-0.5">
                        <strong className="text-sm font-bold block text-amber-900">Your Administrator Account</strong>
                        <p className="text-amber-800 leading-relaxed">
                            You are currently signed in as this Super Administrator. Destructive actions (self-ban, self-deactivation, and demotion) are protected to prevent accidental lockout and keep platform administration intact.
                        </p>
                    </div>
                </div>
            )}

            {/* Header & Back */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
                        title="Back to Users"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                            <StatusBadge status={user.status} />
                            {isSelf && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                    <ShieldCheck size={12} className="text-orange-500" />
                                    You (Current Admin)
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                    </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setShowEmailModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                    >
                        <Mail size={14} className="text-orange-500" />
                        Send Email
                    </button>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        <Edit2 size={14} />
                        Edit Profile
                    </button>
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                    >
                        <KeyRound size={14} />
                        Reset Password
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        {user.profile?.avatar ? (
                            <img
                                src={user.profile.avatar}
                                alt={user.name}
                                className="size-16 rounded-full object-cover border border-slate-200"
                            />
                        ) : (
                            <div className="size-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xl">
                                {user.name.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-slate-900 text-base">{user.name}</p>
                            <span className="inline-block mt-1 bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-orange-200">
                                {user.role.replace("_", " ")}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <Field label="Email Address" value={user.email} />
                        <Field label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
                        <Field
                            label="Member Since"
                            value={new Date(user.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        />
                        <Field label="Phone" value={user.profile?.phone || "Not provided"} />
                        {user.profile?.city && (
                            <Field
                                label="Location"
                                value={`${user.profile.city}${user.profile.country ? `, ${user.profile.country}` : ""}`}
                            />
                        )}
                    </div>
                </div>

                {/* Right Column: Moderation & Stores */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Security & Account State Controls */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Shield size={18} className="text-orange-500" />
                            Account Status & Security Control
                        </h2>
                        <p className="text-xs text-slate-500">
                            Change operational status across the platform. Suspending or deactivating will invalidate all active user sessions immediately.
                        </p>

                        <div className="flex flex-wrap gap-2.5 pt-2">
                            {user.status !== "ACTIVE" && (
                                <button
                                    onClick={() => handleStatusChange("ACTIVE")}
                                    disabled={updateStatus.isPending}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                >
                                    <CheckCircle2 size={14} />
                                    Activate Account
                                </button>
                            )}

                            {user.status !== "DEACTIVATED" && (
                                <button
                                    onClick={() => handleStatusChange("DEACTIVATED")}
                                    disabled={updateStatus.isPending || isSelf}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                                        isSelf
                                            ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    }`}
                                    title={isSelf ? "Self-protection: Cannot deactivate your own account" : ""}
                                >
                                    <XCircle size={14} />
                                    Deactivate Account
                                    {isSelf && <span className="ml-1 text-[10px] text-slate-400 font-normal">(Self Protected)</span>}
                                </button>
                            )}

                            {user.status !== "SUSPENDED" && (
                                <button
                                    onClick={() => handleStatusChange("SUSPENDED")}
                                    disabled={updateStatus.isPending || isSelf}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                                        isSelf
                                            ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                    }`}
                                    title={isSelf ? "Self-protection: Cannot ban your own account" : ""}
                                >
                                    <Ban size={14} />
                                    Ban / Suspend User
                                    {isSelf && <span className="ml-1 text-[10px] text-slate-400 font-normal">(Self Protected)</span>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Owned Stores */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Store size={18} className="text-emerald-600" />
                                Owned Stores ({user.ownedShops?.length ?? 0})
                            </h2>
                        </div>

                        {!user.ownedShops?.length ? (
                            <p className="text-xs text-slate-400">This user does not own any merchant stores.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {user.ownedShops.map((shop: any) => (
                                    <Link
                                        key={shop.id}
                                        to={`/superadmin/shops/${shop.id}`}
                                        className="p-3 rounded-xl border border-slate-200/70 hover:border-orange-300 hover:bg-orange-50/20 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                                <Store size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {shop.profile?.name || shop.slug}
                                                </p>
                                                <p className="text-xs text-slate-400">/{shop.slug}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                                            shop.status === "ACTIVE"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}>
                                            {shop.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditDetailModal user={user} isSelf={isSelf} onClose={() => setShowEditModal(false)} />
            )}

            {showEmailModal && (
                <SendDetailEmailModal user={user} onClose={() => setShowEmailModal(false)} />
            )}

            {showResetModal && (
                <ResetDetailPasswordModal user={user} onClose={() => setShowResetModal(false)} />
            )}
        </div>
    );
};

// ─── Modal: Edit User Details ──────────────────────────────────────────
const EditDetailModal = ({
    user,
    isSelf,
    onClose,
}: {
    user: any;
    isSelf: boolean;
    onClose: () => void;
}) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [phone, setPhone] = useState(user.profile?.phone || "");

    const updateProfile = useUpdateUserProfile();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSelf && role !== "SUPER_ADMIN") {
            alert("Safety lock: You cannot remove your own Super Admin privileges.");
            return;
        }

        updateProfile.mutate(
            { id: user.id, data: { name, email, role, phone } },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Edit2 size={16} className="text-orange-500" />
                            Edit User Profile
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {isSelf && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                            <ShieldCheck size={16} className="text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <strong>Safety Protection:</strong> Your account role is locked to Super Administrator to prevent accidental demotion.
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Role & Permissions</label>
                            <select
                                value={role}
                                disabled={isSelf}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                                <option value="CUSTOMER">Customer (Standard User)</option>
                                <option value="SHOP_OWNER">Shop Owner (Merchant)</option>
                                <option value="SUPER_ADMIN">Super Administrator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateProfile.isPending}
                                className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm shadow-orange-100 flex items-center gap-1.5 cursor-pointer"
                            >
                                {updateProfile.isPending && <Loader2 size={13} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalPortal>
    );
};

// ─── Modal: Send Email Direct ──────────────────────────────────────────
const SendDetailEmailModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
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
                    setTimeout(() => onClose(), 1500);
                },
            }
        );
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <Mail size={16} className="text-orange-500" />
                                Send Message to {user.name}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">Delivered directly to {user.email}</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {sent ? (
                        <div className="p-8 text-center text-emerald-600 font-semibold text-sm">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                            Email dispatched successfully!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Important update regarding your account..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Message Body</label>
                                <textarea
                                    rows={6}
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendEmail.isPending}
                                    className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm shadow-orange-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {sendEmail.isPending && <Loader2 size={13} className="animate-spin" />}
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

// ─── Modal: Reset Password Direct ──────────────────────────────────────
const ResetDetailPasswordModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
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
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <KeyRound size={16} className="text-amber-500" />
                            Reset User Password
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {!resultPassword ? (
                        <form onSubmit={handleReset} className="space-y-4 text-sm">
                            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 space-y-1">
                                <p className="font-bold">Security Notice</p>
                                <p>
                                    Resetting password will invalidate all active sessions for <strong>{user.name}</strong> ({user.email}).
                                    A notification email will be dispatched with the newly generated temporary password.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Custom Password (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Leave empty to auto-generate a secure random password"
                                    value={customPassword}
                                    onChange={(e) => setCustomPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-xs font-mono"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetPassword.isPending}
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-sm shadow-amber-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {resetPassword.isPending && <Loader2 size={13} className="animate-spin" />}
                                    Generate & Reset Password
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 text-sm">
                            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                                Password has been reset successfully and emailed to <strong>{user.email}</strong>.
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1.5">Temporary Generated Password:</p>
                                <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl font-mono text-base font-bold text-slate-900 justify-between">
                                    <span>{resultPassword}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                        title="Copy temporary password"
                                    >
                                        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-all cursor-pointer"
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

export default AdminUserDetailPage;
