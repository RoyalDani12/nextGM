import { prisma } from "../../config/db.js";

export const findShopsByOwnerId = async (ownerId: string) => {
    return prisma.shop.findMany({
        where: { ownerId, deletedAt: null },
        include: { profile: true },
        orderBy: { createdAt: "desc" },
    });
}

export const findShopBySlug = async (slug: string) => {
    return prisma.shop.findUnique({
        where: { slug },
    });
};

export const createShopRepository = async (ownerId: string, slug: string, name: string) => {
    return prisma.$transaction(async (tx) => {
        const shop = await tx.shop.create({
            data: {
                ownerId,
                slug,
                status: "PENDING",
            },
        });

        await tx.shopProfile.create({
            data: {
                shopId: shop.id,
                name,
            },
        });

        await tx.user.updateMany({
            where: { id:ownerId,role:"CUSTOMER"},
            data: { role:"SHOP_OWNER"}
        })
        return shop;
    });
};

/* export const findMyShopWithProfile = async (ownerId: string) => {
    return prisma.shop.findFirst({
        where: {
            ownerId,
            // deletedAt: null,
        },
        include: {
            profile: true,
        },
    });
}; */

export const findShopById = async (shopId: string) => {
    return prisma.shop.findUnique({
        where: { id: shopId },
        select: {
            id: true,
            ownerId: true,
            status:true,
            stripeConnectedAccountId:true
        },
    });
};

export const updateShopProfileRepository = async (
    shopId: string,
    data: Partial<{
        description: string;
        logo: string;
        banner: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        country: string;
        website: string;
    }>,
) => {
    return prisma.shopProfile.update({
        where: { shopId },
        data,
    });
};

export const findActiveShopBySlug=async(slug:string)=>{
    return prisma.shop.findFirst({
        where:{
            slug,
            deletedAt:null,
            status:"ACTIVE"
        },
        select:{
            slug:true,
            profile:{

                select:{
                    name:true,
                    description:true,
                    logo:true,
                    banner:true,
                    phone:true,
                    email:true,
                    city:true,
                    country:true,
                    website:true
                }
            }
        }
    })
}

export  const updateShopStatusRepository = async(
    shopId:string,
    newStatus:"ACTIVE" |"PAUSED"
)=>{
    return prisma.shop.update({
        where:{ id: shopId },
        data:{ status:newStatus },
        select:{
            id:true,
            status:true,
        }
    })
}
export const closeShopRepository = async (shopId: string) => {
    return prisma.$transaction(async (tx) => {

        
        await tx.shop.update({
            where: { id: shopId },
            data: {
                status:    "CLOSED",
                deletedAt: new Date(),
            }
        })

        await tx.product.updateMany({
            where: { shopId },
            data: { status: "ARCHIVED" }
        })
    })
}


export const upsertShopLegalInfo = async (
    shopId: string,
    data: { legalBusinessName: string; taxId: string; entityType: string },
) => {
    return prisma.shopLegalInfo.upsert({
        where: { shopId },
        create: { shopId, ...data },
        update: data,
    });
};

export const findShopLegalInfo = async (shopId: string) => {
    return prisma.shopLegalInfo.findUnique({ where: { shopId } });
};

export const findShopForPublishCheck = async (shopId: string) => {
    return prisma.shop.findUnique({
        where: { id: shopId },
        select: {
            id: true,
            ownerId: true,
            status: true,
            profile: {
                select: {
                    name: true,
                    description: true,
                    logo: true,
                    phone: true,
                    email: true,
                    address: true,
                    city: true,
                    country: true,
                },
            },

             legalInfo: {
                select: { id: true },
             },
            products: {
                where: { status: "ACTIVE", deletedAt: null },
                select: { id: true },
                take: 1, // only need to know if at least one exists
            },
        },
    });
};

export const publishShopRepository = async (shopId: string) => {
    
    return prisma.shop.updateMany({
        where: { id: shopId, status: "PENDING" },
        data: { status: "ACTIVE" },
    });
};


export const getShopWallet = async (shopId: string) => {
    return prisma.shopWallet.findUnique({ where: { shopId } });
};

export const getWalletTransactions = async (shopId: string) => {
    return prisma.walletTransaction.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
};

// shop.repository.ts — add
export const setStripeConnectedAccountId = async (shopId: string, accountId: string) => {
    return prisma.shop.update({ where: { id: shopId }, data: { stripeConnectedAccountId: accountId } });
};

export const markPayoutOnboardingComplete = async (shopId: string) => {
    return prisma.shop.update({ where: { id: shopId }, data: { payoutOnboardingComplete: true } });
};


export const getShopForPayout = async (shopId: string) => {
    return prisma.shop.findUnique({
        where: { id: shopId },
        select: {
            id: true,
            stripeConnectedAccountId: true,
            payoutOnboardingComplete: true,
        },
    });
};

export const debitWalletForPayout = async (shopId: string, amount: number) => {
    return prisma.$transaction(async (tx) => {
        // atomic guard — only debit if the wallet actually has enough balance,
        // same gte-guard shape as stock decrements. Prevents a double-click
        // payout request from draining the wallet below zero.
        const guard = await tx.shopWallet.updateMany({
            where: { shopId, balance: { gte: amount } },
            data: { balance: { decrement: amount } },
        });

        if (guard.count === 0) {
            return { success: false as const };
        }

        const wallet = await tx.shopWallet.findUnique({ where: { shopId } });

        await tx.walletTransaction.create({
            data: {
                shopId,
                type: "DEBIT",
                amount,
                balanceAfter: wallet!.balance,
                note: "Payout to connected Stripe account",
            },
        });

        return { success: true as const };
    });
};

// shop.repository.ts — add
export const creditWalletBack = async (shopId: string, amount: number, note: string) => {
    return prisma.$transaction(async (tx) => {
        const wallet = await tx.shopWallet.update({
            where: { shopId },
            data: { balance: { increment: amount } },
        });

        await tx.walletTransaction.create({
            data: {
                shopId,
                type: "CREDIT",
                amount,
                balanceAfter: wallet.balance,
                note,
            },
        });

        return wallet;
    });
};