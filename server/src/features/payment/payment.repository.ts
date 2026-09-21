
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
        await tx.payment.updateMany({
            where: { checkoutId, status: "PENDING" },
            data: { status: "FAILED" },
        });

        await tx.checkout.updateMany({
            where: { id: checkoutId, status: "PENDING" },
            data: { status: "FAILED" },
        });

        const checkout = await tx.checkout.findUnique({
            where: { id: checkoutId },
            select: { customerId: true },
        });

        return { customerId: checkout?.customerId };
    });
};

export const findPaymentForRefund = async ( orderId:string)=>{
  return prisma.payment.findUnique({
    where: { checkoutId: orderId }, // TODO update refund logic later
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

            const shopWallet = await tx.shopWallet.findUnique({ where: { shopId: order.shopId } });
            if (shopWallet) {
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
                        note: "Order payout (90%)"
                    }
                });
            }
        }

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

        await tx.payment.updateMany({
            where: { checkoutId: orderId, status: "COMPLETED" },
            data: { status: "REFUNDED" },
        });

        await tx.orderStatusHistory.create({
            data: { orderId, status: "REFUNDED", note: "Refund confirmed via Stripe." },
        });
        const order = await tx.order.findUnique({
            where: { id: orderId },
            select: { customerId: true },
        });

        return {
             alreadyProcessed: false as const, orderStateMismatch: false as const , customerId: order?.customerId
            };
    });
};

export const findPaymentByProviderId = async (providerPaymentId: string) => {
    return prisma.payment.findUnique({
        where: { providerPaymentId },
        select: { checkoutId: true },
    });
};
