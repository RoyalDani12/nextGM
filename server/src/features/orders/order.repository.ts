import { OrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../middleware/appError.js";
import {
    GetCustomerOrdersOptions,
    GetShopOrdersOptions,
    shipAddressInput,
    shopGroup,
    ShipmentUpdateInput,
    ShippingMethodInput,
} from "./order.types.js";
import crypto from "crypto";
import { getReservationExpiryTimestamp } from "../../infrastructure/queue/orderExpiration.helpers.js";

const calculateDiscount = (type: "PERCENTAGE" | "FIXED_AMOUNT", value: number, subtotal: number) =>
    type === "PERCENTAGE" ? (subtotal * value) / 100 : Math.min(value, subtotal);

const SHIPPING_QUOTES: Record<ShippingMethodInput, { fee: number; minDays: number; maxDays: number }> = {
    STANDARD: { fee: 5, minDays: 5, maxDays: 7 },
    EXPRESS: { fee: 15, minDays: 2, maxDays: 3 },
    PICKUP: { fee: 0, minDays: 1, maxDays: 2 },
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const reserveInventoryItem = async (
    tx: Prisma.TransactionClient,
    item: { productId: string; variantId?: string | null; quantity: number; productName: string },
    orderId: string,
    expiresAt: Date,
) => {
    const quantity = Number(item.quantity);
    if (item.variantId) {
        const reserved = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
        });
        if (!reserved.count) {
            throw new AppError(`Insufficient stock for ${item.productName}.`, 400);
        }
    } else {
        const reserved = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
        });
        if (!reserved.count) {
            throw new AppError(`Insufficient stock for ${item.productName}.`, 400);
        }
    }

    await tx.inventoryReservation.create({
        data: {
            orderId,
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity,
            expiresAt,
        },
    });
};

export const createOrdersFromCart = async (
    customerId: string,
    shopGroups: shopGroup[],
    shippingAddress: shipAddressInput,
    couponCodes: Record<string, string> = {},
    shippingMethods: Record<string, ShippingMethodInput> = {},
) => {
    return prisma.$transaction(async (tx) => {
        const preparedGroups: Array<{
            group: shopGroup;
            subtotal: number;
            discountAmount: number;
            freeShipping: boolean;
            couponId?: string;
            couponCode?: string;
            shipping: { method: ShippingMethodInput; fee: number; estimatedDeliveryStart: Date; estimatedDeliveryEnd: Date };
        }> = [];

        // Validate and reserve each coupon before creating any order. Everything below runs
        // in one transaction, so a failed coupon leaves no order, stock update, or usage behind.
        for (const group of shopGroups) {
            const subtotal = group.items.reduce((sum, item) => {
                const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.basePrice);
                return sum + unitPrice * Number(item.quantity);
            }, 0);
            const couponCode = couponCodes[group.shopId]?.trim().toUpperCase();
            let couponId: string | undefined;
            let discountAmount = 0;
            let freeShipping = false;

            if (couponCode) {
                const coupon = await tx.coupon.findUnique({
                    where: { shopId_code: { shopId: group.shopId, code: couponCode } },
                    select: { id: true, type: true, value: true, minOrderAmount: true, maxUses: true, isActive: true, expiresAt: true, products: { select: { productId: true } } },
                });
                if (!coupon || !coupon.isActive) throw new AppError(`Coupon ${couponCode} is not available for this shop.`, 400);
                if (coupon.expiresAt && coupon.expiresAt <= new Date()) throw new AppError(`Coupon ${couponCode} has expired.`, 400);
                const targetedProductIds = new Set(coupon.products.map((target) => target.productId));
                const eligibleSubtotal = targetedProductIds.size
                    ? group.items.reduce((sum, item) => targetedProductIds.has(item.productId)
                        ? sum + (item.variant ? Number(item.variant.price) : Number(item.product.basePrice)) * Number(item.quantity)
                        : sum, 0)
                    : subtotal;
                if (targetedProductIds.size && eligibleSubtotal === 0) {
                    throw new AppError(`Coupon ${couponCode} does not apply to products in this cart.`, 400);
                }
                if (coupon.minOrderAmount && eligibleSubtotal < Number(coupon.minOrderAmount)) {
                    throw new AppError(`Coupon ${couponCode} requires a minimum order of ${Number(coupon.minOrderAmount).toFixed(2)}.`, 400);
                }
                const priorUsage = await tx.couponUsage.findUnique({ where: { couponId_userId: { couponId: coupon.id, userId: customerId } } });
                if (priorUsage) throw new AppError(`Coupon ${couponCode} has already been used on this account.`, 409);

                const usageGuard = coupon.maxUses === null
                    ? await tx.coupon.updateMany({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
                    : await tx.coupon.updateMany({ where: { id: coupon.id, usedCount: { lt: coupon.maxUses } }, data: { usedCount: { increment: 1 } } });
                if (!usageGuard.count) throw new AppError(`Coupon ${couponCode} has reached its usage limit.`, 409);
                await tx.couponUsage.create({ data: { couponId: coupon.id, userId: customerId } });

                couponId = coupon.id;
                if (coupon.type === "FREE_SHIPPING") {
                    freeShipping = true;
                } else {
                    discountAmount = calculateDiscount(coupon.type, Number(coupon.value), eligibleSubtotal);
                }
            }
            const method = shippingMethods[group.shopId] ?? "STANDARD";
            const quote = SHIPPING_QUOTES[method];
            const today = new Date();
            preparedGroups.push({
                group,
                subtotal,
                discountAmount,
                freeShipping,
                couponId,
                couponCode,
                shipping: {
                    method,
                    fee: freeShipping ? 0 : quote.fee,
                    estimatedDeliveryStart: addDays(today, quote.minDays),
                    estimatedDeliveryEnd: addDays(today, quote.maxDays),
                },
            });
        }

        const checkoutTotal = preparedGroups.reduce((sum, item) => sum + item.subtotal - item.discountAmount + item.shipping.fee, 0);
        const checkout = await tx.checkout.create({
            data: { customerId, totalAmount: checkoutTotal.toFixed(2), status: "PENDING", idempotencyKey: crypto.randomUUID() },
        });
        const createdOrders = [];

        for (const { group, subtotal, discountAmount, couponId, shipping } of preparedGroups) {
            const discountedTotal = subtotal - discountAmount;
            const totalWithShipping = discountedTotal + shipping.fee;
            const reservationExpiresAt = getReservationExpiryTimestamp();

            const order = await tx.order.create({
                data: {
                    checkoutId: checkout.id,
                    shopId: group.shopId,
                    customerId,
                    totalAmount: totalWithShipping.toFixed(2),
                    couponId,
                    discountAmount: discountAmount.toFixed(2),
                    status: "PENDING",
                    idempotencyKey: crypto.randomUUID(),
                    reservationExpiresAt,
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
            await tx.orderShipment.create({
                data: {
                    orderId: order.id,
                    method: shipping.method,
                    fee: shipping.fee.toFixed(2),
                    estimatedDeliveryStart: shipping.estimatedDeliveryStart,
                    estimatedDeliveryEnd: shipping.estimatedDeliveryEnd,
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

            // Reserve stock atomically. The stock predicate is the concurrency
            // guard; if another checkout consumed the remaining units, the
            // transaction rolls back without creating a partial order.
            for (const item of group.items) {
                await reserveInventoryItem(tx, {
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: Number(item.quantity),
                    productName: item.product.name,
                }, order.id, reservationExpiresAt);
            }
            createdOrders.push({
                id: order.id,
                shopId: group.shopId,
                shopSlug: group.shopSlug,
                totalAmount: totalWithShipping.toFixed(2),
                discountAmount: discountAmount.toFixed(2),
                shipping: {
                    method: shipping.method,
                    fee: shipping.fee.toFixed(2),
                    estimatedDeliveryStart: shipping.estimatedDeliveryStart,
                    estimatedDeliveryEnd: shipping.estimatedDeliveryEnd,
                },
                status: "PENDING",
                itemCount: group.items.length,
            });
        }
        return { checkout, orders: createdOrders };
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
                discountAmount: true,
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
                    select: {
                        id: true,
                        quantity: true,
                        unitPrice: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: {
                                    where: { isPrimary: true },
                                    select: { url: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                shipment: {
                    select: {
                        method: true,
                        fee: true,
                        estimatedDeliveryStart: true,
                        estimatedDeliveryEnd: true,
                        carrier: true,
                        trackingNumber: true,
                        shippedAt: true,
                        deliveredAt: true,
                    },
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
            couponId: true,
            customerId: true,
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
                            sku: true,
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
            shipment: {
                select: {
                    method: true,
                    fee: true,
                    estimatedDeliveryStart: true,
                    estimatedDeliveryEnd: true,
                    carrier: true,
                    trackingNumber: true,
                    trackingUrl: true,
                    note: true,
                    shippedAt: true,
                    deliveredAt: true,
                },
            },
            checkout: {
                select: {
                    id: true,
                    status: true,
                    payment: {
                        select: {
                            status: true,
                            amount: true,
                            currency: true,
                            provider: true,
                        },
                    },
                },
            },
            coupon: {
                select: {
                    id: true,
                    code: true,
                    type: true,
                    value: true,
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
            shopId: true,
            status: true,
            couponId: true,
            customerId: true,
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
    coupon?: { couponId: string | null; customerId: string; wasPending: boolean },
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
        if (coupon?.couponId && coupon.wasPending) {
            const released = await tx.couponUsage.deleteMany({ where: { couponId: coupon.couponId, userId: coupon.customerId } });
            if (released.count) await tx.coupon.update({ where: { id: coupon.couponId }, data: { usedCount: { decrement: 1 } } });
        }
        const reservations = await tx.inventoryReservation.findMany({
            where: { orderId, status: "ACTIVE" },
            select: { id: true, productId: true, variantId: true, quantity: true },
        });
        await Promise.all(
            reservations.map((reservation) =>
                reservation.variantId
                    ? tx.productVariant.update({
                          where: { id: reservation.variantId },
                          data: { stock: { increment: reservation.quantity } },
                      })
                    : tx.product.update({
                          where: { id: reservation.productId },
                          data: { stock: { increment: reservation.quantity } },
                      }),
            ),
        );
        if (reservations.length) {
            await tx.inventoryReservation.updateMany({
                where: { id: { in: reservations.map(({ id }) => id) }, status: "ACTIVE" },
                data: { status: "RELEASED" },
            });
        }

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

export const markOrderShippedRepository = async (
    orderId: string,
    shopId: string,
    shipmentInput: ShipmentUpdateInput,
) => {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
            where: { id: orderId, shopId, deletedAt: null },
            select: {
                id: true,
                customerId: true,
                status: true,
                shipment: { select: { method: true } },
            },
        });

        if (!order) throw new AppError("Order not found.", 404);
        if (order.status !== "PROCESSING") {
            throw new AppError(`Cannot dispatch an order with status ${order.status}.`, 400);
        }

        if (order.shipment?.method !== "PICKUP" && !shipmentInput.trackingNumber) {
            throw new AppError("A tracking number is required for shipped deliveries.", 400);
        }

        const guard = await tx.order.updateMany({
            where: { id: orderId, shopId, status: "PROCESSING" },
            data: { status: "SHIPPED" },
        });
        if (!guard.count) throw new AppError("Order status changed before this shipment could apply.", 409);

        const shipment = await tx.orderShipment.update({
            where: { orderId },
            data: {
                carrier: shipmentInput.carrier,
                trackingNumber: shipmentInput.trackingNumber || null,
                trackingUrl: shipmentInput.trackingUrl || null,
                note: shipmentInput.note || null,
                shippedAt: new Date(),
            },
            select: {
                method: true,
                carrier: true,
                trackingNumber: true,
                trackingUrl: true,
                note: true,
                shippedAt: true,
                estimatedDeliveryStart: true,
                estimatedDeliveryEnd: true,
            },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId,
                status: "SHIPPED",
                note: shipmentInput.trackingNumber
                    ? `Handed to ${shipmentInput.carrier}. Tracking: ${shipmentInput.trackingNumber}.`
                    : `Ready for ${shipmentInput.carrier} pickup.`,
            },
        });

        return { order: { id: order.id, customerId: order.customerId, status: "SHIPPED" as const }, shipment };
    });
};

export const getShopOrdersRepository = async (options: GetShopOrdersOptions) => {
    const { shopId, status, search, startDate, endDate, skip, take } = options;

    const where: any = {
        shopId,
        deletedAt: null,
        ...(status && { status }),
    };

    // Date range filter
    const createdAtCondition: { gte?: Date; lte?: Date } = {};
    if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) {
            s.setHours(0, 0, 0, 0);
            createdAtCondition.gte = s;
        }
    }
    if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) {
            e.setHours(23, 59, 59, 999);
            createdAtCondition.lte = e;
        }
    }
    if (Object.keys(createdAtCondition).length > 0) {
        where.createdAt = createdAtCondition;
    }

    // Search filter across customer name, email, order ID, and tracking number
    if (search && search.trim()) {
        const term = search.trim();
        where.OR = [
            { id: { contains: term, mode: "insensitive" } },
            { customer: { name: { contains: term, mode: "insensitive" } } },
            { customer: { email: { contains: term, mode: "insensitive" } } },
            { shippingAddress: { fullName: { contains: term, mode: "insensitive" } } },
            { shipment: { trackingNumber: { contains: term, mode: "insensitive" } } },
        ];
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            select: {
                id: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                customer: {
                    select: { id: true, name: true, email: true },
                },
                items: {
                    select: { id: true, quantity: true },
                },
                shippingAddress: {
                    select: {
                        fullName: true,
                        city: true,
                        country: true,
                        address: true,
                        phone: true,
                    },
                },
                checkout: {
                    select: {
                        payment: {
                            select: { status: true },
                        },
                    },
                },
                shipment: {
                    select: {
                        method: true,
                        fee: true,
                        estimatedDeliveryStart: true,
                        estimatedDeliveryEnd: true,
                        carrier: true,
                        trackingNumber: true,
                        trackingUrl: true,
                        shippedAt: true,
                        deliveredAt: true,
                    },
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
            customerId:true,
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
                        select: { id: true, name: true, sku: true },
                    },
                },
            },
            customer: {
                select: { name: true, email: true },
            },
            shop: {
                select: {
                    profile: {
                        select: {
                            name: true,
                            logo: true,
                            returnsPolicy: true,
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
            shipment: {
                select: {
                    method: true,
                    fee: true,
                    estimatedDeliveryStart: true,
                    estimatedDeliveryEnd: true,
                    carrier: true,
                    trackingNumber: true,
                    trackingUrl: true,
                    note: true,
                    shippedAt: true,
                    deliveredAt: true,
                },
            },
            checkout: {
                select: {
                    id: true,
                    status: true,
                    payment: {
                        select: {
                            status: true,
                            amount: true,
                            currency: true,
                            provider: true,
                        },
                    },
                },
            },
            coupon: {
                select: {
                    id: true,
                    code: true,
                    type: true,
                    value: true,
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
    orderId: string,
    shopId: string,
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    note?: string,
) => {
    return prisma.$transaction(async (tx) => {
        // atomic guard — same shape as cancel: only flips if it's STILL
        // in the exact state we validated against. Prevents a race where
        // two shop-status updates (or a customer cancel) land concurrently.
        const guard = await tx.order.updateMany({
            where: { id: orderId, shopId, status: currentStatus },
            data: {
                status: newStatus,
            },
        });
        if (guard.count === 0) {
            throw new AppError("Order status changed before this update could apply.", 409);
        }

        await tx.orderStatusHistory.create({
            data: {
                orderId,
                status: newStatus,
                note: note ?? `Order marked as ${newStatus} by shop.`,
            },
        });

        if (newStatus === "DELIVERED") {
            await tx.orderShipment.update({
                where: { orderId },
                data: { deliveredAt: new Date() },
            });
        }

        return tx.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                updatedAt: true,
            },
        });
    });
};

export const beginRefundRepository = async (orderId: string) => {
    const REFUNDABLE_FROM = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            select: { status: true },
        });
        if (!order) {
            return {
                success: false as const,
                reason: "not_found" as const,
            };
        }
        if (!REFUNDABLE_FROM.includes(order.status)) {
            return {
                success: false as const,
                reason: "Invalid_status" as const,
                currentStatus: order.status,
            };
        }

        const guard = await tx.order.updateMany({
            where: { id: orderId, status: order.status },
            data: { status: "REFUND_PENDING" },
        });
        if (guard.count === 0) {
            return { success: false as const, reason: "race" as const };
        }

        return { success: true as const, previousStatus: order.status };
    });
};

export const cancelRefundRepository = async (orderId: string, previousStatus: OrderStatus = "CONFIRMED") => {
    await prisma.order.updateMany({
        where: { id: orderId, status: "REFUND_PENDING" },
        data: { status: previousStatus },
    });
};

export const confirmRefundedRepository = async (orderId:string)=>{
    return prisma.$transaction( async ( tx)=>{
        /* 
        atomic guard — only fires if still REFUND_PENDING.
        Prevents double-processing on webhook retries, same pattern as payment success
         */

        const guard = await tx.order.updateMany({
            where: { id:orderId,status :"REFUND_PENDING"},
            data:{
                status:"REFUNDED"
            }
        })

        if(guard.count === 0){
            return {
                alreadyProcessed:true 
            }

            await tx.orderStatusHistory.create({
                data:{
                    orderId,
                    status:"REFUNDED",
                    note:"Refunded Confirmed Via Stripe."
                }
            })
            return { alreadyProcessed : false }
        }
    })
}
