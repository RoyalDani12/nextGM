import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeShopAccess } from "../../middleware/authorizeShopAccess.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createCouponController, deleteCouponController, listCouponsController, updateCouponController } from "./coupon.controller.js";
import { couponIdParamSchema, createCouponSchema, updateCouponSchema } from "./coupon.schema.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate, authorizeShopAccess);
router.get("/", listCouponsController);
router.post("/", validate(createCouponSchema), createCouponController);
router.patch("/:couponId", validate(couponIdParamSchema), validate(updateCouponSchema), updateCouponController);
router.delete("/:couponId", validate(couponIdParamSchema), deleteCouponController);

export default router;
