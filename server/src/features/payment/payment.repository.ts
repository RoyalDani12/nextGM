
import { prisma } from "../../config/db.js";

export const createPaymentRecord = async ( data:{
  checkoutId:string,
  amount:string,
  currency:string,
  provider:"STRIPE",
  idempotencyKey:string
})=>{
  return prisma.payment.upsert({
    where: { checkoutId: data.checkoutId },
    create: data,
    update: {},
  })
}

export const findPaymentByCheckoutId = async(checkoutId:string)=>{
  return prisma.payment.findUnique({
       where:{ checkoutId }
  })
}

export const updatePaymentProvider = async ( paymentId:string,providerPaymentId:string)=>{
  return prisma.payment.update({
    where: { id:paymentId },
    data: { providerPaymentId }
  })
}
export const markPaymentFailed = async (checkoutId: string) => {
    return prisma.$transaction(async (tx) => {
        const couponOrders = await tx.order.findMany({
            where: { checkoutId, status: "PENDING", couponId: { not: null } },
            select: { couponId: true, customerId: true },
        });
        await tx.payment.updateMany({
            where: { checkoutId, status: "PENDING" },
            data: { status: "FAILED" },
        });

        await tx.checkout.updateMany({
            where: { id: checkoutId, status: "PENDING" },
            data: { status: "FAILED" },
        });

        // A coupon is reserved during checkout to prevent exceeding its limits. If the
        // payment fails, release that reservation so the customer can try again.
        for (const order of couponOrders) {
            if (!order.couponId) continue;
            const released = await tx.couponUsage.deleteMany({ where: { couponId: order.couponId, userId: order.customerId } });
            if (released.count) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { decrement: 1 } } });
        }

        const checkout = await tx.checkout.findUnique({
            where: { id: checkoutId },
            select: { customerId: true },
        });

        return { customerId: checkout?.customerId };
    });
};

export const findPaymentForRefund = async (orderId: string) => {
  // 1. Direct match on checkoutId (in case orderId was checkoutId)
  let payment = await prisma.payment.findUnique({
    where: { checkoutId: orderId },
    select: {
      id: true,
      status: true,
      providerPaymentId: true,
      amount: true,
      checkoutId: true,
    },
  });
  if (payment) return payment;

  // 2. Query order to retrieve its checkoutId
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { checkoutId: true },
  });
  if (order?.checkoutId) {
    payment = await prisma.payment.findUnique({
      where: { checkoutId: order.checkoutId },
      select: {
        id: true,
        status: true,
        providerPaymentId: true,
        amount: true,
        checkoutId: true,
      },
    });
  }
  return payment;
};

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

export const confirmPaymentWithEventLog = async (
    checkoutId: string,
    stripeEventId: string,
    eventType: string,
) => {
    return prisma.$transaction(async (tx) => {
        try {
            await tx.webhookEvent.create({ data: { stripeEventId, type: eventType } });
        } catch (err: any) {
            if (err.code === "P2002") {
                return { alreadyProcessed: true as const };
            }
            throw err;
        }

        const paymentGuard = await tx.payment.updateMany({
            where: { checkoutId, status: "PENDING" },
            data: { status: "COMPLETED" },
        });

        if (paymentGuard.count === 0) {
            return { alreadyProcessed: false as const, paymentStateMismatch: true as const };
        }

        await tx.checkout.updateMany({
            where: { id: checkoutId, status: "PENDING" },
            data: { status: "COMPLETED" },
        });

        const checkout = await tx.checkout.findUnique({
            where: { id: checkoutId },
            include: { orders: true }
        });

        if (!checkout) throw new Error("Checkout not found");

        let totalPlatformFee = 0;

        for (const order of checkout.orders) {
            if (order.status !== "PENDING") continue;

            await tx.order.update({
                where: { id: order.id },
                data: { status: "CONFIRMED" },
            });

            await tx.orderStatusHistory.create({
                data: { orderId: order.id, status: "CONFIRMED", note: "Payment confirmed via Stripe Checkout." },
            });

            // Settlement
            const orderTotal = Number(order.totalAmount);
            const platformFee = orderTotal * 0.10;
            const shopCut = orderTotal - platformFee;
            totalPlatformFee += platformFee;

            let shopWallet = await tx.shopWallet.findUnique({ where: { shopId: order.shopId } });
            if (!shopWallet) {
                shopWallet = await tx.shopWallet.create({
                    data: {
                        shopId: order.shopId,
                        balance: 0,
                        payoutsEnabled: false,
                    },
                });
            }
            const newBalance = Number(shopWallet.balance) + shopCut;
            await tx.shopWallet.update({
                where: { shopId: order.shopId },
                data: { balance: newBalance }
            });
            await tx.walletTransaction.create({
                data: {
                    shopId: order.shopId,
                    orderId: order.id,
                    type: "CREDIT",
                    amount: shopCut,
                    balanceAfter: newBalance,
                    note: `Order settlement (90%) - Order #${order.id.slice(-6)}`
                }
            });
        }

        await tx.inventoryReservation.updateMany({
            where: {
                orderId: { in: checkout.orders.map((order) => order.id) },
                status: "ACTIVE",
            },
            data: { status: "COMMITTED" },
        });

        // Platform Wallet
        if (totalPlatformFee > 0) {
            let platformWallet = await tx.platformWallet.findFirst();
            if (!platformWallet) {
                platformWallet = await tx.platformWallet.create({ data: { balance: 0 } });
            }
            const newPlatformBalance = Number(platformWallet.balance) + totalPlatformFee;
            await tx.platformWallet.update({
                where: { id: platformWallet.id },
                data: { balance: newPlatformBalance }
            });
            await tx.platformWalletTransaction.create({
                data: {
                    checkoutId: checkout.id,
                    type: "CREDIT",
                    amount: totalPlatformFee,
                    balanceAfter: newPlatformBalance,
                    note: "Platform commission (10%)"
                }
            });
        }

        return { alreadyProcessed: false as const, paymentStateMismatch: false as const, customerId: checkout.customerId, orderIds: checkout.orders.map((o: any) => o.id) };
    });
};


export const confirmRefundWithEventLog = async (
    orderId: string,
    stripeEventId: string,
    eventType: string,
) => {
    return prisma.$transaction(async (tx) => {
        try {
            await tx.webhookEvent.create({ data: { stripeEventId, type: eventType } });
        } catch (err: any) {
            if (err.code === "P2002") {
                return { alreadyProcessed: true as const };
            }
            throw err;
        }

        const orderGuard = await tx.order.updateMany({
            where: { id: orderId, status: "REFUND_PENDING" },
            data: { status: "REFUNDED" },
        });

        if (orderGuard.count === 0) {
            return { alreadyProcessed: false as const, orderStateMismatch: true as const };
        }

        const order = await tx.order.findUnique({
            where: { id: orderId },
            select: { checkoutId: true, customerId: true, shopId: true, totalAmount: true },
        });

        if (!order) {
            throw new Error("Order not found");
        }

        await tx.payment.updateMany({
            where: { checkoutId: order.checkoutId, status: "COMPLETED" },
            data: { status: "REFUNDED" },
        });

        await tx.orderStatusHistory.create({
            data: { orderId, status: "REFUNDED", note: "Refund confirmed via Stripe." },
        });
        const returnRequests = await tx.returnRequest.findMany({
            where: { orderId, status: "REFUND_PENDING" },
            select: { id: true },
        });
        if (returnRequests.length) {
            await tx.returnRequest.updateMany({
                where: { orderId, status: "REFUND_PENDING" },
                data: { status: "REFUNDED", resolvedAt: new Date() },
            });
            await tx.returnStatusHistory.createMany({
                data: returnRequests.map((request) => ({
                    returnRequestId: request.id,
                    status: "REFUNDED" as const,
                    note: "Refund confirmed by Stripe.",
                })),
            });
        }
        const shopWallet = await tx.shopWallet.findUnique({ where: { shopId: order.shopId } });
        if (shopWallet) {
            const shopCut = Math.round(Number(order.totalAmount) * 0.9 * 100) / 100;
            const newBalance = Math.max(0, Number(shopWallet.balance) - shopCut);
            await tx.shopWallet.update({
                where: { shopId: order.shopId },
                data: { balance: newBalance },
            });
            await tx.walletTransaction.create({
                data: {
                    shopId: order.shopId,
                    orderId,
                    type: "DEBIT",
                    amount: shopCut,
                    balanceAfter: newBalance,
                    note: "Customer return refund debit (90%)",
                },
            });
        }

        return {
             alreadyProcessed: false as const, orderStateMismatch: false as const, customerId: order.customerId
            };
    });
};

export const findPaymentByProviderId = async (providerPaymentId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { providerPaymentId },
        select: {
            checkoutId: true,
            checkout: {
                select: {
                    orders: {
                        where: { status: "REFUND_PENDING" },
                        select: { id: true },
                        take: 1,
                    },
                },
            },
        },
    });

    return payment
        ? {
            checkoutId: payment.checkoutId,
            orderId: payment.checkout.orders[0]?.id,
        }
        : null;
};

export const executeAdminRefundLedger = async (orderId: string, refundRefId: string = `ref_admin_${Date.now()}`) => {
    return prisma.$transaction(async (tx) => {
        const targetOrder = await tx.order.findUnique({
            where: { id: orderId },
            select: { id: true, checkoutId: true, customerId: true, totalAmount: true, shopId: true },
        });

        if (!targetOrder) throw new Error("Order not found.");

        await tx.order.update({
            where: { id: orderId },
            data: { status: "REFUNDED" },
        });

        if (targetOrder.checkoutId) {
            await tx.payment.updateMany({
                where: { checkoutId: targetOrder.checkoutId, status: { in: ["COMPLETED", "PENDING"] } },
                data: { status: "REFUNDED" },
            });
        }

        await tx.orderStatusHistory.create({
            data: { orderId, status: "REFUNDED", note: `Refund processed by platform administrator (${refundRefId}).` },
        });

        const returnRequests = await tx.returnRequest.findMany({
            where: { orderId, status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "ITEM_RECEIVED", "REFUND_PENDING"] } },
            select: { id: true },
        });

        if (returnRequests.length) {
            await tx.returnRequest.updateMany({
                where: { id: { in: returnRequests.map(r => r.id) } },
                data: { status: "REFUNDED", resolvedAt: new Date() },
            });
            await tx.returnStatusHistory.createMany({
                data: returnRequests.map((request) => ({
                    returnRequestId: request.id,
                    status: "REFUNDED" as const,
                    note: `Refund confirmed and issued to customer (${refundRefId}).`,
                })),
            });
        }

        // Reverse 90% merchant earnings from ShopWallet
        const orderTotal = Number(targetOrder.totalAmount);
        const shopCut = Math.round(orderTotal * 0.90 * 100) / 100;
        const shopWallet = await tx.shopWallet.findUnique({ where: { shopId: targetOrder.shopId } });
        if (shopWallet) {
            const newBalance = Math.max(0, Number(shopWallet.balance) - shopCut);
            await tx.shopWallet.update({
                where: { shopId: targetOrder.shopId },
                data: { balance: newBalance },
            });
            await tx.walletTransaction.create({
                data: {
                    shopId: targetOrder.shopId,
                    orderId,
                    type: "DEBIT",
                    amount: shopCut,
                    balanceAfter: newBalance,
                    note: "Customer return refund debit (90%)",
                },
            });
        }

        return { success: true, orderId, refundRefId, customerId: targetOrder.customerId };
    });
};
