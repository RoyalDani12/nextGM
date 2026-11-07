// src/features/product/product.public.routes.ts
import express from "express"
import { getPublicProductController, browseProductsController, getPromotedProductsController, getPublicCouponsController } from "./product.controller.js"
import { browseProductsSchema } from "./product.schema.js"
import { validate } from "../../middleware/validate.middleware.js"

const router = express.Router()

router.get(
    "/",
    validate(browseProductsSchema),
    browseProductsController
)
router.get("/promotions", getPromotedProductsController)
router.get("/coupons", getPublicCouponsController)
router.get(
    "/:productId",
    getPublicProductController
    
)

export default router
