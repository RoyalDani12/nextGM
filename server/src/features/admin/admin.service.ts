import { recordAuditLog } from "./audit.service.js";
import bcrypt from "bcrypt";
import { transporter } from "../../services/email.transporter.js";
import { AppError } from "../../middleware/appError.js";
import { deleteUserSession } from "../../infrastructure/cache/session.cache.js";
import { prisma } from "../../config/db.js";
import {
    getPlatformStats,
    listUsersAdmin,
    getUserByIdAdmin,
    updateUserRoleAdmin,
    updateUserStatusAdmin,
    updateUserProfileAdmin,
    resetUserPasswordAdmin,
    bulkUpdateUsersStatusAdmin,
    getUsersByIdsAdmin,
    listShopsAdmin,
    getShopByIdAdmin,
    updateShopStatusAdmin,
    approveShopAdmin,
    rejectShopAdmin,
    suspendShopAdmin,
    closeShopAdmin,
    reopenShopAdmin,
    updateShopVerificationAdmin,
    addShopLegalDocumentAdmin,
    updateShopLegalDocumentStatusAdmin,
    deleteShopLegalDocumentAdmin,
    addShopAdminNoteAdmin,
    addShopRiskFlagAdmin,
    resolveShopRiskFlagAdmin,
    listReviewsAdmin,
    updateReviewVisibilityAdmin,
    deleteReviewAdmin,
    listShipmentsAdmin,
    listReturnsAdmin,
    getReturnAdmin,
    setReturnRefundPendingAdmin,
    listOrdersAdmin,
    getOrderByIdAdmin,
    getPlatformAnalytics,
    listPayoutsAdmin,
    getPayoutsSummary,
    getBillingOverview,
    listAuditLogsAdmin,
    listCouponsAdmin,
    toggleCouponAdmin,
    listProductsAdmin,
    getProductByIdAdmin,
    updateProductStatusAdmin,
} from "./admin.repository.js";
import { initiateRefundService } from "../payment/payment.service.js";

export const getPlatformStatsService = async () => {
    return getPlatformStats();
};

export const listUsersService = async (filters: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    return listUsersAdmin(filters);
};

export const getUserByIdService = async (id: string) => {
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);
    return user;
};

export const updateUserRoleService = async (id: string, role: string, adminUserId?: string, ip?: string) => {
    const validRoles = ["CUSTOMER", "SHOP_OWNER", "SUPER_ADMIN"];
    if (!validRoles.includes(role)) throw new AppError("Invalid role", 400);
    if (adminUserId && id === adminUserId && role !== "SUPER_ADMIN") {
        throw new AppError("Safety Protection: You cannot remove your own SUPER_ADMIN privileges.", 400);
    }
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);
    const updated = await updateUserRoleAdmin(id, role);
    await deleteUserSession(id);
    if (adminUserId) {
        await recordAuditLog({
            userId: adminUserId,
            action: "UPDATE",
            entity: "USER_ROLE",
            entityId: id,
            oldValue: { role: user.role, email: user.email, name: user.name },
            newValue: { role, email: user.email, name: user.name },
            ip,
        });
    }
    return updated;
};

export const updateUserStatusService = async (id: string, status: string, adminUserId?: string, ip?: string) => {
    const validStatuses = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid status", 400);
    if (adminUserId && id === adminUserId && (status === "SUSPENDED" || status === "DEACTIVATED")) {
        throw new AppError("Safety Protection: You cannot ban, suspend, or deactivate your own account.", 400);
    }
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);
    const updated = await updateUserStatusAdmin(id, status, adminUserId);
    await deleteUserSession(id);
    if (status === "SUSPENDED" || status === "DEACTIVATED") {
        await prisma.refreshToken.deleteMany({ where: { userId: id } });
    }
    if (adminUserId) {
        await recordAuditLog({
            userId: adminUserId,
            action: "UPDATE",
            entity: "USER_STATUS",
            entityId: id,
            oldValue: { status: user.status, email: user.email, name: user.name },
            newValue: { status, email: user.email, name: user.name },
            ip,
        });
    }
    return updated;
};

export const updateUserProfileService = async (
    id: string,
    data: { name?: string; email?: string; role?: string; phone?: string },
    adminUserId?: string,
    ip?: string
) => {
    if (data.role) {
        const validRoles = ["CUSTOMER", "SHOP_OWNER", "SUPER_ADMIN"];
        if (!validRoles.includes(data.role)) throw new AppError("Invalid role", 400);
        if (adminUserId && id === adminUserId && data.role !== "SUPER_ADMIN") {
            throw new AppError("Safety Protection: You cannot demote your own account from SUPER_ADMIN.", 400);
        }
    }
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);

    const updated = await updateUserProfileAdmin(id, data, adminUserId);
    if (adminUserId) {
        if (data.role && data.role !== user.role) {
            await recordAuditLog({
                userId: adminUserId,
                action: "UPDATE",
                entity: "USER_ROLE",
                entityId: id,
                oldValue: { role: user.role, email: user.email },
                newValue: { role: data.role, email: user.email },
                ip,
            });
        }
        await recordAuditLog({
            userId: adminUserId,
            action: "UPDATE",
            entity: "USER_PROFILE",
            entityId: id,
            oldValue: { name: user.name, email: user.email, phone: user.profile?.phone },
            newValue: { name: data.name ?? user.name, email: data.email ?? user.email, phone: data.phone ?? user.profile?.phone },
            ip,
        });
    }
    return updated;
};

export const resetUserPasswordService = async (id: string, customPassword?: string, adminUserId?: string, ip?: string) => {
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);

    const tempPassword = customPassword || "Nex@" + Math.random().toString(36).slice(-6) + Math.floor(100 + Math.random() * 900);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await resetUserPasswordAdmin(id, passwordHash, adminUserId);
    await deleteUserSession(id);
    if (adminUserId) {
        await recordAuditLog({
            userId: adminUserId,
            action: "UPDATE",
            entity: "USER_PASSWORD",
            entityId: id,
            oldValue: { email: user.email, passwordChangedAt: user.passwordChangedAt },
            newValue: { email: user.email, resetType: customPassword ? "CUSTOM_OVERRIDE" : "TEMPORARY_AUTO_GENERATED" },
            ip,
        });
    }

    // Send transactional notification email to user
    try {
        await transporter.sendMail({
            from: '"Nexions Security" <support@nexions.io>',
            to: user.email,
            subject: "Your Nexions Account Password Has Been Reset",
            html: `
            <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #0f172a; margin-top: 0;">Password Reset by Administrator</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>A Nexions platform administrator has generated a new password for your account.</p>
                <div style="background-color: #f1f5f9; padding: 14px 18px; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: bold; color: #ea580c; margin: 18px 0;">
                    ${tempPassword}
                </div>
                <p style="color: #64748b; font-size: 13px;">Please log in using this temporary password and immediately change it in your Account Settings.</p>
            </div>
            `,
        });
    } catch (e: any) {
        console.error("Failed to deliver reset password notification email:", e?.message);
    }

    return { temporaryPassword: tempPassword, email: user.email };
};

export const sendUserEmailService = async (id: string, subject: string, message: string, adminUserId?: string) => {
    const user = await getUserByIdAdmin(id);
    if (!user) throw new AppError("User not found", 404);

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <span style="display: inline-block; background-color: #ea580c; color: #ffffff; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px;">NEXIONS PLATFORM</span>
        <h2 style="color: #0f172a; margin: 0 0 16px 0;">${subject}</h2>
        <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${user.name}</strong>,</p>
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-bottom: 24px;">${message}</div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Sent by Nexions Platform Administration. Need help? Visit our Help Center.</p>
    </div>
    `;

    await transporter.sendMail({
        from: '"Nexions Platform Support" <support@nexions.io>',
        to: user.email,
        subject,
        html,
    });

    return { sent: true, to: user.email };
};

export const bulkUpdateUserStatusService = async (userIds: string[], status: string, adminUserId?: string, ip?: string) => {
    const validStatuses = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid status", 400);

    let targetIds = userIds;
    if (adminUserId && (status === "SUSPENDED" || status === "DEACTIVATED")) {
        targetIds = userIds.filter((uid) => uid !== adminUserId);
        if (targetIds.length === 0) {
            throw new AppError("Safety Protection: You cannot ban, suspend, or deactivate your own account.", 400);
        }
    }
    const result = await bulkUpdateUsersStatusAdmin(targetIds, status, adminUserId);
    for (const uid of targetIds) {
        await deleteUserSession(uid);
    }
    if (status === "SUSPENDED" || status === "DEACTIVATED") {
        await prisma.refreshToken.deleteMany({ where: { userId: { in: targetIds } } });
    }
    if (adminUserId) {
        for (const uid of targetIds) {
            await recordAuditLog({
                userId: adminUserId,
                action: "UPDATE",
                entity: "USER_STATUS",
                entityId: uid,
                oldValue: { operation: "BULK_UPDATE" },
                newValue: { status, operation: "BULK_UPDATE" },
                ip,
            });
        }
    }
    return result;
};

export const bulkSendUserEmailService = async (userIds: string[], subject: string, message: string, adminUserId?: string) => {
    const users = await getUsersByIdsAdmin(userIds);
    if (!users.length) throw new AppError("No recipients found", 400);

    let deliveredCount = 0;
    for (const user of users) {
        try {
            const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <span style="display: inline-block; background-color: #ea580c; color: #ffffff; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px;">NEXIONS ANNOUNCEMENT</span>
                <h2 style="color: #0f172a; margin: 0 0 16px 0;">${subject}</h2>
                <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${user.name}</strong>,</p>
                <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-bottom: 24px;">${message}</div>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">Sent by Nexions Platform Administration.</p>
            </div>
            `;

            await transporter.sendMail({
                from: '"Nexions Platform Support" <support@nexions.io>',
                to: user.email,
                subject,
                html,
            });
            deliveredCount++;
        } catch (err: any) {
            console.error(`Failed sending bulk email to ${user.email}:`, err?.message);
        }
    }

    return { total: users.length, delivered: deliveredCount };
};

export const computeShopOnboardingAndHealth = (shop: any) => {
    const hasProfile = Boolean(shop.profile?.name && (shop.profile?.email || shop.profile?.phone));
    const hasLegal = Boolean(shop.legalInfo?.legalBusinessName && shop.legalInfo?.taxId);
    const taxVerified = shop.legalInfo?.taxIdStatus === "VERIFIED";
    const addressVerified = shop.legalInfo?.addressVerificationStatus === "VERIFIED";
    const kycVerified = shop.legalInfo?.ownerKycStatus === "VERIFIED";
    const docsCount = shop.legalInfo?.documents?.length ?? 0;
    const docsVerified = docsCount > 0 && shop.legalInfo?.documents?.every((d: any) => d.status === "VERIFIED");
    const walletReady = Boolean(shop.wallet?.stripeAccountId || shop.wallet?.payoutsEnabled);
    const approved = shop.status === "ACTIVE" && shop.legalInfo?.businessVerificationStatus === "VERIFIED";

    const checklist = [
        {
            id: "profile",
            title: "Basic Store Profile",
            description: "Store name, slug, description, and contact info",
            isComplete: hasProfile,
            status: hasProfile ? "VERIFIED" : "PENDING",
            badge: hasProfile ? "Complete" : "Incomplete",
        },
        {
            id: "legal_entity",
            title: "Legal Entity & Tax Info",
            description: "Business name, tax ID / EIN, and entity classification",
            isComplete: hasLegal,
            status: hasLegal ? (taxVerified ? "VERIFIED" : "IN_REVIEW") : "PENDING",
            badge: hasLegal ? "Submitted" : "Missing",
        },
        {
            id: "tax_id",
            title: "Tax ID Verification",
            description: "Validation of official IRS / Tax authority registry match",
            isComplete: taxVerified,
            status: shop.legalInfo?.taxIdStatus || "UNVERIFIED",
            badge: shop.legalInfo?.taxIdStatus || "UNVERIFIED",
        },
        {
            id: "address",
            title: "Business Address Verification",
            description: "Proof of physical operating address or registered office",
            isComplete: addressVerified,
            status: shop.legalInfo?.addressVerificationStatus || "UNVERIFIED",
            badge: shop.legalInfo?.addressVerificationStatus || "UNVERIFIED",
        },
        {
            id: "owner_kyc",
            title: "Owner Identity (KYC)",
            description: "Government-issued photo identification and AML verification",
            isComplete: kycVerified,
            status: shop.legalInfo?.ownerKycStatus || "UNVERIFIED",
            badge: shop.legalInfo?.ownerKycStatus || "UNVERIFIED",
        },
        {
            id: "legal_documents",
            title: "Legal Documents Vault",
            description: `${docsCount} document(s) uploaded; required certificates & licenses`,
            isComplete: docsVerified,
            status: docsCount === 0 ? "UNVERIFIED" : docsVerified ? "VERIFIED" : "IN_REVIEW",
            badge: `${docsCount} uploaded`,
        },
        {
            id: "wallet",
            title: "Stripe & Payout Wallet",
            description: "Merchant account connection for automated store payouts",
            isComplete: walletReady,
            status: walletReady ? "VERIFIED" : "PENDING",
            badge: walletReady ? "Configured" : "Not Linked",
        },
        {
            id: "approval",
            title: "Super Admin Final Approval",
            description: "Compliance clearance and live store trading enablement",
            isComplete: approved,
            status: shop.status === "ACTIVE" ? "VERIFIED" : (shop.status === "REJECTED" ? "REJECTED" : "PENDING"),
            badge: shop.status,
        },
    ];

    const completedSteps = checklist.filter(c => c.isComplete).length;
    const progressPercent = Math.round((completedSteps / checklist.length) * 100);

    let score = 40;
    if (hasProfile) score += 10;
    if (hasLegal) score += 10;
    if (taxVerified) score += 10;
    if (addressVerified) score += 10;
    if (kycVerified) score += 10;
    if (docsVerified) score += 10;
    if (walletReady) score += 5;
    if (shop.status === "ACTIVE") score += 5;

    const openFlags = (shop.riskFlags || []).filter((f: any) => !f.resolved);
    for (const flag of openFlags) {
        if (flag.severity === "CRITICAL") score -= 30;
        else if (flag.severity === "HIGH") score -= 15;
        else if (flag.severity === "MEDIUM") score -= 8;
        else if (flag.severity === "LOW") score -= 4;
    }

    if (shop.status === "SUSPENDED") score -= 25;
    if (shop.status === "REJECTED") score -= 35;

    score = Math.max(5, Math.min(100, score));

    let tier = "POOR";
    let tierLabel = "High Risk / Critical";
    let tierColor = "rose";
    if (score >= 90) {
        tier = "EXCELLENT";
        tierLabel = "Optimal Standing";
        tierColor = "emerald";
    } else if (score >= 75) {
        tier = "GOOD";
        tierLabel = "Good Health";
        tierColor = "blue";
    } else if (score >= 50) {
        tier = "FAIR";
        tierLabel = "Needs Attention";
        tierColor = "amber";
    }

    return {
        checklist,
        completedSteps,
        totalSteps: checklist.length,
        progressPercent,
        healthScore: {
            score,
            tier,
            tierLabel,
            tierColor,
            openFlagsCount: openFlags.length,
        },
    };
};

export const listShopsService = async (filters: {
    status?: string;
    verificationStatus?: string;
    riskLevel?: string;
    tab?: "all" | "pending_queue" | "flagged";
    search?: string;
    page?: number;
    limit?: number;
}) => {
    return listShopsAdmin(filters);
};

export const getShopByIdService = async (id: string) => {
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    const meta = computeShopOnboardingAndHealth(shop);
    return {
        ...shop,
        checklist: meta.checklist,
        completedSteps: meta.completedSteps,
        totalSteps: meta.totalSteps,
        progressPercent: meta.progressPercent,
        healthScoreMeta: meta.healthScore,
    };
};

export const updateShopStatusService = async (id: string, status: string, adminId?: string, ip?: string) => {
    const validStatuses = ["ACTIVE", "PAUSED", "SUSPENDED", "CLOSED", "REJECTED", "PENDING"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid shop status", 400);
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    const result = await updateShopStatusAdmin(id, status);
    if (adminId) {
        await recordAuditLog({
            userId: adminId,
            action: "UPDATE",
            entity: "SHOP",
            entityId: id,
            oldValue: { status: shop.status, slug: shop.slug },
            newValue: { status, slug: shop.slug },
            ip,
        });
    }
    return result;
};

export const approveShopService = async (
    id: string,
    adminId: string,
    adminName: string,
    notes?: string,
    ip?: string
) => {
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    if (shop.status === "ACTIVE") throw new AppError("Shop is already active", 400);
    const result = await approveShopAdmin(id, adminId, adminName, notes);
    await recordAuditLog({
        userId: adminId,
        action: "UPDATE",
        entity: "SHOP",
        entityId: id,
        oldValue: { status: shop.status, slug: shop.slug },
        newValue: { status: "ACTIVE", approvedBy: adminName, notes },
        ip,
    });
    return result;
};

export const rejectShopService = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    notes?: string,
    ip?: string
) => {
    if (!reason || !reason.trim()) throw new AppError("Rejection reason is required", 400);
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    const result = await rejectShopAdmin(id, adminId, adminName, reason.trim(), notes?.trim());
    await recordAuditLog({
        userId: adminId,
        action: "UPDATE",
        entity: "SHOP",
        entityId: id,
        oldValue: { status: shop.status, slug: shop.slug },
        newValue: { status: "REJECTED", reason: reason.trim(), notes: notes?.trim(), rejectedBy: adminName },
        ip,
    });
    return result;
};

export const suspendShopService = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    notes?: string,
    ip?: string
) => {
    if (!reason || !reason.trim()) throw new AppError("Suspension reason is required", 400);
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    const result = await suspendShopAdmin(id, adminId, adminName, reason.trim(), notes?.trim());
    await recordAuditLog({
        userId: adminId,
        action: "UPDATE",
        entity: "SHOP",
        entityId: id,
        oldValue: { status: shop.status, slug: shop.slug },
        newValue: { status: "SUSPENDED", reason: reason.trim(), notes: notes?.trim(), suspendedBy: adminName },
        ip,
    });
    return result;
};

export const closeShopService = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    notes?: string,
    ip?: string
) => {
    if (!reason || !reason.trim()) throw new AppError("Closure reason is required", 400);
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    const result = await closeShopAdmin(id, adminId, adminName, reason.trim(), notes?.trim());
    await recordAuditLog({
        userId: adminId,
        action: "UPDATE",
        entity: "SHOP",
        entityId: id,
        oldValue: { status: shop.status, slug: shop.slug },
        newValue: { status: "CLOSED", reason: reason.trim(), notes: notes?.trim(), closedBy: adminName },
        ip,
    });
    return result;
};

export const reopenShopService = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    targetStatus: "ACTIVE" | "PENDING" = "ACTIVE",
    ip?: string
) => {
    if (!reason || !reason.trim()) throw new AppError("Reopen reason is required", 400);
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    if (shop.status === "ACTIVE") throw new AppError("Shop is already active", 400);
    const result = await reopenShopAdmin(id, adminId, adminName, reason.trim(), targetStatus);
    await recordAuditLog({
        userId: adminId,
        action: "UPDATE",
        entity: "SHOP",
        entityId: id,
        oldValue: { status: shop.status, slug: shop.slug },
        newValue: { status: targetStatus, reason: reason.trim(), reopenedBy: adminName },
        ip,
    });
    return result;
};

export const updateShopVerificationService = async (
    id: string,
    adminId: string,
    adminName: string,
    data: any
) => {
    const shop = await getShopByIdAdmin(id);
    if (!shop) throw new AppError("Shop not found", 404);
    return updateShopVerificationAdmin(id, adminId, adminName, data);
};

export const addShopLegalDocumentService = async (
    shopId: string,
    data: { type: any; name: string; fileUrl: string; fileSize?: number; mimeType?: string }
) => {
    if (!data.name || !data.fileUrl) throw new AppError("Document name and URL are required", 400);
    const shop = await getShopByIdAdmin(shopId);
    if (!shop) throw new AppError("Shop not found", 404);
    return addShopLegalDocumentAdmin(shopId, data);
};

export const updateShopLegalDocumentStatusService = async (
    documentId: string,
    status: any,
    rejectionReason?: string,
    notes?: string
) => {
    const validStatuses = ["PENDING", "IN_REVIEW", "VERIFIED", "REJECTED"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid document verification status", 400);
    return updateShopLegalDocumentStatusAdmin(documentId, status, rejectionReason, notes);
};

export const deleteShopLegalDocumentService = async (documentId: string) => {
    return deleteShopLegalDocumentAdmin(documentId);
};

export const addShopAdminNoteService = async (
    shopId: string,
    adminId: string,
    adminName: string,
    content: string
) => {
    if (!content || !content.trim()) throw new AppError("Note content cannot be empty", 400);
    const shop = await getShopByIdAdmin(shopId);
    if (!shop) throw new AppError("Shop not found", 404);
    return addShopAdminNoteAdmin(shopId, adminId, adminName, content.trim());
};

export const addShopRiskFlagService = async (
    shopId: string,
    data: { flag: string; severity?: any; description?: string }
) => {
    if (!data.flag || !data.flag.trim()) throw new AppError("Flag identifier is required", 400);
    const shop = await getShopByIdAdmin(shopId);
    if (!shop) throw new AppError("Shop not found", 404);
    return addShopRiskFlagAdmin(shopId, data);
};

export const resolveShopRiskFlagService = async (
    flagId: string,
    adminName: string,
    notes?: string
) => {
    return resolveShopRiskFlagAdmin(flagId, adminName, notes);
};

export const listReviewsService = async (filters: {
    search?: string;
    rating?: number;
    isVisible?: boolean;
    shopId?: string;
    page?: number;
    limit?: number;
}) => {
    return listReviewsAdmin(filters);
};

export const toggleReviewVisibilityService = async (id: string, isVisible: boolean) => {
    return updateReviewVisibilityAdmin(id, isVisible);
};

export const deleteReviewAdminService = async (id: string) => {
    return deleteReviewAdmin(id);
};

export const listShipmentsService = (filters: { status?: string; search?: string; page?: number; limit?: number }) => listShipmentsAdmin(filters);

export const listReturnsService = (filters: { status?: string; search?: string; page?: number; limit?: number }) => listReturnsAdmin(filters);

export const getReturnService = async (id: string) => {
    const request = await getReturnAdmin(id);
    if (!request) throw new AppError("Return request not found.", 404);
    return request;
};

export const refundReturnService = async (id: string, adminUserId?: string, ip?: string) => {
    const request = await getReturnAdmin(id);
    if (!request) throw new AppError("Return request not found.", 404);
    if (request.resolution !== "REFUND") throw new AppError("This return requests a replacement, not a refund.", 400);

    const eligibleStatuses = ["APPROVED", "ITEM_RECEIVED", "REQUESTED", "UNDER_REVIEW", "REFUND_PENDING"];
    if (!eligibleStatuses.includes(request.status)) {
        throw new AppError(`Cannot refund return in '${request.status}' status. Only approved or active returns can be refunded.`, 400);
    }

    const previousStatus = request.status;
    const updated = await setReturnRefundPendingAdmin(id);
    if (!updated) throw new AppError("Return request not found.", 404);
    try {
        const refundResult = await initiateRefundService(request.orderId);
        if (adminUserId) {
            await recordAuditLog({
                userId: adminUserId,
                action: "UPDATE",
                entity: "REFUND",
                entityId: id,
                oldValue: { returnId: id, orderId: request.orderId, status: previousStatus, refundStatus: "PENDING" },
                newValue: { returnId: id, orderId: request.orderId, status: "REFUNDED", refundResult },
                ip,
            });
        }
        return refundResult;
    } catch (error) {
        await prismaReturnRollback(id, previousStatus);
        throw error;
    }
};

const prismaReturnRollback = async (id: string, fallbackStatus: string = "APPROVED") => {
    const { prisma } = await import("../../config/db.js");
    await prisma.$transaction(async (tx) => {
        await tx.returnStatusHistory.create({ data: { returnRequestId: id, status: fallbackStatus as any, note: "Refund initiation failed; returned to previous state." } });
        await tx.returnRequest.update({ where: { id }, data: { status: fallbackStatus as any } });
    });
};

// ─── Orders ───────────────────────────────────
export const listOrdersService = (filters: {
    status?: string;
    shopId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}) => listOrdersAdmin(filters);

export const getOrderByIdAdminService = async (id: string) => {
    const order = await getOrderByIdAdmin(id);
    if (!order) throw new AppError("Order not found", 404);
    return order;
};

export const getPlatformAnalyticsService = () => getPlatformAnalytics();

export const listPayoutsService = (filters: { page?: number; limit?: number }) => listPayoutsAdmin(filters);
export const getPayoutsSummaryService = () => getPayoutsSummary();
export const getBillingOverviewService = () => getBillingOverview();

export const listAuditLogsService = (filters: {
    userId?: string;
    entity?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => listAuditLogsAdmin(filters);

export const listCouponsService = (filters: {
    shopId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}) => listCouponsAdmin(filters);

export const toggleCouponService = async (id: string, adminUserId?: string, ip?: string) => {
    const { prisma } = await import("../../config/db.js");
    const prevCoupon = await prisma.coupon.findUnique({ where: { id }, select: { id: true, code: true, isActive: true } });
    const result = await toggleCouponAdmin(id);
    if (!result) throw new AppError("Coupon not found", 404);
    if (adminUserId) {
        await recordAuditLog({
            userId: adminUserId,
            action: "UPDATE",
            entity: "COUPON",
            entityId: id,
            oldValue: { code: prevCoupon?.code, isActive: prevCoupon?.isActive },
            newValue: { code: prevCoupon?.code, isActive: result.isActive },
            ip,
        });
    }
    return result;
};

// ─── Products (Admin) ──────────────────────────
export const listProductsService = (filters: {
    search?: string;
    status?: string;
    shopId?: string;
    platformCategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
}) => listProductsAdmin(filters);

export const getProductByIdAdminService = async (id: string) => {
    const product = await getProductByIdAdmin(id);
    if (!product) throw new AppError("Product not found", 404);
    return product;
};

export const updateProductStatusService = async (
    id: string,
    status: "ACTIVE" | "DRAFT" | "ARCHIVED",
    adminUserId?: string,
    ip?: string
) => {
    const validStatuses = ["ACTIVE", "DRAFT", "ARCHIVED"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid product status", 400);
    const product = await getProductByIdAdmin(id);
    const updated = await updateProductStatusAdmin(id, status, adminUserId);
    if (!updated) throw new AppError("Product not found", 404);
    if (adminUserId) {
        await recordAuditLog({
            userId: adminUserId,
            action: "UPDATE",
            entity: "PRODUCT_MODERATION",
            entityId: id,
            oldValue: { name: product?.name, status: product?.status, shopId: product?.shopId },
            newValue: { name: updated.name, status: updated.status, shopId: product?.shopId },
            ip,
        });
    }
    return updated;
};


export const impersonateUserService = async (
    targetUserId: string,
    adminUser: { id: string; email: string; name: string },
    ip?: string
) => {
    if (adminUser.id === targetUserId) {
        throw new AppError("Cannot impersonate yourself.", 400);
    }
    const targetUser = await getUserByIdAdmin(targetUserId);
    if (!targetUser) {
        throw new AppError("User to impersonate not found.", 404);
    }
    if (targetUser.role === "SUPER_ADMIN") {
        throw new AppError("Safety Protection: Cannot impersonate another Super Administrator.", 403);
    }
    if (targetUser.status === "SUSPENDED" || targetUser.status === "DELETED") {
        throw new AppError(`Cannot impersonate user with status ${targetUser.status}.`, 400);
    }

    const { generateAccessToken, generateRefreshToken } = await import("../auth/token.service.js");
    const accessToken = generateAccessToken(targetUser.id, targetUser.role);
    const refreshToken = generateRefreshToken(targetUser.id);

    await recordAuditLog({
        userId: adminUser.id,
        action: "LOGIN",
        entity: "IMPERSONATION",
        entityId: targetUserId,
        oldValue: null,
        newValue: {
            impersonatedUserId: targetUser.id,
            impersonatedEmail: targetUser.email,
            impersonatedName: targetUser.name,
            impersonatedRole: targetUser.role,
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            timestamp: new Date().toISOString(),
        },
        ip,
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
            status: targetUser.status,
            profile: targetUser.profile,
        },
    };
};
