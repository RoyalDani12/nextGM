import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createPaymentIntentController } from "./payment.controller.js";

const router = express.Router();

router.post(
    "/:checkoutId/intent",
    authenticate,
    createPaymentIntentController,
);

export default router;