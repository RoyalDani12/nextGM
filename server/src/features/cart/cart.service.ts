import { AppError } from "../../middleware/appError.js";
import { prisma } from "../../config/db.js";
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

export interface ValidateCouponInput {
    code: string;
    shopIds?: string[];
    subtotal?: number;
    items?: Array<{
        productId: string;
        variantId?: string | null;
        quantity: number;
        price: number;
        shopId?: string;
    }>;
}

export const validateCartCouponService = async (
    userId: string | undefined,
    input: ValidateCouponInput,
) => {
    const rawCode = input.code?.trim().toUpperCase();
    if (!rawCode) {
        throw new AppError("Please provide a promo or coupon code.", 400);
    }

    let cartShopIds = input.shopIds || [];
    let cartSubtotal = Number(input.subtotal || 0);
    let cartItems = input.items || [];

    if (userId && (!cartItems.length || !cartShopIds.length)) {
        const cart = await getCartWithItems(userId);
        if (cart?.items?.length) {
            cartShopIds = Array.from(new Set(cart.items.map((it) => it.product.shopId)));
            cartItems = cart.items.map((it) => ({
                productId: it.product.id,
                variantId: it.variantId,
                quantity: it.quantity,
                price: it.variant ? Number(it.variant.price) : Number(it.product.basePrice),
                shopId: it.product.shopId,
            }));
            cartSubtotal = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        }
    }

    const coupons = await prisma.coupon.findMany({
        where: {
            code: rawCode,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            shop: { status: "ACTIVE", deletedAt: null },
        },
        include: {
            shop: {
                select: {
                    id: true,
                    slug: true,
                    profile: { select: { name: true } },
                },
            },
            products: {
                select: { productId: true },
            },
        },
    });

    if (coupons.length === 0) {
        const inactiveOrExpired = await prisma.coupon.findFirst({
            where: { code: rawCode },
            select: { isActive: true, expiresAt: true },
        });

        if (inactiveOrExpired) {
            if (!inactiveOrExpired.isActive) {
                throw new AppError(`Coupon code "${rawCode}" is currently inactive.`, 400);
            }
            if (inactiveOrExpired.expiresAt && inactiveOrExpired.expiresAt <= new Date()) {
                throw new AppError(`Coupon code "${rawCode}" has expired.`, 400);
            }
        }

        if (rawCode === "NEXTG" || rawCode === "NEXTG10" || rawCode === "SAVE10") {
            const discountAmount = Number((cartSubtotal * 0.1).toFixed(2));
            return {
                valid: true,
                code: rawCode,
                type: "PERCENTAGE",
                value: 10,
                discountAmount,
                freeShipping: false,
                shopId: null,
                shopName: "NextG Platform Promo",
                message: `Promo code "${rawCode}" applied! You saved 10% ($${discountAmount.toFixed(2)}).`,
            };
        }

        if (rawCode === "FREESHIP" || rawCode === "FREESHIPPING") {
            return {
                valid: true,
                code: rawCode,
                type: "FREE_SHIPPING",
                value: 0,
                discountAmount: 5.0,
                freeShipping: true,
                shopId: null,
                shopName: "NextG Platform Promo",
                message: `Promo code "${rawCode}" applied! Free delivery unlocked.`,
            };
        }

        throw new AppError(`Coupon or promo code "${rawCode}" is invalid.`, 400);
    }

    const matchingCoupon = cartShopIds.length > 0
        ? coupons.find((c) => cartShopIds.includes(c.shopId))
        : coupons[0];

    if (!matchingCoupon) {
        const shopNames = coupons
            .map((c) => c.shop?.profile?.name || c.shop?.slug)
            .filter(Boolean)
            .join(", ");
        throw new AppError(
            `Coupon "${rawCode}" is only valid for items from ${shopNames || "the issuing store"}.`,
            400,
        );
    }

    if (matchingCoupon.maxUses !== null && matchingCoupon.usedCount >= matchingCoupon.maxUses) {
        throw new AppError(`Coupon "${rawCode}" has reached its maximum redemption limit.`, 400);
    }

    if (userId) {
        const priorUsage = await prisma.couponUsage.findUnique({
            where: { couponId_userId: { couponId: matchingCoupon.id, userId } },
        });
        if (priorUsage) {
            throw new AppError(`You have already redeemed coupon "${rawCode}" on this account.`, 409);
        }
    }

    const targetedProductIds = new Set(matchingCoupon.products.map((p) => p.productId));
    const eligibleItems = cartItems.length > 0
        ? cartItems.filter((item) => {
              const matchesShop = !item.shopId || item.shopId === matchingCoupon.shopId;
              const matchesProduct = targetedProductIds.size === 0 || targetedProductIds.has(item.productId);
              return matchesShop && matchesProduct;
          })
        : [];

    const eligibleSubtotal = eligibleItems.length > 0
        ? eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        : cartSubtotal;

    if (targetedProductIds.size > 0 && eligibleItems.length === 0 && cartItems.length > 0) {
        throw new AppError(`Coupon "${rawCode}" does not apply to the specific items currently in your cart.`, 400);
    }

    if (matchingCoupon.minOrderAmount && eligibleSubtotal < Number(matchingCoupon.minOrderAmount)) {
        throw new AppError(
            `Coupon "${rawCode}" requires a minimum order of $${Number(matchingCoupon.minOrderAmount).toFixed(2)}.`,
            400,
        );
    }

    let discountAmount = 0;
    let freeShipping = false;

    if (matchingCoupon.type === "FREE_SHIPPING") {
        freeShipping = true;
        discountAmount = 5.0;
    } else if (matchingCoupon.type === "PERCENTAGE") {
        discountAmount = (eligibleSubtotal * Number(matchingCoupon.value)) / 100;
    } else {
        discountAmount = Math.min(Number(matchingCoupon.value), eligibleSubtotal);
    }

    const shopName = matchingCoupon.shop?.profile?.name || matchingCoupon.shop?.slug || "Merchant Store";

    return {
        valid: true,
        code: matchingCoupon.code,
        type: matchingCoupon.type,
        value: Number(matchingCoupon.value),
        discountAmount: Number(discountAmount.toFixed(2)),
        freeShipping,
        shopId: matchingCoupon.shopId,
        shopName,
        minOrderAmount: matchingCoupon.minOrderAmount ? Number(matchingCoupon.minOrderAmount) : null,
        message: freeShipping
            ? `Coupon "${matchingCoupon.code}" applied! Free delivery unlocked for ${shopName}.`
            : `Coupon "${matchingCoupon.code}" applied! Saved $${discountAmount.toFixed(2)} on ${shopName}.`,
    };
};
