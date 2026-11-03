import Stripe from "stripe";
import crypto from "crypto";
import { AppError } from "../../middleware/appError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import {
    createPaymentRecord,
    findPaymentByCheckoutId,
    findPaymentForRefund,
    markPaymentFailed,
    confirmPaymentWithEventLog,
    confirmRefundWithEventLog,
    updatePaymentProvider,
    findPaymentByProviderId,
    executeAdminRefundLedger,
} from "./payment.repository.js";
import {
    beginRefundRepository,
    cancelRefundRepository,
} from "../orders/order.repository.js";
import { cancelOrderExpiration } from "../../infrastructure/queue/orderExpiration.helpers.js";
import { notifyUser } from "../notification/notification.service.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createPaymentIntentService = async (checkoutId: string, customerId: string) => {
    const { prisma } = await import("../../config/db.js");
    const checkout = await prisma.checkout.findUnique({ where: { id: checkoutId } });

    if (!checkout || checkout.customerId !== customerId) {
        throw new AppError("Checkout not found.", 404);
    }

    if (checkout.status !== "PENDING") {
        throw new AppError(`Checkout cannot be paid - current status is ${checkout.status}.`, 400);
    }

    // idempotent on repeated calls — if a payment record already exists
    // for this order, reuse it instead of creating a duplicate PaymentIntent.
    // This matters if the customer refreshes the payment page.
    const existing = await findPaymentByCheckoutId(checkoutId);

    if (existing?.providerPaymentId) {
        const intent = await stripe.paymentIntents.retrieve(existing.providerPaymentId);
        return {
            clientSecret: intent.client_secret,
            paymentId: existing.id,
        };
    }
    const amountInCents = Math.round(Number(checkout.totalAmount) * 100);
    const payment =
        existing ??
        (await createPaymentRecord({
            checkoutId,
            amount: checkout.totalAmount.toString(),
            currency: "USD",
            provider: "STRIPE",
            idempotencyKey: crypto.randomUUID(),
        }));

    // Stripe uses the same key if two requests arrive at once, so only one
    // PaymentIntent can be created for this order.
    const intent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { checkoutId },
    }, { idempotencyKey: payment.idempotencyKey });

    await updatePaymentProvider(payment.id, intent.id);

    logger.info(
        { checkoutId, paymentId: payment.id, stripePaymentIntentId: intent.id },
        "PaymentIntent created",
    );

    return {
        clientSecret: intent.client_secret,
        paymentId: payment.id,
    };
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
        case "account.updated":
            const { handleAccountUpdatedWebhook } = await import("../payouts/payout.service.js");
            await handleAccountUpdatedWebhook(event.data.object as Stripe.Account);
            break;
        default:
            logger.info({ type: event.type }, "Unhandled stripe type");
    }
};

const handlePaymentSucceeded = async (
    intent: Stripe.PaymentIntent,
    eventId: string,
    eventType: string,
) => {
    const checkoutId = intent.metadata.checkoutId;

    if (!checkoutId) {
        logger.error(
            { intentId: intent.id },
            " PaymentIntent succeeded but has no checkoutId metadata",
        );
        return;
    }

    const result = await confirmPaymentWithEventLog(checkoutId, eventId, eventType);

    if (result.alreadyProcessed) {
        logger.info({ checkoutId }, "Duplicate webhook event, skipping");
        return;
    }
    if (result.paymentStateMismatch) {
        logger.error(
            { checkoutId },
            "Payment was not PENDING when success webhook arrived — investigate",
        );
        return;
    }
    try {
        await notifyUser({
            userId: result.customerId || "not user id",
            type: "PAYMENT_SUCCESS",
            title: "Payment successful",
            body: `Your payment for checkout #${checkoutId} was successful.`,
        });
    } catch (err) {}

    try {
        if (result.orderIds) await Promise.all(result.orderIds.map((id: string) => cancelOrderExpiration(id)));
    } catch (err) {
        logger.error({ err, checkoutId }, "Faild to cancel expiration job after payment success.");
    }
    logger.info({ checkoutId, intentId: intent.id }, "Checkout confirmed via successful payment.");
};

const handlePaymentFailed = async (intent: Stripe.PaymentIntent) => {
    const checkoutId = intent.metadata.checkoutId;

    if (!checkoutId) {
        logger.error({ intentId: intent.id }, "Payment intent failed but has no checkoutId metadata");
        return;
    }
    const { customerId } = await markPaymentFailed(checkoutId);

    if (customerId) {
        try {
            await notifyUser({
                userId: customerId,
                type: "PAYMENT_FAILED",
                title: "Payment failed",
                body: `Your payment for checkout #${checkoutId} could not be processed. Please try again.`,
            });
        } catch (err) {
            logger.error({ err, checkoutId }, "Failed to send payment-failed notification");
        }
    }

    logger.info({ checkoutId, intentId: intent.id }, "Payment failed, checkout remains PENDING");
};

const handleChargeRefunded = async (charge: Stripe.Charge, eventId: string, eventType: string) => {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
        logger.error(
            {
                chargeId: charge.id,
            },
            "Refunded Charge Has No Linked PaymentIntent",
        );
        return;
    }

    const payment = await findPaymentByProviderId(paymentIntentId);
    if (!payment) {
        logger.error(
            {
                paymentIntentId,
            },
            "No Payment record found for refunded charge",
        );
        return;
    }
    if (!payment.orderId) {
        logger.error(
            { checkoutId: payment.checkoutId, paymentIntentId },
            "No pending order found for refunded payment",
        );
        return;
    }

    const result = await confirmRefundWithEventLog(payment.orderId, eventId, eventType);

    if (result?.alreadyProcessed) {
        logger.info({ orderId: payment.orderId }, "Duplicate webhook event, skipping");
        return;
    }
    if (result.orderStateMismatch) {
        logger.error(
            { orderId: payment.orderId },
            "Order was not REFUND_PENDING when refund webhook arrived — investigate",
        );
        return;
    }
     if (result.customerId) {
        try {
            await notifyUser({
                userId: result.customerId,
                type: "PAYMENT_REFUNDED",
                title: "Refund processed",
                body: `Your refund for order #${payment.orderId.slice(-8).toUpperCase()} has been processed.`,
            });
        } catch (err) {
            logger.error({ err, orderId: payment.orderId }, "Failed to send refund notification");
        }
    }

    logger.info(
        { orderId: payment.orderId, chargeId: charge.id },
        "Order Marked REFUNDED Via Webhook",
    );
};

export const initiateRefundService = async (orderId: string) => {
    const payment = await findPaymentForRefund(orderId);
    const pending = await beginRefundRepository(orderId);

    if (!pending.success) {
        throw new AppError("Order is not eligible for refund.", 400);
    }

    let stripeRefundId = `ref_admin_${Date.now()}`;

    // If a valid live Stripe reference is attached, attempt actual Stripe refund
    if (payment?.providerPaymentId && !payment.providerPaymentId.startsWith("mock_")) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: payment.providerPaymentId,
            });
            stripeRefundId = refund.id;
            logger.info({ orderId, refundId: refund.id }, "Refund initialized with Stripe successfully");
        } catch (stripeErr: any) {
            await cancelRefundRepository(orderId, pending.previousStatus);
            logger.error({ orderId, err: stripeErr.message }, "Stripe refund API call failed");
            throw new AppError("Stripe refund could not be initiated.", 502);
        }
    }

    if (payment?.providerPaymentId && !payment.providerPaymentId.startsWith("mock_")) {
        return { orderId, refundId: stripeRefundId, status: "REFUND_PENDING" };
    }

    // Local/mock payments have no Stripe webhook, so finalize them immediately.
    const ledgerResult = await executeAdminRefundLedger(orderId, stripeRefundId);

    // Notify customer about the issued refund
    try {
        if (ledgerResult.customerId) {
            await notifyUser({
                userId: ledgerResult.customerId,
                type: "PAYMENT_REFUNDED",
                title: "Refund Approved & Issued",
                body: `Your refund for order #${orderId.slice(-8).toUpperCase()} has been processed and issued.`,
                meta: { orderId, refundId: stripeRefundId },
            });
        }
    } catch (e: any) {
        logger.warn({ err: e.message }, "Failed to send refund notification to customer");
    }

    return { orderId, refundId: stripeRefundId, status: "REFUNDED" };
};
