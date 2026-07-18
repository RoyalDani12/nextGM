import { OrderStatus } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../middleware/appError.js";
import {
    GetCustomerOrdersOptions,
    GetShopOrdersOptions,
    shipAddressInput,
    shopGroup,
} from "./order.types.js";
import crypto from "crypto";
import { getReservationExpiryTimestamp } from "../../infrastructure/queue/orderExpiration.helpers.js";

export const createOrdersFromCart = async (
    customerId: string,
    shopGroups: shopGroup[],
    shippingAddress: shipAddressInput,
) => {
    return prisma.$transaction(async (tx) => {
        const createdOrders = [];

        for (const group of shopGroups) {
            // Calculate order total
            let totalAmount = 0;

            for (const item of group.items) {
                const unitPrice = item.variant
                    ? Number(item.variant.price)
                    : Number(item.product.basePrice);

                totalAmount += unitPrice * Number(item.quantity);
            }

            // create order row
            const order = await tx.order.create({
                data: {
                    shopId: group.shopId,
                    customerId,
                    totalAmount: totalAmount.toFixed(2),
                    status: "PENDING",
                    idempotencyKey: crypto.randomUUID(),
                    reservationExpiresAt:getReservationExpiryTimestamp()
                },
            });

            // create orderItems - sanpshot price at purchase time
            for (const item of group.items) {
                const unitPrice = item.variant
                    ? Number(item.variant.price)
                    : Number(item.product.basePrice);

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        variantId: item.variantId ?? null,
                        quantity: Number(item.quantity),
                        unitPrice: unitPrice.toFixed(2),
                    },
                });
            }
            // create Shipping  address
            await tx.shippingAddress.create({
                data: {
                    orderId: order.id,
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    address: shippingAddress.address,
                    city: shippingAddress.city,
                    country: shippingAddress.country,
                    postalCode: shippingAddress.postalCode,
                },
            });
            // create initial order status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    status: "PENDING",
                    note: "Order placed by customer.",
                },
            });

            // decrement stock atomically
            for (const item of group.items) {
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: { decrement: Number(item.quantity) },
                        },
                    });
                } else {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: Number(item.quantity) },
                        },
                    });
                }
            }
            createdOrders.push({
                id: order.id,
                shopId: group.shopId,
                shopSlug: group.shopSlug,
                totalAmount: totalAmount.toFixed(2),
                status: "PENDING",
                itemCount: group.items.length,
            });
        }
        return createdOrders;
    });
};

export const getCustomerOrdersRepository = async (options: GetCustomerOrdersOptions) => {
    const { customerId, status, skip, take } = options;

    const where = {
        customerId,
        deletedAt: null,
        ...(status && { status }),
    };
    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            select: {
                id: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                shop: {
                    select: {
                        slug: true,
                        profile: {
                            select: {
                                name: true,
                                logo: true,
                            },
                        },
                    },
                },
                items: {
                    select: { id: true },
                },
                payment: {
                    select: { status: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.order.count({ where }),
    ]);
    return { orders, total };
};

export const getCustomerOrderByIdRepository = async (orderId: string, customerId: string) => {
    return prisma.order.findFirst({
        where: {
            id: orderId,
            customerId, // ← ownership: only see YOUR order
            deletedAt: null,
        },
        select: {
            id: true,
            status: true,
            totalAmount: true,
            discountAmount: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            shop: {
                select: {
                    slug: true,
                    profile: {
                        select: {
                            name: true,
                            logo: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            },
            items: {
                select: {
                    id: true,
                    quantity: true,
                    unitPrice: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
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
                        },
                    },
                },
            },
            shippingAddress: {
                select: {
                    fullName: true,
                    phone: true,
                    address: true,
                    city: true,
                    country: true,
                    postalCode: true,
                },
            },
            payment: {
                select: {
                    status: true,
                    amount: true,
                    currency: true,
                    provider: true,
                },
            },
            statusHistory: {
                select: {
                    status: true,
                    note: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });
};

export const findOrderForCancelRepository = async (orderId: string, customerId: string) => {
    return prisma.order.findFirst({
        where: { id: orderId, customerId, deletedAt: null },
        select: {
            id: true,
            status: true,
            items: {
                select: {
                    productId: true,
                    variantId: true,
                    quantity: true,
                },
            },
        },
    });
};

const CANCELABLE_STATUSES = ["PENDING", "CONFIRMED"] as const;

export const cancelOrderRepository = async (
    orderId: string,
    items: { productId: string; variantId: string | null; quantity: number }[],
) => {
    return prisma.$transaction(async (tx) => {
        /* 
        Atomic guard: only flips status if it's STILL in a cancelable state.
        If another request (shop marking it SHIPPED, or a double-click cancel)
        already moved it out of PENDING/CONFIRMED, count is 0 and we bail —
        no stock gets restored twice, no order gets cancelled twice. */

        const guard = await tx.order.updateMany({
            where: { id: orderId, status: { in: [...CANCELABLE_STATUSES] } },
            data: { status: "CANCELLED" },
        });

        if (guard.count === 0) {
            throw new AppError("Order can no longer be cancelled -its status has changed.", 409);
        }
        // restore stock — increment is always safe, no gte guard needed
        await Promise.all(
            items.map((item) =>
                item.variantId
                    ? tx.productVariant.update({
                          where: { id: item.variantId },
                          data: { stock: { increment: item.quantity } },
                      })
                    : tx.product.update({
                          where: { id: item.productId },
                          data: { stock: { increment: item.quantity } },
                      }),
            ),
        );

        await tx.orderStatusHistory.create({
            data: {
                orderId,
                status: "CANCELLED",
                note: "Order cancelled by customer.",
            },
        });

        return tx.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                updatedAt: true,
            },
        });
    });
};

export const getShopOrdersRepository = async (options: GetShopOrdersOptions) => {
    const { shopId, status, skip, take } = options;

    const where = {
        shopId,
        deletedAt: null,
        ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            select: {
                id: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                items: {
                    select: { id: true, quantity: true },
                },
                shippingAddress: {
                    select: { fullName: true, city: true, country: true },
                },
                payment: {
                    select: { status: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),

        prisma.order.count({ where }),
    ]);
    return { orders, total };
};

export const getShopOrderByIdRepository = async (orderId: string, shopId: string) => {
    return prisma.order.findFirst({
        where: { id: orderId, shopId, deletedAt: null },
        select: {
            id: true,
            status: true,
            totalAmount: true,
            discountAmount: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            items: {
                select: {
                    id: true,
                    quantity: true,
                    unitPrice: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            images: {
                                where: {
                                    isPrimary: true,
                                },
                                select: { url: true },
                                take: 1,
                            },
                        },
                    },
                    variant: {
                        select: { id: true, name: true },
                    },
                },
            },
            shippingAddress: {
                select: {
                    fullName: true,
                    phone: true,
                    address: true,
                    city: true,
                    country: true,
                    postalCode: true,
                },
            },
            payment: {
                select: {
                    status: true,
                    amount: true,
                    currency: true,
                    provider: true,
                },
            },
            statusHistory: {
                select: {
                    status: true,
                    note: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });
};


export const updateOrderStatusRepository = async (
    orderId:string,
    shopId:string,
    currentStatus:OrderStatus,
    newStatus:OrderStatus,
    note?:string
)=>{
    return prisma.$transaction( async(tx)=>{
         // atomic guard — same shape as cancel: only flips if it's STILL
        // in the exact state we validated against. Prevents a race where
        // two shop-status updates (or a customer cancel) land concurrently.
        const guard = await tx.order.updateMany({
            where:{ id:orderId,shopId,status:currentStatus},
            data:{
                status:newStatus
            }
        })
        if ( guard.count === 0){
            throw new AppError(
                "Order status changed before this update could apply.",
                409
            )
        }

        await tx.orderStatusHistory.create({
            data:{
                orderId,
                status:newStatus,
                note:note ?? `Order marked as ${newStatus} by shop.`
            }
        })

        return tx.order.findUnique({
            where:{ id:orderId },
            select :{
                id:true,
                status:true,
                updatedAt:true
            }
        })
    })
}