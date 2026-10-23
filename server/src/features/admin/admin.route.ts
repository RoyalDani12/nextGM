import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeSuperAdmin } from "../../middleware/authorizeSuperAdmin.middleware.js";
import {
    getPlatformStatsController,
    listUsersController,
    getUserByIdController,
    updateUserRoleController,
    updateUserStatusController,
    listShopsController,
    getShopByIdController,
    updateShopStatusController,
    listReviewsController,
    toggleReviewVisibilityController,
    deleteReviewAdminController,
    listShipmentsController,
} from "./admin.controller.js";

const router = express.Router();

// All admin routes require auth + SUPER_ADMIN role
router.use(authenticate, authorizeSuperAdmin);

// Platform stats
router.get("/stats", getPlatformStatsController);

// Users
router.get("/users", listUsersController);
router.get("/users/:id", getUserByIdController);
router.patch("/users/:id/role", updateUserRoleController);
router.patch("/users/:id/status", updateUserStatusController);

// Shops
router.get("/shops", listShopsController);
router.get("/shops/:id", getShopByIdController);
router.patch("/shops/:id/status", updateShopStatusController);

// Reviews
router.get("/reviews", listReviewsController);
router.patch("/reviews/:id/visibility", toggleReviewVisibilityController);
router.delete("/reviews/:id", deleteReviewAdminController);

router.get("/shipments", listShipmentsController);

export default router;

