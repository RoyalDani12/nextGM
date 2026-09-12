import Stripe from "stripe";
import { prisma } from "../../config/db.js";
import crypto from "crypto";
import { AppError } from "../../middleware/appError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import {
    findPaymentByOrderId,
    findPaymentForRefund,
    markPaymentFailed,
    confirmCheckoutRefundWithEventLog,
    confirmCheckoutPaymentWithEventLog,
    setPaymentProviderIntentId,
    findCheckoutById,
    setCheckoutSessionId,
    findCheckoutByProviderPaymentId,
    findCheckoutForRefund,
    beginCheckoutRefundRepository,
} from "./payment.repository.js";
import { beginRefundRepository } from "../orders/order.repository.js";
import { clearUserCart as clearCart } from "../cart/cart.repository.js";
import { cancelOrderExpiration } from "../../infrastructure/queue/orderExpiration.helpers.js";
import { notifyUser } from "../notification/notification.service.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);


export const createCheckoutSessionService = async (checkoutId: string, customerId: string) => {
    const checkout = await findCheckoutById(checkoutId, customerId);

    if (!checkout) throw new AppError("Checkout not found.", 404);
    if (checkout.status !== "PENDING") throw new AppError(`Cannot pay — status is ${checkout.status}.`, 400);

    if (checkout.checkoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(checkout.checkoutSessionId);
        if (session.status === "open" && session.url) return { checkoutUrl: session.url };
    }

    const amountInCents = Math.round(Number(checkout.totalAmount) * 100);

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price_data: { currency: "usd", product_data: { name: `Nexions order #${checkoutId.slice(-8).toUpperCase()}` }, unit_amount: amountInCents }, quantity: 1 }],
        metadata: { checkoutId },
        payment_intent_data: { metadata: { checkoutId } },
        success_url: `${env.CLIENT_URL}/order-confirmation?checkout_id=${checkoutId}`,
        cancel_url: `${env.CLIENT_URL}/checkout?canceled=true`,
    });

    await setCheckoutSessionId(checkoutId, session.id);

    return { checkoutUrl: session.url! }; // frontend does window.location.href = checkoutUrl — real redirect to Stripe's hosted page
};

export const constructStripeEvent = (rawBody: Buffer, signature: string) => {
    try {
        return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        logger.error({ err }, "Stripe webhook signature verification failed");
        throw new AppError("Invalid webhook signature", 400);
    }
};

export const handleStripeWebhookEvent = async (event: Stripe.Event) => {
    switch (event.type) {
        case "checkout.session.completed":
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
            break;
        case "payment_intent.succeeded":
            await handlePaymentSucceeded(
                event.data.object as Stripe.PaymentIntent,
                event.id,
                event.type,
            );
            break;
       case "payment_intent.payment_failed":
            await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
            break;
        case "charge.refunded":
            await handleChargeRefunded(event.data.object as Stripe.Charge, event.id, event.type);
            break;
        default:
            logger.info({ type: event.type }, "Unhandled stripe type");
    }
};
const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
    const orderId = session.metadata?.orderId;
    const paymentIntentId = session.payment_intent as string;

    if (!orderId || !paymentIntentId) {
        logger.error({ sessionId: session.id }, "Checkout session completed but missing orderId or payment_intent");
        return;
    }
     const payment = await findPaymentByOrderId(orderId);
    if (!payment) {
        logger.error({ orderId, sessionId: session.id }, "No Payment record found for completed checkout session");
        return;
    }

    // records the REAL payment_intent id, needed later for refunds —
    // naturally idempotent, no WebhookEvent dedupe needed here
    await setPaymentProviderIntentId(payment.id, paymentIntentId);

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { customerId: true },
        });

        if (order?.customerId) {
            await clearCart(order.customerId);
            logger.info({ orderId, customerId: order.customerId }, "Cart cleared successfully via webhook after payment completion");
        }
    } catch (err) {
        logger.error({ err, orderId }, "Failed to clear cart during checkout session completion webhook");
    }

    logger.info({ orderId, sessionId: session.id, paymentIntentId }, "Checkout session completed, PaymentIntent recorded");
};

const handlePaymentSucceeded = async (intent: Stripe.PaymentIntent, eventId: string, eventType: string) => {
    const checkoutId = intent.metadata.checkoutId;
    if (!checkoutId) {
        logger.error({ intentId: intent.id }, "PaymentIntent succeeded but has no checkoutId metadata");
        return;
    }

    const result = await confirmCheckoutPaymentWithEventLog(checkoutId, intent.id, eventId, eventType);

    if (result.alreadyProcessed || result.mismatch) {
        logger.info({ checkoutId }, "Skipped — duplicate or state mismatch");
        return;
    }

    for (const orderId of result.orderIds ?? []) {
        await cancelOrderExpiration(orderId).catch((err) => logger.error({ err, orderId }, "Failed to cancel expiration"));
    }

    if (result.customerId) {
        await clearCart(result.customerId).catch((err) => logger.error({ err }, "Failed to clear cart"));
        await notifyUser({ userId: result.customerId, type: "PAYMENT_SUCCESS", title: "Payment successful", body: "Your order has been confirmed." }).catch(() => {});
    }

    logger.info({ checkoutId, intentId: intent.id }, "Checkout confirmed via successful payment");
};

const handlePaymentFailed = async (intent: Stripe.PaymentIntent) => {
    const orderId = intent.metadata.orderId;

    if (!orderId) {
        logger.error({ intentId: intent.id }, "Payment intent failed but has no orderId metadata");
        return;
    }
    const { customerId } = await markPaymentFailed(orderId);

    if (customerId) {
        try {
            await notifyUser({
                userId: customerId,
                type: "PAYMENT_FAILED",
                title: "Payment failed",
                body: `Your payment for order #${orderId} could not be processed. Please try again.`,
            });
        } catch (err) {
            logger.error({ err, orderId }, "Failed to send payment-failed notification");
        }
    }

    logger.info({ orderId, intentId: intent.id }, "Payment failed, order remains PENDING");
};
const handleChargeRefunded = async (charge: Stripe.Charge, eventId: string, eventType: string) => {
    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) {
        logger.error({ chargeId: charge.id }, "Refunded charge has no linked PaymentIntent");
        return;
    }

    const checkout = await findCheckoutByProviderPaymentId(paymentIntentId);
    if (!checkout) {
        logger.error({ paymentIntentId }, "No Checkout found for refunded charge");
        return;
    }

    const result = await confirmCheckoutRefundWithEventLog(checkout.id, eventId, eventType);

    if (result.alreadyProcessed || result.mismatch) {
        logger.info({ checkoutId: checkout.id }, "Skipped — duplicate or state mismatch");
        return;
    }

    if (result.customerId) {
        try {
            await notifyUser({
                userId: result.customerId,
                type: "PAYMENT_REFUNDED",
                title: "Refund processed",
                body: "Your refund has been processed.",
            });
        } catch (err) {
            logger.error({ err, checkoutId: checkout.id }, "Failed to send refund notification");
        }
    }

    logger.info({ checkoutId: checkout.id, chargeId: charge.id }, "Checkout marked REFUNDED via webhook");
};


export const initiateCheckoutRefundService = async (checkoutId: string) => {
    const checkout = await findCheckoutForRefund(checkoutId);

    if (!checkout) {
        throw new AppError("Checkout not found.", 404);
    }

    if (!checkout.providerPaymentId) {
        throw new AppError("Checkout has no associated Stripe payment.", 400);
    }

    const guard = await beginCheckoutRefundRepository(checkoutId);

    if (!guard.success) {
        if (guard.reason === "not_found") throw new AppError("Checkout not found.", 404);
        if (guard.reason === "invalid_status") {
            throw new AppError(`Cannot refund — checkout status is ${guard.currentStatus}.`, 400);
        }
        throw new AppError("Refund already in progress for this checkout.", 409);
    }

    const refund = await stripe.refunds.create({
        payment_intent: checkout.providerPaymentId,
    });

    logger.info({ checkoutId, refundId: refund.id }, "Refund initiated with Stripe");

    return { checkoutId, refundId: refund.id, status: "REFUND_PENDING" };
};