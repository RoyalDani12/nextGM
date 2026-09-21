import Stripe from "stripe";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/appError.js";
import { logger } from "../../config/logger.js";
import {
    getShopWalletForPayout,
    upsertShopWalletStripeAccount,
    updateShopWalletPayoutsEnabled,
    processPayoutWithDbTransaction,
} from "./payout.repository.js";
import { findShopById } from "../shop/shop.repository.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const getPayoutStatusService = async (shopId: string) => {
    const wallet = await getShopWalletForPayout(shopId);
    return {
        balance: wallet?.balance ?? 0,
        stripeAccountId: wallet?.stripeAccountId ?? null,
        payoutsEnabled: wallet?.payoutsEnabled ?? false,
    };
};

export const generateOnboardingLinkService = async (shopId: string, origin: string) => {
    let wallet = await getShopWalletForPayout(shopId);
    let accountId = wallet?.stripeAccountId;

    if (!accountId) {
        // Create a new Stripe Express account
        const account = await stripe.accounts.create({
            type: "express",
            capabilities: {
                transfers: { requested: true },
            },
        });
        accountId = account.id;
        wallet = await upsertShopWalletStripeAccount(shopId, accountId);
    }

    // Generate account onboarding link
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard/shop/${shopId}/payouts?refresh=true`,
        return_url: `${origin}/dashboard/shop/${shopId}/payouts?return=true`,
        type: "account_onboarding",
    });

    return { url: accountLink.url };
};

export const withdrawFundsService = async (shopId: string, amount: number) => {
    if (amount <= 0) {
        throw new AppError("Invalid withdrawal amount.", 400);
    }

    const wallet = await getShopWalletForPayout(shopId);
    if (!wallet) {
        throw new AppError("Wallet not found.", 404);
    }
    if (!wallet.stripeAccountId) {
        throw new AppError("Stripe account is not connected. Please complete onboarding.", 400);
    }
    if (!wallet.payoutsEnabled) {
        throw new AppError("Stripe onboarding is incomplete or payouts are not yet enabled.", 400);
    }
    if (Number(wallet.balance) < amount) {
        throw new AppError("Insufficient balance.", 400);
    }

    const amountInCents = Math.round(amount * 100);
    const stripeAccountId = wallet.stripeAccountId;

    const result = await processPayoutWithDbTransaction(shopId, amount, "Stripe Transfer", async () => {
        try {
            const transfer = await stripe.transfers.create({
                amount: amountInCents,
                currency: "usd",
                destination: stripeAccountId,
                description: `Payout for shop ${shopId}`,
            });
            return transfer.id;
        } catch (error: any) {
            logger.error({ err: error, shopId, amount }, "Stripe transfer failed");
            throw new AppError(error.message || "Stripe transfer failed.", 500);
        }
    });

    logger.info({ shopId, amount }, "Payout completed successfully");
    return result;
};

export const handleAccountUpdatedWebhook = async (account: Stripe.Account) => {
    const accountId = account.id;
    const isReady = account.payouts_enabled && account.details_submitted;
    try {
        await updateShopWalletPayoutsEnabled(accountId, isReady);
        logger.info({ accountId, isReady }, "Stripe account updated via webhook");
    } catch (err) {
        // If no wallet found with that stripeAccountId, log and skip
        logger.warn({ accountId }, "account.updated: no wallet found for this Stripe account");
    }
};
