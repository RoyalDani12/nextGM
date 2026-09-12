import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeSuperAdmin } from "../../middleware/authorizeSuperAdmin.middleware.js";
import { initiateCheckoutRefundController } from "./payment.controller.js";

const router = express.Router()

router.post(
    "/checkout/:checkoutId/refund",
    authenticate,
    authorizeSuperAdmin,
    initiateCheckoutRefundController,
);

export default router