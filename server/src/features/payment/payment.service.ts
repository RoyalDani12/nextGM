import Stripe from "stripe";
import crypto from "crypto";
import { AppError } from "../../middleware/appError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import {
    createPaymentRecord,
    findPaymentByOrderId,
    updatePaymentProvider,
} from "./payment.repository.js";
import { getCustomerOrderByIdRepository } from "../orders/order.repository.js";

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
