import Stripe from "stripe";
import crypto from "crypto";
import { AppError } from "../../middleware/appError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import {
    confirmPaymentAndOrder,
    createPaymentRecord,
    findPaymentByOrderId,
    insertWebhookEventOnce,
    markPaymentFaild,
    updatePaymentProvider,
} from "./payment.repository.js";
import { getCustomerOrderByIdRepository } from "../orders/order.repository.js";
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

export const handleStripeWebhookEvent = async (event:Stripe.Event)=>{
     const isNewEvent = await insertWebhookEventOnce(event.id,event.type)

     if(!isNewEvent){
        logger.info({ eventId:event.id },"Duplicate webhook event,skipping")
        return
     }

     switch (event.type){
        case "payment_intent.succeeded":
            await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
            break
        case "payment_intent.payment_failed":
            await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        default:
            logger.info({ type :event.type },"Unhandled stripe type")
     }
    }

    const handlePaymentSucceeded = async(intent:Stripe.PaymentIntent)=>{
        const orderId = intent.metadata.orderId

        if(!orderId){
            logger.error({ intentId:intent.id }," PaymentIntent succeeded but has no orderId metadata")
            return 
        }

        const result = await confirmPaymentAndOrder(orderId)

        if(result.alreadyProcessed){
            logger.info({ orderId },"Payment already processed,skipping.")
            return
        }

        try {
            await cancelOrderExpiration(orderId)
        } catch (err) {
            logger.error({ err,orderId },"Faild to cancel expiration job after payment success.")
        }
        logger.info({ orderId,intentId:intent.id },"Order confirmed via successful payment.")
     }

    const handlePaymentFailed = async (intent:Stripe.PaymentIntent)=>{
        const orderId = intent.metadata.orderId

        if(!orderId){
            logger.error({ intentId:intent.id },"Payment intent failed but has no orderId metadata")
            return
        }

        await markPaymentFaild(orderId)
        logger.info ({ orderId,intentId:intent.id },"Payment failed,order remains PENDING")
     }

