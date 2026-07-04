import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { checkoutSchema } from "./order.schema.js"
import { checkoutController } from "./order.controller.js"

const router = express.Router()

router.post(
    "/checkout",
    authenticate,
    validate(checkoutSchema),
    checkoutController
)

export default router