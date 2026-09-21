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
} from "./payment.repository.js";
import {
    beginRefundRepository,
} from "../orders/order.repository.js";
import { cancelOrderExpiration } from "../../infrastructure/queue/orderExpiration.helpers.js";
import { notifyUser } from "../notification/notification.service.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createPaymentIntentService = async (checkoutId: string, customerId: string) => {
    const { prisma } = await import("../../config/db.js");
    const checkout = await prisma.checkout.findUnique({ where: { id: checkoutId } });

    if (!checkout) {
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
    const result = await confirmRefundWithEventLog(payment.checkoutId, eventId, eventType);

    if (result?.alreadyProcessed) {
        logger.info({ checkoutId: payment.checkoutId }, "Duplicate webhook event, skipping");
        return;
    }
    if (result.orderStateMismatch) {
        logger.error(
            { checkoutId: payment.checkoutId },
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
                body: `Your refund for checkout #${payment.checkoutId} has been processed.`,
            });
        } catch (err) {
            logger.error({ err, checkoutId: payment.checkoutId }, "Failed to send refund notification");
        }
    }

    logger.info(
        { checkoutId: payment.checkoutId, chargeId: charge.id },
        "Order Marked REFUNDED Via Webhook",
    );
};

export const initiateRefundService = async (orderId: string) => {
    const payment = await findPaymentForRefund(orderId);

    if (!payment) {
        throw new AppError("No payment found for this order.", 404);
    }

    if (payment.status !== "COMPLETED") {
        throw new AppError(`Cannot refund - payment status is ${payment.status}`, 400);
    }

    if (!payment.providerPaymentId) {
        throw new AppError("Payment has no associated Stripe refrence.", 400);
    }

    const guard = await beginRefundRepository(orderId);

    if (!guard.success) {
        if (guard.reason === "not_found") {
            throw new AppError("Checkout not found.", 404);
        }
        if (guard.reason === "Invalid_status") {
            throw new AppError(
                `Order cannot be refunded — current status is ${guard.currentStatus}.`,
                400,
            );
        }
        throw new AppError("Refund already in progress for this order.", 409);
    }

    /* call Stripe — the webhook (charge.refunded) is what actually confirms. this and flips status to REFUNDED. This call just starts the process. */

    const refund = await stripe.refunds.create({
        payment_intent: payment.providerPaymentId,
    });

    logger.info(
        {
            orderId,
            refundId: refund.id,
        },
        "Refund Intailized with Stripe",
    );

    return { orderId, refundId: refund.id, status: "REFUND_PENDING" };
};
