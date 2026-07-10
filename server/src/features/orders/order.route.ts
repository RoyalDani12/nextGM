import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { checkoutSchema, getOrdersSchema } from "./order.schema.js"
import {
    cancelOrderController,
      checkoutController,
      getCustomerOrderByIdController,
      getCustomerOrderController,
      getShopOrdersController
     } from "./order.controller.js"
import { authorizeShopAccess } from "../../middleware/authorizeShopAccess.middleware.js"

const router = express.Router()

router.post(
    "/checkout",
    authenticate,
    validate(checkoutSchema),
    checkoutController
)

router.get(
    "/",
    authenticate,
    validate(getOrdersSchema),
    getCustomerOrderController
)
router.get(
    "/:orderId",
    authenticate,
    getCustomerOrderByIdController
)

router.post(
    "/:orderId/cancel",
    authenticate,
    cancelOrderController
)

router.get(
    "/:shopId/orders",
    authenticate,
    authorizeShopAccess,
    validate(getOrdersSchema),
    getShopOrdersController
)
export default router