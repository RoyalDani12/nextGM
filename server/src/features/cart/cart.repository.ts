import { prisma } from "../../config/db.js";

// ─────────────────────────────────────────
// AUTHENTICATED CART
// ─────────────────────────────────────────

export const getOrCreateUserCart = async (userId: string) => {
    return prisma.cart.upsert({
        where: {
            userId,
        },
        update: {},
        create: {
            userId,
        },
    });
};

export const findVariantById = async (
    variantId: string,
    productId: string,
) => {
    return prisma.productVariant.findFirst({
        where: {
            id: variantId,
            productId,
        },
        select: {
            id: true,
            stock: true,
            price: true,
            name: true,
        },
    });
};

// ─────────────────────────────────────────
// GUEST CART
// ─────────────────────────────────────────

export const findGuestCart = async (guestToken: string) => {
    return prisma.cart.findUnique({
        where: {
            guestToken,
        },
    });
};

export const createGuestCart = async (guestToken: string) => {
    return prisma.cart.create({
        data: {
            guestToken,
        },
    });
};

export const getOrCreateGuestCart = async (guestToken: string) => {
    return prisma.cart.upsert({
        where: {
            guestToken,
        },
        update: {},
        create: {
            guestToken,
        },
    });
};

// ─────────────────────────────────────────
// CART ITEM
// ─────────────────────────────────────────

export const upsertCartItem = async (
    cartId: string,
    productId: string,
    quantity: number,
    variantId?: string,
) => {
    if (variantId) {
        return prisma.cartItem.upsert({
            where: {
                cartId_productId_variantId: {
                    cartId,
                    productId,
                    variantId,
                },
            },
            update: {
                quantity: {
                    increment: quantity,
                },
            },
            create: {
                cartId,
                productId,
                variantId,
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

    return prisma.cartItem.upsert({
        where: {
            cartId_productId: {
                cartId,
                productId,
            },
        },
        update: {
            quantity: {
                increment: quantity,
            },
        },
        create: {
            cartId,
            productId,
            quantity,
        },
        select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
        },
    });
};

// ─────────────────────────────────────────
// GET CART
// ─────────────────────────────────────────

export const getCartWithItemsByUserId = async (userId: string) => {
    return prisma.cart.findUnique({
        where: {
            userId,
        },
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
                            stock: true,
                            shopId: true,

                            shop: {
                                select: {
                                    slug: true,
                                    status: true,

                                    profile: {
                                        select: {
                                            name: true,
                                            logo: true,
                                        },
                                    },
                                },
                            },

                            images: {
                                where: {
                                    isPrimary: true,
                                },
                                select: {
                                    url: true,
                                },
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

                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });
};

export const getCartWithItemsByGuestToken = async (guestToken: string) => {
    return prisma.cart.findUnique({
        where: {
            guestToken,
        },
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
                            stock: true,
                            shopId: true,

                            shop: {
                                select: {
                                    slug: true,
                                    status: true,

                                    profile: {
                                        select: {
                                            name: true,
                                            logo: true,
                                        },
                                    },
                                },
                            },

                            images: {
                                where: {
                                    isPrimary: true,
                                },
                                select: {
                                    url: true,
                                },
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

                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });
};

// ─────────────────────────────────────────
// FIND ITEM
// ─────────────────────────────────────────

export const findCartItemByUser = async (itemId: string, userId: string) => {
    return prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cart: {
                userId,
            },
        },

        select: {
            id: true,
            quantity: true,
            productId: true,
            variantId: true,

            product: {
                select: {
                    stock: true,
                    status: true,
                },
            },

            variant: {
                select: {
                    stock: true,
                },
            },
        },
    });
};

export const findCartItemByGuestToken = async (itemId: string, guestToken: string) => {
    return prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cart: {
                guestToken,
            },
        },

        select: {
            id: true,
            quantity: true,
            productId: true,
            variantId: true,

            product: {
                select: {
                    stock: true,
                    status: true,
                },
            },

            variant: {
                select: {
                    stock: true,
                },
            },
        },
    });
};

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────

export const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    return prisma.cartItem.update({
        where: {
            id: itemId,
        },

        data: {
            quantity,
        },

        select: {
            id: true,
            quantity: true,
        },
    });
};

// ─────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────

export const deleteCartItem = async (itemId: string) => {
    return prisma.cartItem.delete({
        where: {
            id: itemId,
        },
    });
};

// ─────────────────────────────────────────
// CLEAR
// ─────────────────────────────────────────

export const clearUserCart = async (userId: string) => {
    const cart = await prisma.cart.findUnique({
        where: {
            userId,
        },
        select: {
            id: true,
        },
    });

    if (!cart) {
        return {
            count: 0,
        };
    }

    return prisma.cartItem.deleteMany({
        where: {
            cartId: cart.id,
        },
    });
};

export const clearGuestCart = async (guestToken: string) => {
    const cart = await prisma.cart.findUnique({
        where: {
            guestToken,
        },
        select: {
            id: true,
        },
    });

    if (!cart) {
        return {
            count: 0,
        };
    }

    return prisma.cartItem.deleteMany({
        where: {
            cartId: cart.id,
        },
    });
};export const mergeGuestCartIntoUserCart = async (
  guestToken: string,
  userId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const guestCart = await tx.cart.findUnique({
      where: { guestToken },
      include: { items: true },
    });

    if (!guestCart) {
      return { merged: false, itemsMerged: 0 };
    }

    const userCart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    let itemsMerged = 0;

    for (const guestItem of guestCart.items) {
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: userCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId ?? null,
        },
      });

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: guestItem.quantity } },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId ?? undefined,
            quantity: guestItem.quantity,
          },
        });
      }

      itemsMerged++;
    }

    await tx.cartItem.deleteMany({
      where: { cartId: guestCart.id },
    });

    await tx.cart.delete({
      where: { id: guestCart.id },
    });

    return { merged: true, itemsMerged };
  });
};