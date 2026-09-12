import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {  createCheckoutSessionController } from "./payment.controller.js";

const router = express.Router();

router.post(
    "/checkout/:checkoutId/session",
    authenticate,
    createCheckoutSessionController,
);

export default router;