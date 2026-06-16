import { StringDecoder } from "node:string_decoder";
import { prisma } from "../../config/db.js";
import { CreateProductData, GetShopProductsOptions } from "./product.types.js";

export const findCategoryById = async (categoryId: string) => {
    return prisma.productCategory.findUnique({
        where: { id: categoryId },
        select: {
            id: true,
            shopId: true,
        },
    });
};

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
            name: data.name,
            slug: data.slug,
            description: data.description,
            sku: data.sku,
            basePrice: data.basePrice,
            stock: data.stock,
            type: data.type,
            status: "DRAFT",
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
                sku: true,
                basePrice: true,
                stock: true,
                type: true,
                status: true,
                categoryId: true,
                createdAt: true,
                images: {
                    where: { isPrimary: true },
                    select: { url: true },
                    take: 1,
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
