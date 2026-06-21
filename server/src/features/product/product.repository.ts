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

export const findProductById = async (productId: string) => {
    return prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            shopId: true,
            name: true,
            slug: true,
            categoryId: true,
            sku: true,
            status: true,
            deletedAt: true,
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
        sku: string;
    }>,
) => {
    return prisma.product.update({
        where: { id: productId },
        data,
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

export const softDeleteProductRepository = async(productId:string)=>{
    return prisma.product.update({
        where:{ id: productId },
        data:{
            deletedAt:new Date(),
            status:"ARCHIVED",
        },
        select:{ id:true }
    })
}
