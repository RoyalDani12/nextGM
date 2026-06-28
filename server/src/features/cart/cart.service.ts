import { totalmem } from "node:os";
import { AppError } from "../../middleware/appError.js";
import { findPublicProductById } from "../product/product.repository.js";
import {
    deleteCartItem,
    findCartItemById,
    findVariantById,
    getCartWithItems,
    getOrCreateCart,
    updateCartItemQuantity,
    upsertCartItem,
} from "./cart.repository.js";

interface AddToCartInput {
    productId: string;
    variantId?: string;
    quantity: number;
}

export const addToCartService = async (userId: string, body: AddToCartInput) => {
    const { productId, variantId, quantity } = body;

    const product = await findPublicProductById(productId);

    if (!product) {
        throw new AppError("Product not found.", 404);
    }

    if (variantId) {
        const variant = await findVariantById(variantId, productId);

        if (!variant) {
            throw new AppError("Variant not found.", 404);
        }

        if (variant.stock < quantity) {
            throw new AppError(`Insufficient stock. Only ${variant.stock} available.`, 400);
        }
    } else {
        if (product.stock < quantity) {
            throw new AppError(`Insufficient stock. Only ${product.stock} available.`, 400);
        }
    }

    const cart = await getOrCreateCart(userId);

    const cartItem = await upsertCartItem(cart.id, productId, quantity, variantId);

    return cartItem;
};

export const getCartService = async (userId: string) => {
    const cart = await getCartWithItems(userId);

    if (!cart || cart.items.length === 0) {
        return {
            items: [],
            groupedBy: [],
            totalItems: 0,
            totalPrice: "0.00",
        };
    }

    // group items by shop for multi-shop display
    const shopMap: Record<
        string,
        {
            shop: { slug: string; name: string };
            items: any[];
            subtotal: number;
        }
    > = {};

    for (const item of cart.items) {
        const shopSlug = item.product.shop.slug;
        const shopName = item.product.shop.profile?.name ?? "Unknown shop";

        // skip unavaliable items ( product archived or shop closed)
        const isAvailable =
            item.product.status === "ACTIVE" && item.product.shop.status === "ACTIVE";

        if (!shopMap[shopSlug]) {
            shopMap[shopSlug] = {
                shop: { slug: shopSlug, name: shopName },
                items: [],
                subtotal: 0,
            };
        }

        const unitPrice = item.variant
            ? Number(item.variant.price)
            : Number(item.product.basePrice);
        const lineTotal = unitPrice * item.quantity;

        shopMap[shopSlug].items.push({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            productSlug: item.product.slug,
            variantId: item.variant?.id ?? null,
            variantName: item.variant?.name ?? null,
            unitePrice: unitPrice.toFixed(2),
            quantity: item.quantity,
            lineToal: lineTotal.toFixed(2),
            image: item.product.images[0]?.url ?? null,
            isAvailable,
        });

        if (isAvailable) {
            shopMap[shopSlug].subtotal += lineTotal;
        }
    }
    const groupedBy = Object.values(shopMap).map((group) => ({
        ...group,
        subtotal: group.subtotal.toFixed(2),
    }));

    const totalPrice = groupedBy.reduce((sum, g) => sum + Number(g.subtotal), 0).toFixed(2);

    return {
        items: cart.items.length,
        groupedBy,
        totalItems: cart.items.length,
        totalPrice,
    };
};

export const updateCartItemService = async(
    userId:string,
    itemId:string,
    quantity:number
)=>{
       // find Item and verify OwnerShip
    const  item = await findCartItemById(itemId,userId)

    if(!item){
        throw new AppError("Cart Item Not found.",404)
    }


    // check stock
    const availableStock = item.variant ? item.variant.stock : item.product.stock

    if(availableStock < quantity){
        throw new AppError(
            `Insufficint stock. only ${availableStock} avaliable.`,
            400
        )
    }

    return updateCartItemQuantity(itemId,quantity)
}

export const removeCartItemService = async(userId:string,itemId:string)=>{

     const item = await findCartItemById(itemId,userId)

      if (!item) {
        throw new AppError("Cart item not found.", 404)
    }

    await deleteCartItem(itemId)
    return {
        message:"Item removed from cart."
    }

}