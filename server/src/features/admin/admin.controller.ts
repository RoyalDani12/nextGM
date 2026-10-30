import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
    getPlatformStatsService,
    listUsersService,
    getUserByIdService,
    updateUserRoleService,
    updateUserStatusService,
    updateUserProfileService,
    resetUserPasswordService,
    sendUserEmailService,
    bulkUpdateUserStatusService,
    bulkSendUserEmailService,
    listShopsService,
    getShopByIdService,
    updateShopStatusService,
    approveShopService,
    rejectShopService,
    suspendShopService,
    closeShopService,
    reopenShopService,
    updateShopVerificationService,
    addShopLegalDocumentService,
    updateShopLegalDocumentStatusService,
    deleteShopLegalDocumentService,
    addShopAdminNoteService,
    addShopRiskFlagService,
    resolveShopRiskFlagService,
    listReviewsService,
    toggleReviewVisibilityService,
    deleteReviewAdminService,
    listShipmentsService,
    listReturnsService,
    getReturnService,
    refundReturnService,
    listOrdersService,
    getOrderByIdAdminService,
    getPlatformAnalyticsService,
    listPayoutsService,
    getPayoutsSummaryService,
    getBillingOverviewService,
    listAuditLogsService,
    listCouponsService,
    toggleCouponService,
    listProductsService,
    getProductByIdAdminService,
    updateProductStatusService,
} from "./admin.service.js";

// ─── Platform Stats ───────────────────────────
export const getPlatformStatsController = asyncHandler(async (_req: Request, res: Response) => {
    const data = await getPlatformStatsService();
    res.status(200).json({ success: true, data });
});

// ─── Users ────────────────────────────────────
export const listUsersController = asyncHandler(async (req: Request, res: Response) => {
    const { role, status, search, page, limit } = req.query as Record<string, string>;
    const data = await listUsersService({
        role,
        status,
        search,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const getUserByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await getUserByIdService(id);
    res.status(200).json({ success: true, data });
});

export const updateUserRoleController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: string };
    const adminUserId = (req as any).user?.userId;
    const data = await updateUserRoleService(id, role, adminUserId);
    res.status(200).json({ success: true, message: "User role updated", data });
});


export const updateUserProfileController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const adminUserId = (req as any).user?.userId;
    const data = await updateUserProfileService(id, req.body, adminUserId);
    res.status(200).json({ success: true, message: "User profile updated", data });
});

export const resetUserPasswordController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { customPassword } = req.body as { customPassword?: string };
    const adminUserId = (req as any).user?.userId;
    const data = await resetUserPasswordService(id, customPassword, adminUserId);
    res.status(200).json({ success: true, message: "Password reset successfully", data });
});

export const sendUserEmailController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { subject, message } = req.body as { subject: string; message: string };
    const adminUserId = (req as any).user?.userId;
    const data = await sendUserEmailService(id, subject, message, adminUserId);
    res.status(200).json({ success: true, message: "Email sent successfully", data });
});

export const bulkUpdateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { userIds, status } = req.body as { userIds: string[]; status: string };
    const adminUserId = (req as any).user?.userId;
    const data = await bulkUpdateUserStatusService(userIds, status, adminUserId);
    res.status(200).json({ success: true, message: "Bulk user statuses updated", data });
});

export const bulkSendUserEmailController = asyncHandler(async (req: Request, res: Response) => {
    const { userIds, subject, message } = req.body as { userIds: string[]; subject: string; message: string };
    const adminUserId = (req as any).user?.userId;
    const data = await bulkSendUserEmailService(userIds, subject, message, adminUserId);
    res.status(200).json({ success: true, message: "Bulk email dispatched successfully", data });
});

export const updateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const adminUserId = (req as any).user?.userId;
    const data = await updateUserStatusService(id, status, adminUserId);
    res.status(200).json({ success: true, message: "User status updated", data });
});

// ─── Shops & Verification Workflow ─────────────
export const listShopsController = asyncHandler(async (req: Request, res: Response) => {
    const { status, verificationStatus, riskLevel, tab, search, page, limit } = req.query as Record<string, string>;
    const data = await listShopsService({
        status,
        verificationStatus,
        riskLevel,
        tab: tab as any,
        search,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const getShopByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await getShopByIdService(id);
    res.status(200).json({ success: true, data });
});

export const updateShopStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const data = await updateShopStatusService(id, status);
    res.status(200).json({ success: true, message: "Shop status updated", data });
});

export const approveShopController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { notes } = req.body as { notes?: string };
    const adminUser = req.user as any;
    const data = await approveShopService(id, adminUser.id, adminUser.name || "Super Admin", notes);
    res.status(200).json({ success: true, message: "Shop approved and activated successfully", data });
});

export const rejectShopController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { reason, notes } = req.body as { reason: string; notes?: string };
    const adminUser = req.user as any;
    const data = await rejectShopService(id, adminUser.id, adminUser.name || "Super Admin", reason, notes);
    res.status(200).json({ success: true, message: "Shop application rejected", data });
});

export const suspendShopController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { reason, notes } = req.body as { reason: string; notes?: string };
    const adminUser = req.user as any;
    const data = await suspendShopService(id, adminUser.id, adminUser.name || "Super Admin", reason, notes);
    res.status(200).json({ success: true, message: "Shop suspended", data });
});

export const closeShopController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { reason, notes } = req.body as { reason: string; notes?: string };
    const adminUser = req.user as any;
    const data = await closeShopService(id, adminUser.id, adminUser.name || "Super Admin", reason, notes);
    res.status(200).json({ success: true, message: "Shop closed permanently", data });
});

export const reopenShopController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { reason, targetStatus } = req.body as { reason: string; targetStatus?: "ACTIVE" | "PENDING" };
    const adminUser = req.user as any;
    const data = await reopenShopService(id, adminUser.id, adminUser.name || "Super Admin", reason, targetStatus);
    res.status(200).json({ success: true, message: "Shop reopened successfully", data });
});

export const updateShopVerificationController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const adminUser = req.user as any;
    const data = await updateShopVerificationService(id, adminUser.id, adminUser.name || "Super Admin", req.body);
    res.status(200).json({ success: true, message: "Verification details updated", data });
});

export const addShopDocumentController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await addShopLegalDocumentService(id, req.body);
    res.status(201).json({ success: true, message: "Legal document added", data });
});

export const updateShopDocumentStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params as { documentId: string };
    const { status, rejectionReason, notes } = req.body as { status: any; rejectionReason?: string; notes?: string };
    const data = await updateShopLegalDocumentStatusService(documentId, status, rejectionReason, notes);
    res.status(200).json({ success: true, message: "Document status updated", data });
});

export const deleteShopDocumentController = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params as { documentId: string };
    await deleteShopLegalDocumentService(documentId);
    res.status(200).json({ success: true, message: "Document deleted successfully" });
});

export const addShopAdminNoteController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { content } = req.body as { content: string };
    const adminUser = req.user as any;
    const data = await addShopAdminNoteService(id, adminUser.id, adminUser.name || "Super Admin", content);
    res.status(201).json({ success: true, message: "Admin note added", data });
});

export const addShopRiskFlagController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await addShopRiskFlagService(id, req.body);
    res.status(201).json({ success: true, message: "Risk flag added", data });
});

export const resolveShopRiskFlagController = asyncHandler(async (req: Request, res: Response) => {
    const { flagId } = req.params as { flagId: string };
    const { notes } = req.body as { notes?: string };
    const adminUser = req.user as any;
    const data = await resolveShopRiskFlagService(flagId, adminUser.name || "Super Admin", notes);
    res.status(200).json({ success: true, message: "Risk flag resolved", data });
});

// ─── Reviews ──────────────────────────────────
export const listReviewsController = asyncHandler(async (req: Request, res: Response) => {
    const { search, rating, isVisible, shopId, page, limit } = req.query as Record<string, string>;
    const data = await listReviewsService({
        search,
        rating: rating ? parseInt(rating) : undefined,
        isVisible: isVisible !== undefined ? isVisible === "true" : undefined,
        shopId,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const toggleReviewVisibilityController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { isVisible } = req.body as { isVisible: boolean };
    const data = await toggleReviewVisibilityService(id, isVisible);
    res.status(200).json({
        success: true,
        message: `Review ${isVisible ? "shown" : "hidden"} successfully`,
        data,
    });
});

export const deleteReviewAdminController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await deleteReviewAdminService(id);
    res.status(200).json({ success: true, message: "Review deleted successfully" });
});

export const listShipmentsController = asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query as Record<string, string>;
    const data = await listShipmentsService({ status, search, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
    res.status(200).json({ success: true, data });
});

export const listReturnsController = asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query as Record<string, string>;
    const data = await listReturnsService({ status, search, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
    res.status(200).json({ success: true, data });
});

export const getReturnController = asyncHandler(async (req: Request, res: Response) => {
    const data = await getReturnService(req.params.id as string);
    res.status(200).json({ success: true, data });
});

export const refundReturnController = asyncHandler(async (req: Request, res: Response) => {
    const data = await refundReturnService(req.params.id as string);
    res.status(200).json({ success: true, message: "Refund initiated.", data });
});

// ─── Orders ───────────────────────────────────
export const listOrdersController = asyncHandler(async (req: Request, res: Response) => {
    const { status, shopId, search, dateFrom, dateTo, page, limit } = req.query as Record<string, string>;
    const data = await listOrdersService({
        status,
        shopId,
        search,
        dateFrom,
        dateTo,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const getOrderByIdController = asyncHandler(async (req: Request, res: Response) => {
    const data = await getOrderByIdAdminService(req.params.orderId as string);
    res.status(200).json({ success: true, data });
});

export const getPlatformAnalyticsController = asyncHandler(async (_req: Request, res: Response) => {
    const data = await getPlatformAnalyticsService();
    res.status(200).json({ success: true, data });
});

export const listPayoutsController = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as Record<string, string>;
    const data = await listPayoutsService({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const getPayoutsSummaryController = asyncHandler(async (_req: Request, res: Response) => {
    const data = await getPayoutsSummaryService();
    res.status(200).json({ success: true, data });
});

export const getBillingOverviewController = asyncHandler(async (_req: Request, res: Response) => {
    const data = await getBillingOverviewService();
    res.status(200).json({ success: true, data });
});

export const listAuditLogsController = asyncHandler(async (req: Request, res: Response) => {
    const { userId, entity, action, dateFrom, dateTo, search, page, limit } = req.query as Record<string, string>;
    const data = await listAuditLogsService({
        userId,
        entity,
        action,
        dateFrom,
        dateTo,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const listCouponsController = asyncHandler(async (req: Request, res: Response) => {
    const { shopId, isActive, search, page, limit } = req.query as Record<string, string>;
    const data = await listCouponsService({
        shopId,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const toggleCouponController = asyncHandler(async (req: Request, res: Response) => {
    const data = await toggleCouponService(req.params.id as string);
    res.status(200).json({ success: true, message: "Coupon toggled", data });
});

// ─── Products (Admin) ──────────────────────────
export const listProductsController = asyncHandler(async (req: Request, res: Response) => {
    const { search, status, shopId, platformCategoryId, minPrice, maxPrice, inStock, page, limit } =
        req.query as Record<string, string>;
    const data = await listProductsService({
        search,
        status,
        shopId,
        platformCategoryId,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStock: inStock !== undefined ? inStock === "true" : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const getProductByIdAdminController = asyncHandler(async (req: Request, res: Response) => {
    const data = await getProductByIdAdminService(req.params.id as string);
    res.status(200).json({ success: true, data });
});

export const updateProductStatusAdminController = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: "ACTIVE" | "DRAFT" | "ARCHIVED" };
    const adminUserId = (req as any).user?.userId;
    const data = await updateProductStatusService(req.params.id as string, status, adminUserId);
    res.status(200).json({ success: true, message: "Product status updated", data });
});

