import { prisma } from "../../config/db.js";

export const findShopByOwnerId = async (ownerId: string) => {
    return prisma.shop.findFirst({
        where: {
            ownerId,
            deletedAt: null,
        },
    });
};

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
        return shop;
    });
};

export const findMyShopWithProfile = async (ownerId: string) => {
    return prisma.shop.findFirst({
        where: {
            ownerId,
            deletedAt: null,
        },
        include: {
            profile: true,
        },
    });
};

export const findShopById = async (shopId: string) => {
    return prisma.shop.findUnique({
        where: { id: shopId },
        select: {
            id: true,
            ownerId: true,
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
