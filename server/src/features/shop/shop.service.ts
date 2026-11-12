import { AppError } from "../../middleware/appError.js";
import { generateUniqueSlug } from "../../utils/generateSlug.js";
import {
    findShopsByOwnerId,
    findShopBySlug,
    createShopRepository,
    findShopById,
    updateShopProfileRepository,
    findActiveShopBySlug,
    updateShopStatusRepository,
    closeShopRepository,
    upsertShopLegalInfo,
    findShopForPublishCheck,
    publishShopRepository,
    getShopWallet,
    getWalletTransactions
} from "./shop.repository.js";
import { deleteUserSession } from "../../infrastructure/cache/session.cache.js";
import { generateAccessToken } from "../auth/token.service.js";
import { findUserById } from "../auth/auth.repository.js";

export const createShopService = async (ownerId: string, name: string) => {
    // const existingShop = await findShopByOwnerId(ownerId);

    const slug = await generateUniqueSlug(name, async (candidateSlug) => {
        const existing = await findShopBySlug(candidateSlug);
        return existing !== null;
    });

    const shop = await createShopRepository(ownerId, slug, name);

    await deleteUserSession(ownerId);
    const updatedUser = await findUserById(ownerId);
    const accessToken = generateAccessToken(ownerId, updatedUser?.role || "SHOP_OWNER");

    return {
        id: shop.id,
        slug: shop.slug,
        status: shop.status,
        createdAt: shop.createdAt,
        profile: {
            name,
            description: null,
            logoUrl: null,
            bannerUrl: null,
        },
        user: updatedUser
            ? {
                  id: updatedUser.id,
                  name: updatedUser.name,
                  email: updatedUser.email,
                  role: updatedUser.role,
              }
            : undefined,
        accessToken,
    };
};

export const getMyShopsService = async (ownerId: string) => {
    const shops = await findShopsByOwnerId(ownerId);

    return shops.map((shop) => ({
        id: shop.id,
        slug: shop.slug,
        status: shop.status,
        createdAt: shop.createdAt,
        rejectionReason: shop.rejectionReason,
        rejectionNotes: shop.rejectionNotes,
        profile: shop.profile
            ? {
                  name: shop.profile.name,
                  description: shop.profile.description,
                  logo: shop.profile.logo,
                  banner: shop.profile.banner,
                  phone: shop.profile.phone,
                  email: shop.profile.email,
                  address: shop.profile.address,
                  city: shop.profile.city,
                  country: shop.profile.country,
                  website: shop.profile.website,
                  shippingPolicy: shop.profile.shippingPolicy,
                  returnsPolicy: shop.profile.returnsPolicy,
              }
            : null,
    }));
};

export const updateShopProfileService = async (
    userId: string,
    shopId: string,
    body: Record<string, unknown>,
) => {
    const shop = await findShopById(shopId);

    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }

    if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }
    const hasUpdates = Object.values(body).some((v) => v !== undefined);
    if (!hasUpdates) {
        throw new AppError("No update data provided.", 400);
    }

    const updatedProfile = await updateShopProfileRepository(shopId, body);

    return {
        name: updatedProfile.name,
        description: updatedProfile.description,
        logo: updatedProfile.logo,
        banner: updatedProfile.banner,
        phone: updatedProfile.phone,
        email: updatedProfile.email,
        address: updatedProfile.address,
        city: updatedProfile.city,
        country: updatedProfile.country,
        website: updatedProfile.website,
        shippingPolicy: updatedProfile.shippingPolicy,
        returnsPolicy: updatedProfile.returnsPolicy,
    };
};

export const getShopBySlugService = async (slug: string) => {
    const shop = await findActiveShopBySlug(slug);

    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }

    return {
        slug: shop.slug,
        id: shop.id,
        owner: { name: shop.owner.name },
        productCount: shop._count.products,
        profile: shop.profile,
    };
};

// state transition map — defines what owner can change FROM and TO
const ALLOWED_OWNER_TRANSITIONS: Record<string, string[]> = {
    ACTIVE: ["PAUSED"],
    PAUSED: ["ACTIVE"],
    PENDING: [],
    SUSPENDED: [],
    CLOSED: [],
};
export const updateShopStatusService = async (
    userId: string,
    shopId: string,
    newStatus: "ACTIVE" | "PAUSED",
) => {
    const shop = await findShopById(shopId);

    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }
    if (shop.ownerId !== userId) {
        throw new AppError("You don't own this shop.", 403);
    }
    if (shop.status == newStatus) {
        throw new AppError(`Shop  is already ${newStatus}.`, 400);
    }

    const allowedNext = ALLOWED_OWNER_TRANSITIONS[shop.status] ?? [];

    if (!allowedNext.includes(newStatus)) {
        throw new AppError(`Cannot change status from ${shop.status} to ${newStatus}.`, 400);
    }

    const update = await updateShopStatusRepository(shopId, newStatus);

    return {
        status: update.status,
    };
};


export const closeShopService = async (userId: string, shopId: string) => {

    const shop = await findShopById(shopId)

    if (!shop) {
        throw new AppError("Shop not found.", 404)
    }

    if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403)
    }

    
    if (shop.status === "CLOSED") {
        throw new AppError("Shop is already closed.", 400)
    }


    await closeShopRepository(shopId)

    return {
        message: "Shop closed successfully."
    }
}


export const updateShopLegalInfoService = async (
    shopId: string,
    data: {
        legalBusinessName?: string;
        taxId?: string;
        entityType?: string;
        ownerIdType?: string | null;
        ownerIdNumber?: string | null;
        ownerIdCardFront?: string | null;
        ownerIdCardBack?: string | null;
        submitForVerification?: boolean;
    },
) => {
    const shop = await findShopById(shopId);

    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }

    const updatePayload: any = { ...data };
    delete updatePayload.submitForVerification;

    // If seller submits for KYC verification or provides both front and back ID cards
    if (data.submitForVerification || (data.ownerIdCardFront && data.ownerIdCardBack)) {
        updatePayload.ownerKycStatus = "PENDING";
    }

    return upsertShopLegalInfo(shopId, updatePayload);
};


// shop.service.ts
const evaluatePublishReadiness = (shop: NonNullable<Awaited<ReturnType<typeof findShopForPublishCheck>>>) => {
    const checks = {
        hasProfile: !!shop.profile,
        hasName: !!shop.profile?.name,
        hasDescription: !!shop.profile?.description,
        hasLogo: !!shop.profile?.logo,
        hasContactInfo: !!(shop.profile?.email || shop.profile?.phone),
        hasAddress: !!(shop.profile?.address && shop.profile?.city && shop.profile?.country),
        hasLegalInfo: !!shop.legalInfo,
        hasAtLeastOneActiveProduct: shop.products.length > 0,
    };

    return {
        passed: Object.values(checks).every(Boolean),
        checks,
    };
};

export const getPublishReadinessService = async (shopId: string) => {
    const shop = await findShopForPublishCheck(shopId);

    if (!shop) throw new AppError("Shop not found.", 404);
   

    return {
        shopStatus: shop.status,
        ...evaluatePublishReadiness(shop),
    };
};

export const publishShopService = async ( shopId: string) => {
    const shop = await findShopForPublishCheck(shopId);

    if (!shop) throw new AppError("Shop not found.", 404);
  
    if (shop.status !== "PENDING") {
        throw new AppError(`Cannot publish — shop status is ${shop.status}, expected PENDING.`, 400);
    }

    const readiness = evaluatePublishReadiness(shop);

    if (!readiness.passed) {
        throw new AppError("Shop is not ready to publish. Complete the required setup first.", 400);
    }

    const guard = await publishShopRepository(shopId);

    if (guard.count === 0) {
        throw new AppError("Shop status changed before publish could complete.", 409);
    }

    return { status: "ACTIVE" };
};


// shop.service.ts
export const getShopWalletService = async (shopId: string) => {
    const shop = await findShopById(shopId);

    if (!shop) throw new AppError("Shop not found.", 404);
  

    const [wallet, transactions] = await Promise.all([
        getShopWallet(shopId),
        getWalletTransactions(shopId),
    ]);

    return {
        balance: wallet?.balance ?? 0,
        transactions,
    };
};
