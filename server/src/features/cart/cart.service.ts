import { AppError } from "../../middleware/appError.js";
import { findPublicProductById } from "../product/product.repository.js";
import {
    deleteCartItem,
    findCartItemById,
    findVariantById,
    findCartItemQuantity,
    getCartWithItems,
    getOrCreateCart,
    updateCartItemQuantity,
    upsertCartItem,
    clearCart,
    mergeCartItems,
} from "./cart.repository.js";

interface AddToCartInput {
    productId: string;
    variantId?: string;
    quantity: number;
}

export const addToCartService = async (userId: string, body: AddToCartInput) => {
    const { productId, variantId, quantity } = body;

    const product = await findPublicProductById(productId);

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    if (product.variants.length > 0 && !variantId) {
        throw new AppError("A product variant must be selected before adding this product to the cart.", 400);
    }

    const cart = await getOrCreateCart(userId);
    const existingQuantity = await findCartItemQuantity(cart.id, productId, variantId);
    const requestedQuantity = existingQuantity + quantity;

    if (variantId) {
        const variant = await findVariantById(variantId, productId);

        if (!variant) {
            throw new AppError("Variant not found.", 404);
        }

        if (variant.stock < requestedQuantity) {
            throw new AppError(`Insufficient stock. You already have ${existingQuantity} in your cart and only ${variant.stock} are available.`, 400);
        }
    } else {
        if (product.stock < requestedQuantity) {
            throw new AppError(`Insufficient stock. You already have ${existingQuantity} in your cart and only ${product.stock} are available.`, 400);
        }
    }

    const cartItem = await upsertCartItem(cart.id, productId, quantity, variantId);

    return cartItem;
};

export const getCartService = async (userId: string) => {
    const cart = await getCartWithItems(userId);

    if (!cart || cart.items.length === 0) {
        return {
            items: [],
            groupedBy: [],
            totalItems: 0,
            totalPrice: "0.00",
        };
    }

    // group items by shop for multi-shop display
    const shopMap: Record<
        string,
        {
            shop: { id: string; slug: string; name: string };
            items: any[];
            subtotal: number;
        }
    > = {};

    for (const item of cart.items) {
        const shopSlug = item.product.shop.slug;
        const shopName = item.product.shop.profile?.name ?? "Unknown shop";

        // skip unavaliable items ( product archived or shop closed)
        const availableStock = item.variant?.stock ?? item.product.stock;
        const isAvailable =
            item.product.status === "ACTIVE" &&
            item.product.shop.status === "ACTIVE" &&
            availableStock >= item.quantity;

        if (!shopMap[shopSlug]) {
            shopMap[shopSlug] = {
                shop: { id: item.product.shopId, slug: shopSlug, name: shopName },
                items: [],
                subtotal: 0,
            };
        }

        const unitPrice = item.variant
            ? Number(item.variant.price)
            : Number(item.product.basePrice);
        const lineTotal = unitPrice * item.quantity;

        shopMap[shopSlug].items.push({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            productSlug: item.product.slug,
            variantId: item.variant?.id ?? null,
            variantName: item.variant?.name ?? null,
            unitePrice: unitPrice.toFixed(2),
            quantity: item.quantity,
            lineToal: lineTotal.toFixed(2),
            image: item.product.images[0]?.url ?? null,
            isAvailable,
        });

        if (isAvailable) {
            shopMap[shopSlug].subtotal += lineTotal;
        }
    }
    const groupedBy = Object.values(shopMap).map((group) => ({
        ...group,
        subtotal: group.subtotal.toFixed(2),
    }));

    const totalPrice = groupedBy.reduce((sum, g) => sum + Number(g.subtotal), 0).toFixed(2);

    return {
        items: cart.items.length,
        groupedBy,
        totalItems: cart.items.length,
        totalPrice,
    };
};

export const updateCartItemService = async (userId: string, itemId: string, quantity: number) => {
    // find Item and verify OwnerShip
    const item = await findCartItemById(itemId, userId);

    if (!item) {
        throw new AppError("Cart Item Not found.", 404);
    }

    // check stock
    const availableStock = item.variant ? item.variant.stock : item.product.stock;

    if (availableStock < quantity) {
        throw new AppError(`Insufficint stock. only ${availableStock} avaliable.`, 400);
    }

    return updateCartItemQuantity(itemId, quantity);
};

export const removeCartItemService = async (userId: string, itemId: string) => {
    const item = await findCartItemById(itemId, userId);

    if (!item) {
        throw new AppError("Cart item not found.", 404);
    }

    await deleteCartItem(itemId);
    return {
        message: "Item removed from cart.",
    };
};

export const clearCartService = async (userId: string) => {
    const result = await clearCart(userId);

    return {
        message: `Cart Cleard. ${result.count} items(s) removed.`,
    };
};

export const mergeCartService = async (
    userId: string,
    items: AddToCartInput[],
) => {
    const cart = await getOrCreateCart(userId);

    const requestedByKey = new Map<string, number>();
    for (const item of items) {
        const key = `${item.productId}:${item.variantId ?? "standard"}`;
        requestedByKey.set(key, (requestedByKey.get(key) ?? 0) + item.quantity);
    }

    for (const item of items) {
        const product = await findPublicProductById(item.productId);
        if (!product) throw new AppError("One or more cart products are no longer available.", 400);
        if (product.variants.length > 0 && !item.variantId) {
            throw new AppError(`Select a variant for ${product.name} before adding it to your cart.`, 400);
        }

        if (item.variantId) {
            const variant = await findVariantById(item.variantId, item.productId);
            if (!variant) throw new AppError("One or more cart variants are no longer available.", 400);
            const existing = await findCartItemQuantity(cart.id, item.productId, item.variantId);
            const requested = requestedByKey.get(`${item.productId}:${item.variantId}`) ?? item.quantity;
            if (variant.stock < existing + requested) {
                throw new AppError(`Insufficient stock for ${product.name}.`, 400);
            }
        } else {
            const existing = await findCartItemQuantity(cart.id, item.productId);
            const requested = requestedByKey.get(`${item.productId}:standard`) ?? item.quantity;
            if (product.stock < existing + requested) {
                throw new AppError(`Insufficient stock for ${product.name}.`, 400);
            }
        }
    }

    return mergeCartItems(cart.id, items);
};
