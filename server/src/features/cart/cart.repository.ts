import { prisma } from "../../config/db.js";

export const findVariantById = async (variantId: string, productId: string) => {
    return prisma.productVariant.findFirst({
        where: { id: variantId, productId },
        select: {
            id: true,
            stock: true,
            price: true,
            name: true,
        },
    });
};

export const getOrCreateCart = async (userId: string) => {
    return prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });
};

export const upsertCartItem = async (
    cartId: string,
    productId: string,
    quantity: number,
    variantId?: string,
) => {
    // Scenario 1: Product with a specific variant
    if (variantId) {
        return prisma.cartItem.upsert({
            where: {
                cartId_productId_variantId: {
                    cartId,
                    productId,
                    variantId: variantId,
                },
            },
            update: {
                quantity: { increment: quantity },
            },
            create: {
                cartId,
                productId,
                variantId: variantId ?? null,
                quantity,
            },
            select: {
                id: true,
                productId: true,
                variantId: true,
                quantity: true,
            },
        });
    }
    // Scenario 2: Standard Product without a variant
    return prisma.cartItem.upsert({
        where: {
            cartId_productId: {
                cartId,
                productId,
            },
        },
        update: {
            quantity: { increment: quantity },
        },
        create: {
            cartId,
            productId,
            quantity,
        },
        select: { id: true, productId: true, quantity: true },
    });
};

export const getCartWithItems = async (userId: string) => {
    return prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            basePrice: true,
                            status: true,
                            shop: {
                                select: {
                                    slug: true,
                                    status: true,
                                    profile: {
                                        select: { name: true },
                                    },
                                },
                            },
                            images: {
                                where: { isPrimary: true },
                                select: { url: true },
                                take: 1,
                            },
                        },
                    },
                    variant: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            stock: true,
                        },
                    },
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });
};

export const findCartItemById = async (itemId: string, userId: string) => {
    return prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cart: { userId }, // owner ship via cart relationship
        },
        select: {
            id: true,
            quantity: true,
            productId: true,
            variantId: true,
            product: {
                select: { stock: true, status: true },
            },
            variant: {
                select: { stock: true },
            },
        },
    });
};

export const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    return prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
        select: {
            id: true,
            quantity: true,
        },
    });
};

export const deleteCartItem = async(itemId:string)=>{
    return prisma.cartItem.delete({
        where:{ id:itemId }
    })
}