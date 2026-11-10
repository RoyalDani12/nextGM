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
    const { shopId, status, stockFilter, skip, take, sort, order } = options;

    const where = {
        shopId,
        deletedAt: null,
        ...(status && { status }),
        ...(stockFilter === "IN_STOCK" && { stock: { gt: 0 } }),
        ...(stockFilter === "LOW_STOCK" && { stock: { gt: 0, lte: 5 } }),
        ...(stockFilter === "OUT_OF_STOCK" && { stock: 0 }),
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
    const product = await prisma.product.findFirst({
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
            shopId: true,
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
                    id: true,
                    slug: true,
                    profile: {
                        select: {
                            name: true,
                            logo: true,
                        },
                    },
                    coupons: {
                        where: {
                            isActive: true,
                            products: { none: {} },
                            type: { in: ["PERCENTAGE", "FIXED_AMOUNT"] },
                            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                        },
                        select: { code: true, type: true, value: true, minOrderAmount: true, expiresAt: true },
                        take: 1,
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
            coupons: {
                where: { coupon: { isActive: true, type: { in: ["PERCENTAGE", "FIXED_AMOUNT"] }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } },
                select: { coupon: { select: { code: true, type: true, value: true, minOrderAmount: true, expiresAt: true } } },
                take: 1,
            },
        },
    });

    if (!product) return null;

    const directPromo = product.coupons?.[0]?.coupon;
    const shopPromo = (product as any).shop?.coupons?.[0];
    const promotion = directPromo || shopPromo || null;

    return {
        ...product,
        promotion,
    };
};

export const listPromotedProductsRepository = async () => {
    const now = new Date();

    // 1. Products with specifically targeted coupons
    const targeted = await prisma.couponProduct.findMany({
        where: {
            coupon: { isActive: true, type: { in: ["PERCENTAGE", "FIXED_AMOUNT"] }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            product: { status: "ACTIVE", deletedAt: null, stock: { gt: 0 }, shop: { status: "ACTIVE", deletedAt: null } },
        },
        select: {
            coupon: { select: { id: true, code: true, type: true, value: true, minOrderAmount: true, expiresAt: true } },
            product: { select: { id: true, name: true, slug: true, basePrice: true, shop: { select: { slug: true, profile: { select: { name: true } } } }, images: { take: 1, orderBy: { isPrimary: "desc" }, select: { url: true } } } },
        },
        orderBy: { coupon: { updatedAt: "desc" } },
        take: 20,
    });

    const targetedProductIds = new Set(targeted.map((item) => item.product.id));

    // 2. Store-wide active coupons (where shop owner selected "All products" so products relation is empty)
    const storeWideCoupons = await prisma.coupon.findMany({
        where: {
            isActive: true,
            type: { in: ["PERCENTAGE", "FIXED_AMOUNT"] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            shop: { status: "ACTIVE", deletedAt: null },
            products: { none: {} },
        },
        select: {
            id: true,
            code: true,
            type: true,
            value: true,
            minOrderAmount: true,
            expiresAt: true,
            shop: {
                select: {
                    id: true,
                    slug: true,
                    profile: { select: { name: true } },
                    products: {
                        where: {
                            status: "ACTIVE",
                            deletedAt: null,
                            stock: { gt: 0 },
                        },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            basePrice: true,
                            images: { take: 1, orderBy: { isPrimary: "desc" }, select: { url: true } },
                        },
                        take: 6,
                        orderBy: { updatedAt: "desc" },
                    },
                },
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
    });

    const storeWidePromotions: Array<{
        coupon: { id: string; code: string; type: any; value: any; minOrderAmount: any; expiresAt: Date | null };
        product: { id: string; name: string; slug: string; basePrice: any; shop: { slug: string; profile: { name: string } | null }; images: Array<{ url: string }> };
    }> = [];

    for (const item of storeWideCoupons) {
        for (const prod of item.shop.products) {
            if (!targetedProductIds.has(prod.id)) {
                targetedProductIds.add(prod.id);
                storeWidePromotions.push({
                    coupon: {
                        id: item.id,
                        code: item.code,
                        type: item.type,
                        value: item.value,
                        minOrderAmount: item.minOrderAmount,
                        expiresAt: item.expiresAt,
                    },
                    product: {
                        id: prod.id,
                        name: prod.name,
                        slug: prod.slug,
                        basePrice: prod.basePrice,
                        shop: {
                            slug: item.shop.slug,
                            profile: item.shop.profile,
                        },
                        images: prod.images,
                    },
                });
            }
        }
    }

    return [...targeted, ...storeWidePromotions].slice(0, 24);
};

export const listActivePublicCouponsRepository = async () => {
    const now = new Date();
    return prisma.coupon.findMany({
        where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            shop: { status: "ACTIVE", deletedAt: null },
        },
        select: {
            id: true,
            code: true,
            type: true,
            value: true,
            minOrderAmount: true,
            expiresAt: true,
            shop: {
                select: {
                    id: true,
                    slug: true,
                    profile: { select: { name: true } },
                },
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
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
            OR: [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ],
        }),
    };

    const paginateInDatabase = sort !== "rating" && !minRating;
    const productQuery = prisma.product.findMany({
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
                        coupons: {
                            where: {
                                isActive: true,
                                products: { none: {} },
                                type: { in: ["PERCENTAGE", "FIXED_AMOUNT"] },
                                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                            },
                            select: { code: true, type: true, value: true, minOrderAmount: true, expiresAt: true },
                            take: 1,
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
                coupons: {
                    where: { coupon: { isActive: true, type: { in: ["PERCENTAGE", "FIXED_AMOUNT"] }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } },
                    select: { coupon: { select: { code: true, type: true, value: true, minOrderAmount: true, expiresAt: true } } },
                    take: 1,
                },
            },
            orderBy: sort === "rating" ? { createdAt: "desc" } : { [sort]: order },
            ...(paginateInDatabase ? { skip, take } : {}),
        });

    const [productsWithRatings, totalCount] = paginateInDatabase
        ? await Promise.all([productQuery, prisma.product.count({ where })])
        : [await productQuery, undefined];

    const ratedProducts = productsWithRatings.map(({ reviews, coupons, ...product }) => {
        const reviewCount = reviews.length;
        const averageRating = reviewCount ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0;
        const directPromo = coupons[0]?.coupon;
        const shopPromo = (product as any).shop?.coupons?.[0];
        const promotion = directPromo || shopPromo || null;
        return { ...product, averageRating: Number(averageRating.toFixed(1)), reviewCount, promotion };
    }).filter((product) => !minRating || product.averageRating >= minRating);
    if (sort === "rating") ratedProducts.sort((a, b) => order === "asc" ? a.averageRating - b.averageRating : b.averageRating - a.averageRating);

    return {
        products: paginateInDatabase ? ratedProducts : ratedProducts.slice(skip, skip + take),
        total: paginateInDatabase ? totalCount! : ratedProducts.length,
        categoryBreadcrumb,
    };
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
