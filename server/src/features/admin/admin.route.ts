import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeSuperAdmin } from "../../middleware/authorizeSuperAdmin.middleware.js";
import {
    getPlatformStatsController,
    listUsersController,
    getUserByIdController,
    updateUserRoleController,
    updateUserStatusController,
    updateUserProfileController,
    resetUserPasswordController,
    sendUserEmailController,
    bulkUpdateUserStatusController,
    bulkSendUserEmailController,
    listShopsController,
    getShopByIdController,
    updateShopStatusController,
    approveShopController,
    rejectShopController,
    suspendShopController,
    closeShopController,
    reopenShopController,
    updateShopVerificationController,
    addShopDocumentController,
    updateShopDocumentStatusController,
    deleteShopDocumentController,
    addShopAdminNoteController,
    addShopRiskFlagController,
    resolveShopRiskFlagController,
    listReviewsController,
    toggleReviewVisibilityController,
    deleteReviewAdminController,
    listShipmentsController,
    listReturnsController,
    getReturnController,
    updateReturnStatusAdminController,
    refundReturnController,
    listOrdersController,
    getOrderByIdController,
    getOrderAnalyticsController,
    getPlatformAnalyticsController,
    listPayoutsController,
    getPayoutsSummaryController,
    getBillingOverviewController,
    listAuditLogsController,
    listCouponsController,
    toggleCouponController,
    listProductsController,
    getProductByIdAdminController,
    updateProductStatusAdminController,
    impersonateUserController,
} from "./admin.controller.js";

const router = express.Router();

// All admin routes require auth + SUPER_ADMIN role
router.use(authenticate, authorizeSuperAdmin);

// Platform stats
router.get("/stats", getPlatformStatsController);

// Users
router.post("/users/bulk-status", bulkUpdateUserStatusController);
router.post("/users/bulk-email", bulkSendUserEmailController);
router.get("/users", listUsersController);
router.get("/users/:id", getUserByIdController);
router.patch("/users/:id/role", updateUserRoleController);
router.patch("/users/:id/status", updateUserStatusController);
router.patch("/users/:id/profile", updateUserProfileController);
router.post("/users/:id/reset-password", resetUserPasswordController);
router.post("/users/:id/impersonate", impersonateUserController);
router.post("/users/:id/send-email", sendUserEmailController);

// Shops & Verification Approval Workflow
router.get("/shops", listShopsController);
router.get("/shops/:id", getShopByIdController);
router.patch("/shops/:id/status", updateShopStatusController);
router.post("/shops/:id/approve", approveShopController);
router.post("/shops/:id/reject", rejectShopController);
router.post("/shops/:id/suspend", suspendShopController);
router.post("/shops/:id/close", closeShopController);
router.post("/shops/:id/reopen", reopenShopController);
router.patch("/shops/:id/verification", updateShopVerificationController);
router.post("/shops/:id/documents", addShopDocumentController);
router.patch("/shops/:id/documents/:documentId", updateShopDocumentStatusController);
router.delete("/shops/:id/documents/:documentId", deleteShopDocumentController);
router.post("/shops/:id/notes", addShopAdminNoteController);
router.post("/shops/:id/risk-flags", addShopRiskFlagController);
router.patch("/shops/:id/risk-flags/:flagId/resolve", resolveShopRiskFlagController);

// Reviews
router.get("/reviews", listReviewsController);
router.patch("/reviews/:id/visibility", toggleReviewVisibilityController);
router.delete("/reviews/:id", deleteReviewAdminController);

router.get("/shipments", listShipmentsController);
router.get("/returns", listReturnsController);
router.get("/returns/:id", getReturnController);
router.patch("/returns/:id/status", updateReturnStatusAdminController);
router.post("/returns/:id/refund", refundReturnController);

// Orders
router.get("/orders", listOrdersController);
router.get("/orders/analytics", getOrderAnalyticsController);
router.get("/orders/:orderId", getOrderByIdController);

// Analytics
router.get("/analytics/platform", getPlatformAnalyticsController);

// Payouts
router.get("/payouts", listPayoutsController);
router.get("/payouts/summary", getPayoutsSummaryController);

// Billing
router.get("/billing/overview", getBillingOverviewController);

// Audit Logs
router.get("/audit-logs", listAuditLogsController);

// Coupons
router.get("/coupons", listCouponsController);
router.patch("/coupons/:id/toggle", toggleCouponController);


// Products
router.get("/products", listProductsController);
router.get("/products/:id", getProductByIdAdminController);
router.patch("/products/:id/status", updateProductStatusAdminController);

export default router;
