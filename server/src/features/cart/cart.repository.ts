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
    const existing = await prisma.cartItem.findFirst({
        where: { cartId, productId, variantId: null },
        select: { id: true },
    });

    if (existing) {
        return prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: { increment: quantity } },
            select: { id: true, productId: true, variantId: true, quantity: true },
        });
    }

    return prisma.cartItem.create({
        data: { cartId, productId, quantity },
        select: { id: true, productId: true, variantId: true, quantity: true },
    });
};

export const findCartItemQuantity = async (
    cartId: string,
    productId: string,
    variantId?: string,
) => {
    const item = await prisma.cartItem.findFirst({
        where: { cartId, productId, variantId: variantId ?? null },
        select: { quantity: true },
    });
    return item?.quantity ?? 0;
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
                            stock:true,
                            shopId:true,
                            shop: {
                                select: {
                                    slug: true,
                                    status: true,
                                    profile: {
                                        select: { name: true,
                                            logo:true
                                         },
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

export const clearCart = async (userId:string)=>{
     const cart = await prisma.cart.findUnique({
        where: { userId },
        select: { id: true }
     })
     
     if(!cart) return { count : 0 }

     return prisma.cartItem.deleteMany({
        where :{ cartId :cart.id }
     })
}

export const mergeCartItems = async (cartId: string, items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
}>) => {
    return prisma.$transaction(async (tx) => {
        for (const item of items) {
            if (item.variantId) {
                await tx.cartItem.upsert({
                    where: {
                        cartId_productId_variantId: {
                            cartId,
                            productId: item.productId,
                            variantId: item.variantId,
                        },
                    },
                    update: { quantity: { increment: item.quantity } },
                    create: { cartId, productId: item.productId, variantId: item.variantId, quantity: item.quantity },
                });
            } else {
                const existing = await tx.cartItem.findFirst({
                    where: { cartId, productId: item.productId, variantId: null },
                    select: { id: true },
                });
                if (existing) {
                    await tx.cartItem.update({
                        where: { id: existing.id },
                        data: { quantity: { increment: item.quantity } },
                    });
                } else {
                    await tx.cartItem.create({
                        data: { cartId, productId: item.productId, quantity: item.quantity },
                    });
                }
            }
        }
        return tx.cart.findUnique({ where: { id: cartId }, include: { items: true } });
    });
};