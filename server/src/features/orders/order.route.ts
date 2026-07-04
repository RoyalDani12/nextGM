import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { checkoutSchema, getOrdersSchema } from "./order.schema.js"
import { checkoutController, getCustomerOrderController } from "./order.controller.js"

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
export default router