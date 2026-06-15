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
            status:true,
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