import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { addToCartSchema, mergeCartSchema, updateCartItemSchema } from "./cart.schema.js"
import {
     addToCartController,
     getCartController,
     updateCartItemController,
     removeCartItemController,
     clearCartController,
     mergeCartController,
     } from "./cart.controller.js"

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
router.patch(
    "/items/:itemId",
    authenticate,
    validate(updateCartItemSchema),
    updateCartItemController
)
router.delete(
    "/items/:itemId",
    authenticate,
    removeCartItemController
)
router.delete(
    "/clear",
    authenticate,
    clearCartController
)
router.post(
    "/merge",
    authenticate,
    validate(mergeCartSchema),
    mergeCartController
)

export default router