import Stripe from "stripe";
import crypto from "crypto";
import { AppError } from "../../middleware/appError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import {
    createPaymentRecord,
    findPaymentByOrderId,
    findPaymentForRefund,
    markPaymentFailed,
    confirmPaymentWithEventLog,
    confirmRefundWithEventLog,
    updatePaymentProvider,
    findPaymentByProviderId,
} from "./payment.repository.js";
import {
    beginRefundRepository,
    confirmRefundedRepository,
    getCustomerOrderByIdRepository,
} from "../orders/order.repository.js";
import { cancelOrderExpiration } from "../../infrastructure/queue/orderExpiration.helpers.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createPaymentIntentService = async (orderId: string, customerId: string) => {
    const order = await getCustomerOrderByIdRepository(orderId, customerId);

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    if (order.status !== "PENDING") {
        throw new AppError(`Order connot be paid - current status is ${order.status}.`, 400);
    }

    // idempotent on repeated calls — if a payment record already exists
    // for this order, reuse it instead of creating a duplicate PaymentIntent.
    // This matters if the customer refreshes the payment page.
    const existing = await findPaymentByOrderId(orderId);

    if (existing?.providerPaymentId) {
        const intent = await stripe.paymentIntents.retrieve(existing.providerPaymentId);
        return {
            clientSecret: intent.client_secret,
            paymentId: existing.id,
        };
    }
    const amountInCents = Math.round(Number(order.totalAmount) * 100);
    const intent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        payment_method_types: ["card"],
        metadata: { orderId },
    });

    const payment =
        existing ??
        (await createPaymentRecord({
            orderId,
            amount: order.totalAmount.toString(),
            currency: "USD",
            provider: "STRIPE",
            idempotencyKey: crypto.randomUUID(),
        }));

    await updatePaymentProvider(payment.id, intent.id);

    logger.info(
        { orderId, paymentId: payment.id, stripePaymentIntentId: intent.id },
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
        default:
            logger.info({ type: event.type }, "Unhandled stripe type");
    }
};

const handlePaymentSucceeded = async (
    intent: Stripe.PaymentIntent,
    eventId: string,
    eventType: string,
) => {
    const orderId = intent.metadata.orderId;

    if (!orderId) {
        logger.error(
            { intentId: intent.id },
            " PaymentIntent succeeded but has no orderId metadata",
        );
        return;
    }

    const result = await confirmPaymentWithEventLog(orderId, eventId, eventType);

    if (result.alreadyProcessed) {
        logger.info({ orderId }, "Duplicate webhook event, skipping");
        return;
    }
    if (result.paymentStateMismatch) {
        logger.error(
            { orderId },
            "Payment was not PENDING when success webhook arrived — investigate",
        );
        return;
    }

    try {
        await cancelOrderExpiration(orderId);
    } catch (err) {
        logger.error({ err, orderId }, "Faild to cancel expiration job after payment success.");
    }
    logger.info({ orderId, intentId: intent.id }, "Order confirmed via successful payment.");
};

const handlePaymentFailed = async (intent: Stripe.PaymentIntent) => {
    const orderId = intent.metadata.orderId;

    if (!orderId) {
        logger.error({ intentId: intent.id }, "Payment intent failed but has no orderId metadata");
        return;
    }

    await markPaymentFailed(orderId);
    logger.info({ orderId, intentId: intent.id }, "Payment failed,order remains PENDING");
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

    //  await markPaymentRefunded(payment.orderId)

    logger.info(
        { orderId: payment.orderId, chargeId: charge.id },
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
            throw new AppError("Order not found.", 404);
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
