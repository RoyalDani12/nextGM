import { AppError } from "../../middleware/appError.js";
import { generateUniqueSlug } from "../../utils/generateSlug.js";
import { findShopById } from "../shop/shop.repository.js";
import {
    findCategoryById,
    findProductBySkuInShop,
    createProductRepository,
    findProductBySlugInShop,
    getShopProductsRepository,
} from "./product.repository.js";
import { CreateProductData, GetShopProductsQuery } from "./product.types.js";

export const createProductService = async (
    userId: string,
    shopId: string,
    body: CreateProductData,
) => {
    const shop = await findShopById(shopId);
    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }

    if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }

    if (shop.status === "PAUSED" || shop.status === "SUSPENDED" || shop.status === "CLOSED") {
        throw new AppError(`Cannot add products to a ${shop.status.toLowerCase()} shop.`, 400);
    }

    if (body.categoryId) {
        const category = await findCategoryById(body.categoryId);
        if (!category || category.shopId !== shopId) {
            throw new AppError("Invalid category.", 400);
        }
    }

    const slug = await generateUniqueSlug(body.name, async (candidateSlug) => {
        const existing = await findProductBySlugInShop(shopId, candidateSlug);
        return existing !== null;
    });

    if (body.sku) {
        const existingSku = await findProductBySkuInShop(shopId, body.sku);
        if (existingSku) {
            throw new AppError("SKU is already in use in this shop.", 409);
        }
    }

    const product = await createProductRepository({
        shopId,
        categoryId: body.categoryId ?? null,
        name: body.name,
        slug,
        description: body.description,
        sku: body.sku,
        basePrice: body.basePrice,
        stock: body.stock,
        type: body.type ?? "PHYSICAL",
    });

    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        basePrice: product.basePrice,
        stock: product.stock,
        type: product.type,
        status: product.status,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
    };
};

export const getShopProductsService = async (
    userId: string,
    shopId: string,
    query: GetShopProductsQuery,
) => {
    const shop = await findShopById(shopId);
    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }

    if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 20);
    const skip = (page - 1) * limit;
    const sort = query.sort ?? "createdAt";
    const order = query.order ?? "desc";

    const { products, total } = await getShopProductsRepository({
        shopId,
        status: query.status,
        skip,
        take: limit,
        sort,
        order,
    });

    const totalPages = Math.ceil(total / limit);

    return {
        products,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};
