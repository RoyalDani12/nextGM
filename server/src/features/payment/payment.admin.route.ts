import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeSuperAdmin } from "../../middleware/authorizeSuperAdmin.middleware.js";
import { initializeRefundController } from "./payment.controller.js";

const router = express.Router()

router.post(
  "/:orderId/refund",
  authenticate,
  authorizeSuperAdmin,
  initializeRefundController
)

export default router