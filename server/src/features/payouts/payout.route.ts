import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    getPayoutStatusController,
    createOnboardingLinkController,
    withdrawFundsController,
} from "./payout.controller.js";

const router = express.Router();

router.get("/:shopId/status", authenticate, getPayoutStatusController);
router.post("/:shopId/onboard", authenticate, createOnboardingLinkController);
router.post("/:shopId/withdraw", authenticate, withdrawFundsController);

export default router;
