import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { addToCartSchema } from "./cart.schema.js"
import { addToCartController } from "./cart.controller.js"

const router = express.Router()

router.post(
    "/items",
    authenticate,
    validate(addToCartSchema),
    addToCartController
)

export default router