import { prisma } from "../../config/db.js";

export const findShopsByOwnerId = async (ownerId: string) => {
    return prisma.shop.findMany({
        where: { ownerId, deletedAt: null },
        include: { profile: true, legalInfo: true },
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
                wallet: {
                    create: {
                        balance: 0,
                        payoutsEnabled: false,
                    },
                },
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
        shippingPolicy: string;
        returnsPolicy: string;
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
            id: true,
            slug:true,
            owner: { select: { name: true } },
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
                    website:true,
                    address: true,
                    shippingPolicy: true,
                    returnsPolicy: true,
                }
            },
            _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
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
    data: {
        legalBusinessName?: string;
        taxId?: string;
        entityType?: string;
        ownerIdType?: string | null;
        ownerIdNumber?: string | null;
        ownerIdCardFront?: string | null;
        ownerIdCardBack?: string | null;
        ownerKycStatus?: any;
    },
) => {
    return prisma.shopLegalInfo.upsert({
        where: { shopId },
        create: {
            shopId,
            legalBusinessName: data.legalBusinessName || "Individual Business",
            taxId: data.taxId || "PENDING",
            entityType: data.entityType || "LLC",
            ownerIdType: data.ownerIdType,
            ownerIdNumber: data.ownerIdNumber,
            ownerIdCardFront: data.ownerIdCardFront,
            ownerIdCardBack: data.ownerIdCardBack,
            ownerKycStatus: data.ownerKycStatus || "UNVERIFIED",
        },
        update: {
            ...(data.legalBusinessName !== undefined && { legalBusinessName: data.legalBusinessName }),
            ...(data.taxId !== undefined && { taxId: data.taxId }),
            ...(data.entityType !== undefined && { entityType: data.entityType }),
            ...(data.ownerIdType !== undefined && { ownerIdType: data.ownerIdType }),
            ...(data.ownerIdNumber !== undefined && { ownerIdNumber: data.ownerIdNumber }),
            ...(data.ownerIdCardFront !== undefined && { ownerIdCardFront: data.ownerIdCardFront }),
            ...(data.ownerIdCardBack !== undefined && { ownerIdCardBack: data.ownerIdCardBack }),
            ...(data.ownerKycStatus !== undefined && { ownerKycStatus: data.ownerKycStatus }),
        },
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
