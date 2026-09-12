import type {
    Request,
    Response,
} from "express";

import {
    addToCartService,
    getCartService,
    updateCartItemService,
    removeCartItemService,
    clearCartService,
    mergeCartService,
} from "./cart.service.js";

import {
    setGuestCartCookie,
    clearGuestCartCookie,
    GUEST_CART_COOKIE,
} from "./cart.cookie.js";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";


// ─────────────────────────────────────────
// ADD
// ─────────────────────────────────────────

export const addToCartController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const userId =
                req.user?.id;

            const guestToken =
                req.cookies?.[
                    GUEST_CART_COOKIE
                ];

            const result =
                await addToCartService(
                    {
                        userId,
                        guestToken,
                    },
                    req.body,
                );

            if (
                result.isGuest &&
                result.guestToken &&
                !guestToken
            ) {
                setGuestCartCookie(
                    res,
                    result.guestToken,
                );
            }

            res.status(201).json({
                success: true,
                statusCode: 201,
                message:
                    "Item added to cart.",
                data: result.cartItem,
            });
        },
    );

    export const getCartController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const userId =
                req.user?.id;

            const guestToken =
                req.cookies?.[
                    GUEST_CART_COOKIE
                ];

            const result =
                await getCartService({
                    userId,
                    guestToken,
                });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message:
                    "Cart fetched successfully.",
                data: result,
            });
        },
    );

    export const updateCartItemController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const userId =
                req.user?.id;

            const guestToken =
                req.cookies?.[
                    GUEST_CART_COOKIE
                ];

            const itemId = String(req.params.itemId);

            if (!itemId) {
                throw new AppError(
                    "Cart item ID is required.",
                    400,
                );
            }

            const result =
                await updateCartItemService(
                    {
                        userId,
                        guestToken,
                    },
                    itemId,
                    req.body.quantity,
                );

            res.status(200).json({
                success: true,
                statusCode: 200,
                message:
                    "Cart item updated.",
                data: result,
            });
        },
    );

    export const removeCartItemController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const userId =
                req.user?.id;

            const guestToken =
                req.cookies?.[
                    GUEST_CART_COOKIE
                ];

            const itemId = String(req.params.itemId);

            if (!itemId) {
                throw new AppError(
                    "Cart item ID is required.",
                    400,
                );
            }

            const result =
                await removeCartItemService(
                    {
                        userId,
                        guestToken,
                    },
                    itemId,
                );

            res.status(200).json({
                success: true,
                statusCode: 200,
                message:
                    result.message,
            });
        },
    );

    export const clearCartController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const userId =
                req.user?.id;

            const guestToken =
                req.cookies?.[
                    GUEST_CART_COOKIE
                ];

            const result =
                await clearCartService({
                    userId,
                    guestToken,
                });

            res.status(200).json({
                success: true,
                statusCode: 200,
                message:
                    result.message,
            });
        },
    );

    export const mergeCartController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const userId =
                req.user?.id;

            if (!userId) {
                throw new AppError(
                    "Unauthorized.",
                    401,
                );
            }

            const guestToken =
                req.cookies?.[
                    GUEST_CART_COOKIE
                ];

            const result =
                await mergeCartService(
                    userId,
                    guestToken,
                );

            if (result.merged) {
                clearGuestCartCookie(
                    res,
                );
            }

            res.status(200).json({
                success: true,
                statusCode: 200,
                message:
                    result.merged
                        ? "Guest cart merged successfully."
                        : "No guest cart to merge.",
                data: result,
            });
        },
    );