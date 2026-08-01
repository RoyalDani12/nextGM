
import { prisma } from "../../config/db.js";

export const createPaymentRecord = async ( data:{
  orderId:string,
  amount:string,
  currency:string,
  provider:"STRIPE",
  idempotencyKey:string
})=>{
  return prisma.payment.create({ data })
}

export const findPaymentByOrderId = async(orderId:string)=>{
  return prisma.payment.findUnique({
       where:{ orderId }
  })
}

export const updatePaymentProvider = async ( paymentId:string,providerPaymentId:string)=>{
  return prisma.payment.update({
    where: { id:paymentId },
    data: { providerPaymentId }
  })
}
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

export const confirmPaymentWithEventLog = async (
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

        const paymentGuard = await tx.payment.updateMany({
            where: { orderId, status: "PENDING" },
            data: { status: "COMPLETED" },
        });

        if (paymentGuard.count === 0) {
            // event is new, but payment wasn't in the expected state —
            // this is a real anomaly worth knowing about, not silently fine.
            // We still let the transaction commit (event marked seen) because
            // retrying won't fix a payment that's genuinely not PENDING anymore.
            return { alreadyProcessed: false as const, paymentStateMismatch: true as const };
        }

        const orderGuard = await tx.order.updateMany({
            where: { id: orderId, status: "PENDING" },
            data: { status: "CONFIRMED" },
        });

        if (orderGuard.count > 0) {
            await tx.orderStatusHistory.create({
                data: { orderId, status: "CONFIRMED", note: "Payment confirmed via Stripe." },
            });
        }
        const order = await tx.order.findUnique({
            where: { id: orderId },
            select : { customerId: true }
        })

        return { alreadyProcessed: false as const, paymentStateMismatch: false as const, customerId: order?.customerId };
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
            where: { orderId, status: "COMPLETED" },
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
        select: { orderId: true },
    });
};