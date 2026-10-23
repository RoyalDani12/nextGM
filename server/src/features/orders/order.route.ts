import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { checkoutSchema, getOrdersSchema, markOrderShippedSchema,updateOrderStatusSchema } from "./order.schema.js"
import {
    cancelOrderController,
      checkoutController,
      getCustomerOrderByIdController,
      getCustomerOrderController,
      getShopOrderByIdController,
      getShopOrdersController,
      markOrderShippedController,
      updateOrderStatusController,
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
router.get(
    "/:shopId/orders/:orderId",
    authenticate,
    authorizeShopAccess,
    getShopOrderByIdController
)

router.patch(
    "/:shopId/orders/:orderId/shipment",
    authenticate,
    authorizeShopAccess,
    validate(markOrderShippedSchema),
    markOrderShippedController,
);

router.patch(
    "/:shopId/orders/:orderId/status",
    authenticate,
    authorizeShopAccess,
    validate(updateOrderStatusSchema),
    updateOrderStatusController,
);
export default router
