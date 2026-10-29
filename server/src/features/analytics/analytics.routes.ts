import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeShopAccess } from "../../middleware/authorizeShopAccess.middleware.js";
import { getShopAnalyticsController } from "./analytics.controller.js";

const router = express.Router({ mergeParams: true });

// Matches GET /api/v1/shops/:shopId/analytics
// or GET /api/v1/analytics/:shopId
router.get(
    "/",
    authenticate,
    authorizeShopAccess,
    getShopAnalyticsController
);

router.get(
    "/:shopId",
    authenticate,
    authorizeShopAccess,
    getShopAnalyticsController
);

export default router;
