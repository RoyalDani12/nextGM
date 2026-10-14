import { prisma } from "../../config/db.js";
import {
    CreateProductData,
    GetShopProductsOptions,
    BrowseProductsOptions,
} from "./product.types.js";

export const findCategoryById = async (categoryId: string) => {
    return prisma.productCategory.findUnique({
        where: { id: categoryId },
        select: {
            id: true,
            shopId: true,
        },
    });
};

export const findPlatformCategoryById = async (categoryId: string) =>
    prisma.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } });

// slug uniqueness — scoped PER SHOP (matches @@unique([shopId, slug]))
export const findProductBySlugInShop = async (shopId: string, slug: string) => {
    return prisma.product.findUnique({
        where: {
            shopId_slug: { shopId, slug },
        },
    });
};

// sku uniqueness — scoped PER SHOP
export const findProductBySkuInShop = async (shopId: string, sku: string) => {
    return prisma.product.findFirst({
        where: { shopId, sku },
    });
};

export const createProductRepository = async (data: CreateProductData) => {
    return prisma.product.create({
        data: {
            shopId: data.shopId,
            categoryId: data.categoryId,
            platformCategoryId: data.platformCategoryId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            sku: data.sku,
            basePrice: data.basePrice,
            stock: data.stock,
            type: data.type,
            status: "DRAFT",
            ...(data.images && data.images.length > 0 && {
                images: {
                    create: data.images.map((img, idx) => ({
                        url: img.url,
                        isPrimary: Boolean(img.isPrimary ?? (idx === 0)),
                    })),
                },
            }),
        },
        include: {
            images: {
                select: { id: true, url: true, isPrimary: true },
                orderBy: { isPrimary: "desc" },
            },
        },
    });
};

export const getShopProductsRepository = async (options: GetShopProductsOptions) => {
    const { shopId, status, skip, take, sort, order } = options;

    const where = {
        shopId,
        deletedAt: null,
        ...(status && { status }),
    };

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                sku: true,
                basePrice: true,
                stock: true,
                type: true,
                status: true,
                categoryId: true,
                platformCategoryId: true,
                platformCategory: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
                createdAt: true,
                images: {
                    select: { id: true, url: true, isPrimary: true },
                    orderBy: { isPrimary: "desc" },
                },
                variants: {
                    select: { id: true, name: true, price: true, stock: true, sku: true },
                },
            },
            orderBy: { [sort]: order },
            skip,
            take,
        }),
        prisma.product.count({ where }),
    ]);
    return { products, total };
};

export const findProductById = async (productId: string) => {
    return prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            shopId: true,
            name: true,
            slug: true,
            description: true,
            basePrice: true,
            stock: true,
            type: true,
            categoryId: true,
            platformCategoryId: true,
            sku: true,
            status: true,
            deletedAt: true,
            images: {
                select: { id: true, url: true, isPrimary: true },
                orderBy: { isPrimary: "desc" },
            },
            variants: {
                select: { id: true, name: true, price: true, stock: true, sku: true },
            },
        },
    });
};

export const updateProductRepository = async (
    productId: string,
    data: Partial<{
        name: string;
        slug: string;
        description: string;
        basePrice: string;
        stock: number;
        categoryId: string | null;
        platformCategoryId: string | null;
        sku: string;
    }>,
    images?: { url: string; isPrimary: boolean }[],
) => {
    return prisma.$transaction(async (tx) => {
        if (images !== undefined) {
            await tx.productImage.deleteMany({
                where: { productId },
            });
            if (images.length > 0) {
                await tx.productImage.createMany({
                    data: images.map((img, idx) => ({
                        productId,
                        url: img.url,
                        isPrimary: Boolean(img.isPrimary ?? (idx === 0)),
                    })),
                });
            }
        }

        return tx.product.update({
            where: { id: productId },
            data,
            include: {
                images: {
                    select: { id: true, url: true, isPrimary: true },
                    orderBy: { isPrimary: "desc" },
                },
            },
        });
    });
};

export const updateProductStatusRepository = async (
    productId: string,
    status: "ACTIVE" | "ARCHIVED",
) => {
    return prisma.product.update({
        where: { id: productId },
        data: { status },
        select: {
            id: true,
            status: true,
        },
    });
};

export const softDeleteProductRepository = async (productId: string) => {
    return prisma.product.update({
        where: { id: productId },
        data: {
            deletedAt: new Date(),
            status: "ARCHIVED",
        },
        select: { id: true },
    });
};

export const findPublicProductById = async (productId: string) => {
    return prisma.product.findFirst({
        where: {
            id: productId,
            status: "ACTIVE",
            deletedAt: null,
            shop: {
                status: "ACTIVE", // ← parent shop must also be ACTIVE
                deletedAt: null,
            },
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            basePrice: true,
            stock: true,
            type: true,
            status: true,
            createdAt: true,
            shop: {
                select: {
                    slug: true,
                    profile: {
                        select: {
                            name: true,
                            logo: true,
                        },
                    },
                },
            },
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            platformCategory: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
            images: {
                select: {
                    id: true,
                    url: true,
                    isPrimary: true,
                },
                orderBy: { isPrimary: "desc" },
            },
            variants: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    stock: true,
                    sku: true,
                },
            },
        },
    });
};

export const browseProductRepository = async (options: BrowseProductsOptions) => {
    const { skip, take, sort, order, shopId, categoryId, categorySlug, type, minPrice, maxPrice, search, inStockOnly, minRating, verifiedShopsOnly } =
        options;

    let platformCategoryIds: string[] | undefined;
    let categoryBreadcrumb: { id: string; name: string; slug: string }[] = [];
    if (categoryId || categorySlug) {
        const selected = await prisma.category.findFirst({ where: { isActive: true, ...(categoryId ? { id: categoryId } : { slug: categorySlug }) }, select: { id: true, name: true, slug: true, parentId: true } });
        if (selected) {
            const categories = await prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true, parentId: true } });
            const descendantIds = new Set([selected.id]);
            let changed = true;
            while (changed) { changed = false; for (const category of categories) if (category.parentId && descendantIds.has(category.parentId) && !descendantIds.has(category.id)) { descendantIds.add(category.id); changed = true; } }
            platformCategoryIds = [...descendantIds];
            const byId = new Map(categories.map((category) => [category.id, category]));
            let current: typeof selected | undefined = selected;
            while (current) { categoryBreadcrumb.unshift({ id: current.id, name: current.name, slug: current.slug }); current = current.parentId ? byId.get(current.parentId) as typeof selected | undefined : undefined; }
        } else platformCategoryIds = [];
    }

    const where: any = {
        status: "ACTIVE",
        deletedAt: null,
        shop: {
            status: "ACTIVE",
            deletedAt: null,
            ...(verifiedShopsOnly && { legalInfo: { isNot: null } }),
        },
        ...(shopId && { shopId }),
        ...(platformCategoryIds && { platformCategoryId: { in: platformCategoryIds } }),
        ...(type && { type }),
        ...(inStockOnly && { stock: { gt: 0 } }),
        ...(minPrice || maxPrice
            ? {
                  basePrice: {
                      ...(minPrice && { gte: minPrice }),
                      ...(maxPrice && { lte: maxPrice }),
                  },
              }
            : {}),
        ...(search && {
            name: {
                contains: search,
                mode: "insensitive",
            },
        }),
    };

    const productsWithRatings = await prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                type: true,
                shop: {
                    select: {
                        slug: true,
                        profile: {
                            select: { name: true, logo: true },
                        },
                    },
                },
                images: {
                    select: { id: true, url: true, isPrimary: true },
                    orderBy: { isPrimary: "desc" },
                    take: 2,
                },
                category: {
                    select: { name: true, slug: true },
                },
                platformCategory: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
                reviews: { where: { isVisible: true }, select: { rating: true } },
            },
            orderBy: sort === "rating" ? { createdAt: "desc" } : { [sort]: order },
        });
    const ratedProducts = productsWithRatings.map(({ reviews, ...product }) => {
        const reviewCount = reviews.length;
        const averageRating = reviewCount ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0;
        return { ...product, averageRating: Number(averageRating.toFixed(1)), reviewCount };
    }).filter((product) => !minRating || product.averageRating >= minRating);
    if (sort === "rating") ratedProducts.sort((a, b) => order === "asc" ? a.averageRating - b.averageRating : b.averageRating - a.averageRating);
    return { products: ratedProducts.slice(skip, skip + take), total: ratedProducts.length, categoryBreadcrumb };
};

export const findProductWithShop = async (productId: string) => {
    return prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            shopId: true,
            deletedAt: true,
            shop: {
                select: {
                    ownerId: true,
                    status: true,
                },
            },
        },
    });
};
export const addProductImageRepository = async (
    productId: string,
    url: string,
    isPrimary: boolean,
) => {
    return prisma.$transaction(async (tx) => {
        if (isPrimary) {
            await tx.productImage.updateMany({
                where: { productId, isPrimary: true },
                data: { isPrimary: false },
            });
        }

        return tx.productImage.create({
            data: {
                productId,
                url,
                isPrimary,
            },
        });
    });
};

export const getProductImagesRepository = async (productId: string) => {
    return prisma.productImage.findMany({
        where: { productId },
        select: {
            id: true,
            url: true,
            isPrimary: true,
            createdAt: true,
        },
        orderBy: { isPrimary: "desc" },
    });
};

export const createVariantRepository = async (
    productId: string,
    data: {
        name: string;
        price: string;
        stock: number;
        sku?: string;
    },
) => {
    return prisma.productVariant.create({
        data: {
            productId,
            name: data.name,
            price: data.price,
            stock: data.stock,
            sku: data.sku,
        },
        select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            sku: true,
            createdAt: true,
        },
    });
};

export const findVariantByIdForOwner = async (variantId: string, productId: string) => {
    return prisma.productVariant.findFirst({
        where: { id: variantId, productId },
        select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            sku: true,
        },
    });
};

export const findProductSkuVariants = async (productId: string, sku: string) => {
    return prisma.productVariant.findFirst({
        where: { productId, sku },
        select: { id: true },
    });
};

export const updateVariantRepository = async (
    variantId: string,
    data: Partial<{
        name: string;
        price: string;
        stock: number;
        sku: string;
    }>,
) => {
    return prisma.productVariant.update({
        where: { id: variantId },
        data,
        select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            sku: true,
        },
    });
};

export const deleteVariantRepository = async (variantId: string) => {
    return prisma.productVariant.delete({
        where: { id: variantId },
    });
};
