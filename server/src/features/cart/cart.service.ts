import { AppError } from "../../middleware/appError.js";
import { findPublicProductById } from "../product/product.repository.js";

import {
    getOrCreateUserCart,
    getOrCreateGuestCart,
    getCartWithItemsByUserId,
    getCartWithItemsByGuestToken,
    upsertCartItem,
    findCartItemByUser,
    findCartItemByGuestToken,
    updateCartItemQuantity,
    deleteCartItem,
    clearUserCart,
    clearGuestCart,
    mergeGuestCartIntoUserCart,
    findVariantById,
} from "./cart.repository.js";


import { generateGuestCartToken } from "./cart.token.js";


// ─────────────────────────────────────────
// ADD TO CART
// ─────────────────────────────────────────

interface AddToCartInput {
    productId: string;
    variantId?: string;
    quantity: number;
}

interface CartIdentity {
    userId?: string;
    guestToken?: string;
}

export const addToCartService = async (
    identity: CartIdentity,
    body: AddToCartInput,
) => {
    const {
        productId,
        variantId,
        quantity,
    } = body;

    const product = await findPublicProductById(productId);

    if (!product) {
        throw new AppError(
            "Product not found.",
            404,
        );
    }

    if (variantId) {
        const variant = await findVariantById(
            variantId,
            productId,
        );

        if (!variant) {
            throw new AppError(
                "Variant not found.",
                404,
            );
        }

        if (variant.stock < quantity) {
            throw new AppError(
                `Insufficient stock. Only ${variant.stock} available.`,
                400,
            );
        }
    } else {
        if (product.stock < quantity) {
            throw new AppError(
                `Insufficient stock. Only ${product.stock} available.`,
                400,
            );
        }
    }


    // Logged-in user
    if (identity.userId) {
        const cart = await getOrCreateUserCart(
            identity.userId,
        );

        return {
            cartItem: await upsertCartItem(
                cart.id,
                productId,
                quantity,
                variantId,
            ),

            isGuest: false,
            guestToken: undefined,
        };
    }


    // Guest
    const guestToken =
        identity.guestToken ?? generateGuestCartToken();

    const cart = await getOrCreateGuestCart(
        guestToken,
    );

    const cartItem = await upsertCartItem(
        cart.id,
        productId,
        quantity,
        variantId,
    );

    return {
        cartItem,
        isGuest: true,
        guestToken,
    };
};
export const getCartService = async (
    identity: CartIdentity,
) => {
    let cart;

    if (identity.userId) {
        cart = await getCartWithItemsByUserId(
            identity.userId,
        );
    } else if (identity.guestToken) {
        cart = await getCartWithItemsByGuestToken(
            identity.guestToken,
        );
    } else {
        return {
            items: [],
            groupedBy: [],
            totalItems: 0,
            totalPrice: "0.00",
        };
    }

    if (!cart || cart.items.length === 0) {
        return {
            items: [],
            groupedBy: [],
            totalItems: 0,
            totalPrice: "0.00",
        };
    }

    const shopMap: Record<
        string,
        {
            shop: {
                slug: string;
                name: string;
            };
            items: any[];
            subtotal: number;
        }
    > = {};

    for (const item of cart.items) {
        const shopSlug =
            item.product.shop.slug;

        const shopName =
            item.product.shop.profile?.name ??
            "Unknown shop";

        const isAvailable =
            item.product.status === "ACTIVE" &&
            item.product.shop.status === "ACTIVE";

        if (!shopMap[shopSlug]) {
            shopMap[shopSlug] = {
                shop: {
                    slug: shopSlug,
                    name: shopName,
                },
                items: [],
                subtotal: 0,
            };
        }

        const unitPrice = item.variant
            ? Number(item.variant.price)
            : Number(item.product.basePrice);

        const lineTotal =
            unitPrice * item.quantity;

        shopMap[shopSlug].items.push({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            productSlug: item.product.slug,

            variantId:
                item.variant?.id ?? null,

            variantName:
                item.variant?.name ?? null,

            unitePrice:
                unitPrice.toFixed(2),

            quantity:
                item.quantity,

            lineToal:
                lineTotal.toFixed(2),

            image:
                item.product.images[0]?.url ??
                null,

            isAvailable,
        });

        if (isAvailable) {
            shopMap[shopSlug].subtotal +=
                lineTotal;
        }
    }

    const groupedBy =
        Object.values(shopMap).map(
            (group) => ({
                ...group,
                subtotal:
                    group.subtotal.toFixed(2),
            }),
        );

    const totalPrice =
        groupedBy
            .reduce(
                (sum, group) =>
                    sum +
                    Number(group.subtotal),
                0,
            )
            .toFixed(2);

    return {
        items: cart.items.length,
        groupedBy,
        totalItems: cart.items.length,
        totalPrice,
    };
};

export const updateCartItemService = async (
    identity: CartIdentity,
    itemId: string,
    quantity: number,
) => {
    const item = identity.userId
        ? await findCartItemByUser(
              itemId,
              identity.userId,
          )
        : identity.guestToken
        ? await findCartItemByGuestToken(
              itemId,
              identity.guestToken,
          )
        : null;

    if (!item) {
        throw new AppError(
            "Cart item not found.",
            404,
        );
    }

    const availableStock =
        item.variant
            ? item.variant.stock
            : item.product.stock;

    if (availableStock < quantity) {
        throw new AppError(
            `Insufficient stock. Only ${availableStock} available.`,
            400,
        );
    }

    return updateCartItemQuantity(
        itemId,
        quantity,
    );
};

export const clearCartService = async (
    identity: CartIdentity,
) => {
    if (identity.userId) {
        const result =
            await clearUserCart(
                identity.userId,
            );

        return {
            message: `Cart cleared. ${result.count} item(s) removed.`,
        };
    }

    if (identity.guestToken) {
        const result =
            await clearGuestCart(
                identity.guestToken,
            );

        return {
            message: `Cart cleared. ${result.count} item(s) removed.`,
        };
    }

    return {
        message:
            "Cart is already empty.",
    };
};
export const mergeCartService = async (
    userId: string,
    guestToken?: string,
) => {
    if (!guestToken) {
        return {
            merged: false,
            itemsMerged: 0,
        };
    }

    return mergeGuestCartIntoUserCart(
        guestToken,
        userId,
    );
};
export const removeCartItemService = async (
    identity: CartIdentity,
    itemId: string,
) => {
    const item = identity.userId
        ? await findCartItemByUser(itemId, identity.userId)
        : identity.guestToken
        ? await findCartItemByGuestToken(itemId, identity.guestToken)
        : null;

    if (!item) {
        throw new AppError("Cart item not found.", 404);
    }

    await deleteCartItem(itemId);

    return { message: "Item removed from cart." };

};