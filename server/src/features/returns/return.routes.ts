import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  cancelCustomerReturnController,
  createReturnController,
  getCustomerReturnByIdController,
  getCustomerReturnsController,
  updateCustomerReturnEvidenceController,
  getShopReturnsController,
  getShopReturnByIdController,
  updateShopReturnStatusController,
} from "./return.controller.js";
import {
  createReturnSchema,
  returnIdParamsSchema,
  updateReturnEvidenceSchema,
  sellerReturnsQuerySchema,
  sellerReturnParamsSchema,
  sellerReturnStatusSchema,
} from "./return.schema.js";
import { authorizeShopAccess } from "../../middleware/authorizeShopAccess.middleware.js";

const router = express.Router();
router.use(authenticate);

router.post("/", validate(createReturnSchema), createReturnController);
router.get("/", getCustomerReturnsController);
router.get("/:returnId", validate(returnIdParamsSchema), getCustomerReturnByIdController);
router.post("/:returnId/cancel", validate(returnIdParamsSchema), cancelCustomerReturnController);
router.patch(
  "/:returnId/evidence",
  validate(updateReturnEvidenceSchema),
  updateCustomerReturnEvidenceController,
);

const sellerRouter = express.Router();
sellerRouter.use(authenticate, authorizeShopAccess);
sellerRouter.get("/:shopId/returns", validate(sellerReturnsQuerySchema), getShopReturnsController);
sellerRouter.get("/:shopId/returns/:returnId", validate(sellerReturnParamsSchema), getShopReturnByIdController);
sellerRouter.patch("/:shopId/returns/:returnId/status", validate(sellerReturnStatusSchema), updateShopReturnStatusController);

export default router;
export { sellerRouter };
