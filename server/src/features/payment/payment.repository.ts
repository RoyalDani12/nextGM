
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { shopGroup,shipAddressInput } from "../orders/order.types.js";
import { getReservationExpiryTimestamp } from "../../infrastructure/queue/orderExpiration.helpers.js";
import { AppError } from "../../middleware/appError.js";


export const findPaymentByOrderId = async(orderId:string)=>{
  return prisma.payment.findUnique({
       where:{ orderId }
  })
}
/* 
export const updatePaymentProvider = async ( paymentId:string,providerPaymentId:string)=>{
  return prisma.payment.update({
    where: { id:paymentId },
    data: { providerPaymentId }
  })
} */
export const markPaymentFailed = async (orderId: string) => {
    return prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
            where: { orderId, status: "PENDING" },
            data: { status: "FAILED" },
        });

        const order = await tx.order.findUnique({
            where: { id: orderId },
            select: { customerId: true },
        });

        return { customerId: order?.customerId };
    });
};

export const findPaymentForRefund = async ( orderId:string)=>{
  return prisma.payment.findUnique({
    where: { orderId },
    select:{
      id:true,
      status:true,
      providerPaymentId:true,
      amount:true
    }
  })
}

export const markPaymendRefundPending = async (paymentId:string)=>{
  
  /*  no status change yet — REFUNDED is only set once Stripe's webhook confirms it. This just prevents a second refund attempt from firing while the first
  is still in flight with Stripe.*/

  return prisma.payment.findUnique({
    where:{ id: paymentId }
  })
}
/*   
 Atomically: insert-or-detect-duplicate the WebhookEvent AND update Payment/Order in ONE transaction. If any part fails, everything rolls back — including the WebhookEvent insert — so a failed update can never get permanently marked
"already processed."
 */

// import { env } from "../../config/env.js";
export const confirmCheckoutPaymentWithEventLog = async (
    checkoutId: string,
    providerPaymentId: string,
    stripeEventId: string,
    eventType: string,
) => {
    return prisma.$transaction(async (tx) => {
        try {
            await tx.webhookEvent.create({ data: { stripeEventId, type: eventType } });
        } catch (e: any) {
            if (e.code === "P2002") return { alreadyProcessed: true as const };
            throw e;
        }

        const checkoutGuard = await tx.checkout.updateMany({
            where: { id: checkoutId, status: "PENDING" },
            data: { status: "COMPLETED", providerPaymentId },
        });
        if (checkoutGuard.count === 0) return { alreadyProcessed: false as const, mismatch: true as const };

        const orders = await tx.order.findMany({
            where: { checkoutId },
            select: { id: true, shopId: true, totalAmount: true, customerId: true },
        });

        for (const order of orders) {
            await tx.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "CONFIRMED" } });
            await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CONFIRMED", note: "Payment confirmed via Stripe." } });

            // NEW — per-order Payment record, so GET /orders keeps working
            await tx.payment.create({
                data: {
                    orderId: order.id,
                    amount: order.totalAmount.toString(),
                    currency: "USD",
                    status: "COMPLETED",
                    provider: "STRIPE",
                    providerPaymentId,
                    idempotencyKey: crypto.randomUUID(),
                },
            });

            const total = Number(order.totalAmount);
            const fee = total * env.PLATFORM_COMMISSION_RATE;
            const shopEarnings = total - fee;

            const wallet = await tx.shopWallet.upsert({ where: { shopId: order.shopId }, create: { shopId: order.shopId, balance: shopEarnings }, update: { balance: { increment: shopEarnings } } });
            await tx.walletTransaction.create({ data: { shopId: order.shopId, orderId: order.id, type: "CREDIT", amount: shopEarnings, balanceAfter: wallet.balance, note: "Order payment" } });

            const platformWallet = await tx.platformWallet.upsert({ where: { id: "singleton" }, create: { id: "singleton", balance: fee }, update: { balance: { increment: fee } } });
            await tx.platformWalletTransaction.create({ data: { orderId: order.id, type: "CREDIT", amount: fee, balanceAfter: platformWallet.balance, note: "Platform commission" } });
        }

        return { alreadyProcessed: false as const, mismatch: false as const, customerId: orders[0]?.customerId, orderIds: orders.map(o => o.id) };
    });
};










export const findCheckoutByProviderPaymentId = async (providerPaymentId: string) => {
    return prisma.checkout.findUnique({ where: { providerPaymentId } });
};




export const confirmCheckoutRefundWithEventLog = async (
    checkoutId: string,
    stripeEventId: string,
    eventType: string,
) => {
    return prisma.$transaction(async (tx) => {
        try {
            await tx.webhookEvent.create({ data: { stripeEventId, type: eventType } });
        } catch (e: any) {
            if (e.code === "P2002") return { alreadyProcessed: true as const };
            throw e;
        }

        // guard changed: REFUND_PENDING → REFUNDED, not COMPLETED → REFUNDED.
        // The initiation endpoint already flipped it to REFUND_PENDING;
        // this webhook is the second, confirming step.
        const checkoutGuard = await tx.checkout.updateMany({
            where: { id: checkoutId, status: "REFUND_PENDING" },
            data: { status: "REFUNDED" },
        });
        if (checkoutGuard.count === 0) return { alreadyProcessed: false as const, mismatch: true as const };

        const orders = await tx.order.findMany({
            where: { checkoutId },
            select: { id: true, shopId: true, totalAmount: true, customerId: true },
        });

        for (const order of orders) {
            await tx.order.updateMany({ where: { id: order.id, status: "CONFIRMED" }, data: { status: "REFUNDED" } });
            await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "REFUNDED", note: "Refund confirmed via Stripe." } });
            await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "REFUNDED" } });

            const total = Number(order.totalAmount);
            const fee = total * env.PLATFORM_COMMISSION_RATE;
            const shopEarnings = total - fee;

            const wallet = await tx.shopWallet.update({ where: { shopId: order.shopId }, data: { balance: { decrement: shopEarnings } } });
            await tx.walletTransaction.create({ data: { shopId: order.shopId, orderId: order.id, type: "DEBIT", amount: shopEarnings, balanceAfter: wallet.balance, note: "Refund reversal" } });

            const platformWallet = await tx.platformWallet.update({ where: { id: "singleton" }, data: { balance: { decrement: fee } } });
            await tx.platformWalletTransaction.create({ data: { orderId: order.id, type: "DEBIT", amount: fee, balanceAfter: platformWallet.balance, note: "Refund reversal — platform fee" } });
        }

        return { alreadyProcessed: false as const, mismatch: false as const, customerId: orders[0]?.customerId };
    });
};

export const setPaymentProviderIntentId = async (paymentId: string, providerPaymentId: string) => {
    // idempotent by nature — setting the same value twice is harmless,
    // so this doesn't need the WebhookEvent dedupe machinery
    return prisma.payment.update({
        where: { id: paymentId },
        data: { providerPaymentId },
    });
};


// payment.repository.ts — add
export const findCheckoutById = async (checkoutId: string, customerId: string) => {
    return prisma.checkout.findFirst({ where: { id: checkoutId, customerId } });
};

export const setCheckoutSessionId = async (checkoutId: string, checkoutSessionId: string) => {
    return prisma.checkout.update({ where: { id: checkoutId }, data: { checkoutSessionId } });
};

export const createCheckoutFromCart = async (
    customerId: string,
    shopGroups: shopGroup[],
    shippingAddress: shipAddressInput,
) => {
    return prisma.$transaction(async (tx) => {
        const grandTotal = shopGroups.reduce((sum, g) =>
            sum + g.items.reduce((s, i) => s + Number(i.variant ? i.variant.price : i.product.basePrice) * Number(i.quantity), 0), 0);

        const checkout = await tx.checkout.create({
            data: {
                customerId,
                totalAmount: grandTotal.toFixed(2),
                idempotencyKey: crypto.randomUUID(),
            },
        });

        const createdOrders = [];

        for (const group of shopGroups) {
            let totalAmount = 0;
            for (const item of group.items) {
                const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.basePrice);
                totalAmount += unitPrice * Number(item.quantity);
            }

            const order = await tx.order.create({
                data: {
                    shopId: group.shopId,
                    customerId,
                    checkoutId: checkout.id,
                    totalAmount: totalAmount.toFixed(2),
                    status: "PENDING",
                    idempotencyKey: crypto.randomUUID(),
                    reservationExpiresAt: getReservationExpiryTimestamp(),
                },
            });

            for (const item of group.items) {
                const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.basePrice);
                await tx.orderItem.create({
                    data: { orderId: order.id, productId: item.productId, variantId: item.variantId ?? null, quantity: Number(item.quantity), unitPrice: unitPrice.toFixed(2) },
                });
            }

            await tx.shippingAddress.create({
                data: { orderId: order.id, ...shippingAddress },
            });

            await tx.orderStatusHistory.create({
                data: { orderId: order.id, status: "PENDING", note: "Order placed by customer." },
            });

            for (const item of group.items) {
                const decrement = item.variantId
                    ? await tx.productVariant.updateMany({ where: { id: item.variantId, stock: { gte: item.quantity as number } }, data: { stock: { decrement: item.quantity as number } } })
                    : await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity as number } }, data: { stock: { decrement: item.quantity  as number } } });

                if (decrement.count === 0) {
                    throw new AppError(`Insufficient stock for ${item.product.name}.`, 409);
                }
            }

            createdOrders.push({ id: order.id, shopId: group.shopId, shopSlug: group.shopSlug, totalAmount: totalAmount.toFixed(2), itemCount: group.items.length });
        }

        return { checkoutId: checkout.id, orders: createdOrders, grandTotal: grandTotal.toFixed(2) };
    });
};

export const findCheckoutForRefund = async (checkoutId: string) => {
    return prisma.checkout.findUnique({
        where: { id: checkoutId },
        select: { id: true, status: true, providerPaymentId: true, customerId: true },
    });
};

export const beginCheckoutRefundRepository = async (checkoutId: string) => {
    return prisma.$transaction(async (tx) => {
        const checkout = await tx.checkout.findUnique({
            where: { id: checkoutId },
            select: { status: true },
        });

        if (!checkout) {
            return { success: false as const, reason: "not_found" as const };
        }

        if (checkout.status !== "COMPLETED") {
            return { success: false as const, reason: "invalid_status" as const, currentStatus: checkout.status };
        }

        // atomic guard — same pattern as everywhere else: only flips if
        // still COMPLETED, blocking a second refund click while the
        // first is in flight with Stripe
        const guard = await tx.checkout.updateMany({
            where: { id: checkoutId, status: "COMPLETED" },
            data: { status: "REFUND_PENDING" },
        });

        if (guard.count === 0) {
            return { success: false as const, reason: "race" as const };
        }

        return { success: true as const };
    });
};