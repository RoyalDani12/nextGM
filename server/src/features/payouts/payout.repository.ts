import { prisma } from "../../config/db.js";

export const getShopWalletForPayout = async (shopId: string) => {
    return prisma.shopWallet.findUnique({
        where: { shopId },
    });
};

export const upsertShopWalletStripeAccount = async (shopId: string, stripeAccountId: string) => {
    return prisma.shopWallet.upsert({
        where: { shopId },
        update: { stripeAccountId },
        create: { shopId, stripeAccountId, balance: 0 },
    });
};

export const updateShopWalletPayoutsEnabled = async (stripeAccountId: string, payoutsEnabled: boolean) => {
    return prisma.shopWallet.update({
        where: { stripeAccountId },
        data: { payoutsEnabled },
    });
};

export const processPayoutWithDbTransaction = async (
    shopId: string,
    amount: number,
    note: string,
    executeStripeTransfer: () => Promise<string>
) => {
    return prisma.$transaction(async (tx) => {
        const wallet = await tx.shopWallet.findUnique({ where: { shopId } });

        if (!wallet) throw new Error("Wallet not found");
        if (Number(wallet.balance) < amount) throw new Error("Insufficient balance");

        const newBalance = Number(wallet.balance) - amount;

        // Perform the Stripe API call inside the transaction
        const stripeTransferId = await executeStripeTransfer();

        // Deduct wallet balance
        const updatedWallet = await tx.shopWallet.update({
            where: { shopId },
            data: { balance: newBalance },
        });

        // Record the payout transaction
        const transaction = await tx.walletTransaction.create({
            data: {
                shopId,
                type: "DEBIT",
                amount,
                balanceAfter: newBalance,
                note: `${note} (Transfer: ${stripeTransferId})`,
            },
        });

        return { wallet: updatedWallet, transaction };
    }, {
        timeout: 10000,
    });
};
