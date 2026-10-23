import { AppError } from "../../middleware/appError.js";
import { generateUniqueSlug } from "../../utils/generateSlug.js";
import { findShopById } from "../shop/shop.repository.js";
import {
    findCategoryById,
    findPlatformCategoryById,
    findProductBySkuInShop,
    createProductRepository,
    findProductBySlugInShop,
    getShopProductsRepository,
    findProductById,
    updateProductRepository,
    updateProductStatusRepository,
    softDeleteProductRepository,
    findPublicProductById,
    listPromotedProductsRepository,
    browseProductRepository,
    getProductImagesRepository,
    addProductImageRepository,
    findProductSkuVariants,
    createVariantRepository,
    findVariantByIdForOwner,
    updateVariantRepository,
    deleteVariantRepository,
} from "./product.repository.js";
import {
    CreateProductData,
    GetShopProductsQuery,
    UpdateProductInput,
    BrowseProductsQuery,
} from "./product.types.js";

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
    if (body.platformCategoryId && !(await findPlatformCategoryById(body.platformCategoryId))) throw new AppError("Invalid platform category.", 400);

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

    const normalizedImages = (body.images || []).map((img: any, idx: number) => {
        if (typeof img === "string") {
            return { url: img, isPrimary: idx === 0 };
        }
        return { url: img.url, isPrimary: Boolean(img.isPrimary ?? (idx === 0)) };
    });

    if (normalizedImages.length > 0 && !normalizedImages.some((img) => img.isPrimary)) {
        if (normalizedImages[0]) {
            normalizedImages[0].isPrimary = true;
        }
    }

    const product = await createProductRepository({
        shopId,
        categoryId: body.categoryId ?? null,
        platformCategoryId: body.platformCategoryId ?? null,
        name: body.name,
        slug,
        description: body.description,
        sku: body.sku,
        basePrice: body.basePrice,
        stock: body.stock,
        type: body.type ?? "PHYSICAL",
        images: normalizedImages,
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
        platformCategoryId: product.platformCategoryId,
        images: product.images,
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

export const updateProductService = async (
    userId: string,
    shopId: string,
    productId: string,
    body: UpdateProductInput,
) => {
    const product = await findProductById(productId);
    if (!product || product.shopId !== shopId || product.deletedAt) {
        throw new AppError("Product not found.", 404);
    }

    const shop = await findShopById(shopId);
    if (!shop) {
        throw new AppError("Shop is not found.", 404);
    }
    if (shop.ownerId !== userId) {
        throw new AppError("You don't own the shop.", 403);
    }

    const hasUpdates = Object.values(body).some((v) => v !== undefined);
    if (!hasUpdates) {
        throw new AppError("No update data provided.", 400);
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined && body.name !== product.name) {
        updateData.name = body.name;
        updateData.slug = await generateUniqueSlug(body.name, async (candidateSlug) => {
            const existing = await findProductBySkuInShop(shopId, candidateSlug);
            return existing !== null && existing.id !== productId;
        });
    }

    if (body.categoryId !== undefined) {
        const category = await findCategoryById(body.categoryId);
        if (!category || category.shopId !== shopId) {
            throw new AppError("Invalid category.", 400);
        }
        updateData.categoryId = body.categoryId;
    }
    if (body.platformCategoryId !== undefined) {
        if (body.platformCategoryId && !(await findPlatformCategoryById(body.platformCategoryId))) throw new AppError("Invalid platform category.", 400);
        updateData.platformCategoryId = body.platformCategoryId;
    }

    if (body.sku !== undefined) {
        const existingSku = await findProductBySkuInShop(shopId, body.sku);
        if (existingSku && existingSku.id !== productId) {
            throw new AppError("SKU is already in use in this shop", 409);
        }
        updateData.sku = body.sku;
    }

    if (body.description !== undefined) updateData.description = body.description;
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;
    if (body.stock !== undefined) updateData.stock = body.stock;

    let normalizedImages: { url: string; isPrimary: boolean }[] | undefined = undefined;
    if (body.images !== undefined) {
        normalizedImages = body.images.map((img: any, idx: number) => {
            if (typeof img === "string") {
                return { url: img, isPrimary: idx === 0 };
            }
            return { url: img.url, isPrimary: Boolean(img.isPrimary ?? (idx === 0)) };
        });

        if (normalizedImages.length > 0 && !normalizedImages.some((img) => img.isPrimary)) {
            if (normalizedImages[0]) {
                normalizedImages[0].isPrimary = true;
            }
        }
    }

    const updated = await updateProductRepository(productId, updateData, normalizedImages);

    return {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        sku: updated.sku,
        basePrice: updated.basePrice,
        stock: updated.stock,
        categoryId: updated.categoryId,
        platformCategoryId: updated.platformCategoryId,
        status: updated.status,
        images: updated.images,
    };
};

const ALLOWED_PRODUCT_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ["ACTIVE", "ARCHIVED"],
    ACTIVE: ["ARCHIVED"],
    ARCHIVED: ["ACTIVE"],
};

export const updateProductStatusService = async (
    userId: string,
    shopId: string,
    productId: string,
    newStatus: "ACTIVE" | "ARCHIVED",
) => {
    const product = await findProductById(productId);
    if (!product || product.shopId !== shopId || product.deletedAt) {
        throw new AppError("Product not found.", 404);
    }

    const shop = await findShopById(shopId);
    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }
    if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }
    if (product.status === newStatus) {
        throw new AppError(`Product is already ${newStatus}.`, 400);
    }

    const allowedNext = ALLOWED_PRODUCT_TRANSITIONS[product.status] ?? [];

    if (!allowedNext.includes(newStatus)) {
        throw new AppError(`Cannot change status from ${product.status} to ${newStatus}.`, 400);
    }

    const updated = await updateProductStatusRepository(productId, newStatus);

    return {
        id: updated.id,
        status: updated.status,
    };
};

export const deleteProductService = async (userId: string, shopId: string, productId: string) => {
    const product = await findProductById(productId);

    if (!product || product.shopId !== shopId || product.deletedAt) {
        throw new AppError("Product not found.", 404);
    }

    const shop = await findShopById(shopId);
    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }

    if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }
    await softDeleteProductRepository(productId);

    return {
        message: "Product deleted successfully.",
    };
};

export const getPublicProductService = async (productId: string) => {
    const product = await findPublicProductById(productId);

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    return product;
};

export const getPromotedProductsService = () => listPromotedProductsRepository();

export const browseProductsService = async (query: BrowseProductsQuery) => {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 20);
    const skip = (page - 1) * limit;
    const sort = query.sort ?? "createdAt";
    const order = query.order ?? "desc";

    const { products, total, categoryBreadcrumb } = await browseProductRepository({
        skip,
        take: limit,
        sort,
        order,
        shopId: query.shopId,
        categoryId: query.categoryId,
        categorySlug: query.categorySlug,
        type: query.type,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStockOnly: query.inStockOnly,
        minRating: query.minRating,
        verifiedShopsOnly: query.verifiedShopsOnly,
        search: query.search,
    });

    const totalPages = Math.ceil(total / limit);

    return {
        products,
        categoryBreadcrumb,
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

export const addProductImageService = async (
    userId: string,
    shopId: string,
    productId: string,
    body: {
        url: string;
        isPrimary: boolean;
    },
) => {
    const product = await findProductById(productId);
    if (!product || product.shopId !== shopId || product.deletedAt) {
        throw new AppError("Product not found.", 404);
    }
    const shop = await findShopById(shopId);
    if (!shop) {
        throw new AppError("Shop not found.", 404);
    }

    if (shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }

    const existingImages = await getProductImagesRepository(productId);

    if (existingImages.length >= 10) {
        throw new AppError("Product cannot have more than 10 images.", 400);
    }
    const isPrimary =
        existingImages.length === 0
            ? true // ← first image is always primary
            : body.isPrimary;
    const image = await addProductImageRepository(productId, body.url, isPrimary);

    return {
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
        createdAt: image.createdAt,
    };
};

export const createVaraintService = async (
    userId: string,
    shopId: string,
    productId: string,
    body: {
        name: string;
        price: string;
        stock: number;
        sku?: string;
    },
) => {
    const product = await findProductById(productId);

    if (!product || product.shopId !== shopId || product.deletedAt) {
        throw new AppError("Product not found.", 404);
    }

    const shop = await findShopById(shopId);

    if (!shop || shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }

    // Step 3 — SKU uniqueness within product
    if (body.sku) {
        const existing = await findProductSkuVariants(productId, body.sku);
        if (existing) {
            throw new AppError("SKU already exists for this product.", 409);
        }
    }

    return await createVariantRepository(productId, body);
};

export const updateVariantService = async (
    userId: string,
    shopId: string,
    productId: string,
    variantId: string,
    body: {
        name?: string;
        price?: string;
        stock?: number;
        sku?: string;
    },
) => {
    const product = await findProductById(productId);

    if (!product || product.shopId !== shopId || product.deletedAt) {
        throw new AppError("Product not found.", 404);
    }

    const shop = await findShopById(shopId);
    if (!shop || shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }

    const variant = await findVariantByIdForOwner(variantId, productId);
    if (!variant) {
        throw new AppError("Variant not found.", 404);
    }

    //  — empty body check
    const hasUpdates = Object.values(body).some((v) => v !== undefined);
    if (!hasUpdates) {
        throw new AppError("No update data provided.", 400);
    }

    //   SKU uniqueness (excluding self)
    if (body.sku) {
        const existing = await findProductSkuVariants(productId, body.sku);
        if (existing && existing.id !== variantId) {
            throw new AppError("SKU already exists for this product.", 409);
        }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.sku !== undefined) updateData.sku = body.sku;

    return updateVariantRepository(variantId, updateData);
};

export const deleteVariantService = async (
    userId: string,
    shopId: string,
    productId: string,
    variantId: string,
) => {
    const product = await findProductById(productId);
    if (!product || product.shopId !== shopId || product.deletedAt) {
        throw new AppError("Product not found.", 404);
    }

    const shop = await findShopById(shopId);
    if (!shop || shop.ownerId !== userId) {
        throw new AppError("You do not own this shop.", 403);
    }

    // verify variant belongs to a product

    const variant = await findVariantByIdForOwner(variantId, productId);

    if (!variant) {
        throw new AppError("Varaint not found.", 404);
    }

    await deleteVariantRepository(variantId);

    return {
        message: "Variant deleted successfully",
    };
};
