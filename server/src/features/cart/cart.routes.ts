import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { addToCartSchema } from "./cart.schema.js"
import { addToCartController,getCartController } from "./cart.controller.js"

const router = express.Router()

router.post(
    "/items",
    authenticate,
    validate(addToCartSchema),
    addToCartController
)
router.get(
    "/view-cart-items",
    authenticate,
    getCartController
)

export default router