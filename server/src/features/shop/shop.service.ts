import { AppError } from "../../middleware/appError.js";
import { generateUniqueSlug } from "../../utils/generateSlug.js";
import {
    findShopByOwnerId,
    findShopBySlug,
    createShopRepository,
    findMyShopWithProfile,
    findShopById,
    updateShopProfileRepository,
    findActiveShopBySlug,
} from "./shop.repository.js";

export const createShopService = async (ownerId: string, name: string) => {
    const existingShop = await findShopByOwnerId(ownerId);
    if (existingShop) {
        throw new AppError("You already have a shop.", 409);
    }

    const slug = await generateUniqueSlug(name, async (candidateSlug) => {
        const existing = await findShopBySlug(candidateSlug);
        return existing !== null;
    });

    const shop = await createShopRepository(ownerId, slug, name);
    return {
        id: shop.id,
        slug: shop.slug,
        status: shop.status,
        createdAt: shop.createdAt,
    };
};

export const getMyShopService = async (ownerId: string) => {
    const shop = await findMyShopWithProfile(ownerId);

    if (!shop) {
        throw new AppError("You don't have a shop yet.", 404);
    }

    return {
        id: shop.id,
        slug: shop.slug,
        status: shop.status,
        createdAt: shop.createdAt,
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
              }
            : null,
    };
};

export const updateShopProfileService = async(
    userId:string,
    shopId:string,
    body:Record<string,unknown>
)=>{
      const shop = await findShopById(shopId)

      if (!shop){
        throw new AppError("Shop not found.",404)
      }

          if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403)
    }
        const hasUpdates = Object.values(body).some((v) => v !== undefined)
    if (!hasUpdates) {
        throw new AppError("No update data provided.", 400)
    }

    const updatedProfile = await updateShopProfileRepository(shopId, body)

     return {
        name:        updatedProfile.name,
        description: updatedProfile.description,
        logo:        updatedProfile.logo,
        banner:      updatedProfile.banner,
        phone:       updatedProfile.phone,
        email:       updatedProfile.email,
        address:     updatedProfile.address,
        city:        updatedProfile.city,
        country:     updatedProfile.country,
        website:     updatedProfile.website,
    }
}

export const getShopBySlugService= async(slug:string)=>{
    const shop = await findActiveShopBySlug(slug)

    if(!shop){
        throw  new AppError("Shop not found.",404)
    }

    return {
        slug:shop.slug,
        profile:shop.profile
    }
}