import express from "express";

import {
    addToCartController,
    getCartController,
    updateCartItemController,
    removeCartItemController,
    clearCartController,
    mergeCartController,
} from "./cart.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
    addToCartSchema,
    updateCartItemSchema,
} from "./cart.schema.js";

import {
    optionalAuthenticate,
} from "../../middleware/optional-auth.middleware.js";

const router = express.Router();


// Guest OR authenticated
router.post(
    "/items",
    optionalAuthenticate,
    validate(addToCartSchema),
    addToCartController,
);


// Guest OR authenticated
router.get(
    "/view-cart-items",
    optionalAuthenticate,
    getCartController,
);


// Guest OR authenticated
router.patch(
    "/items/:itemId",
    optionalAuthenticate,
    validate(updateCartItemSchema),
    updateCartItemController,
);


// Guest OR authenticated
router.delete(
    "/items/:itemId",
    optionalAuthenticate,
    removeCartItemController,
);


// Guest OR authenticated
router.delete(
    "/clear",
    optionalAuthenticate,
    clearCartController,
);


// Authenticated only
router.post(
    "/merge",
    authenticate,
    mergeCartController,
);

export default router;